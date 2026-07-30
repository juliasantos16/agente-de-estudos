"""Pipeline assíncrono de ingestão: PDF → chunks → embeddings → Qdrant."""

from __future__ import annotations

import asyncio
import hashlib
import io
import ipaddress
import logging
import socket
import uuid
from typing import BinaryIO
from urllib.parse import urlparse

import httpx
from pypdf import PdfReader
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import (
    CHUNK_OVERLAP,
    CHUNK_SIZE,
    COLLECTION_NAME,
    MAX_RETRIES,
    MAX_URL_DOWNLOAD_SIZE,
    QDRANT_API_KEY,
    QDRANT_URL,
    RETRY_BACKOFF,
    EMBEDDING_MODEL,
)
from app.llm.llm_client import get_openai_client, retry_openai

logger = logging.getLogger(__name__)
MAX_DOWNLOAD_SIZE = MAX_URL_DOWNLOAD_SIZE
RETRYABLE_QDRANT_EXCEPTIONS = (httpx.TimeoutException, httpx.NetworkError)


_default_qdrant: AsyncQdrantClient | None = None


def get_qdrant_client(url: str | None = None, api_key: str | None = None) -> AsyncQdrantClient:
    """Retorna o cliente Qdrant assíncrono padrão (singleton lazy).

    Sem argumentos, retorna uma única instância compartilhada entre os
    módulos do pacote ``app.rag`` (evita conexões/clientes duplicados).
    Passe ``url``/``api_key`` explicitamente para injeção em testes.
    """
    global _default_qdrant
    if url is not None or api_key is not None:
        return AsyncQdrantClient(url=url, api_key=api_key)
    if _default_qdrant is None:
        _default_qdrant = AsyncQdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    return _default_qdrant


# Instância compartilhada — o construtor do Qdrant não valida credenciais
# nem faz I/O, então é seguro instanciar aqui (ao contrário do cliente OpenAI,
# que valida a API key no construtor — por isso é obtido sob demanda via
# get_openai_client()).
qdrant = get_qdrant_client()


def extract_text_from_pdf(file_bytes: bytes | BinaryIO) -> str:
    """Extrai o texto bruto de um PDF."""
    reader = PdfReader(file_bytes)
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[dict[str, str | int]]:
    """Fatia texto em chunks de palavras com sobreposição."""
    if chunk_size <= 0 or overlap < 0 or overlap >= chunk_size:
        raise ValueError("chunk_size deve ser positivo e overlap menor que chunk_size.")
    words = text.split()
    chunks: list[dict[str, str | int]] = []
    for index, start in enumerate(range(0, len(words), chunk_size - overlap)):
        value = " ".join(words[start : start + chunk_size])
        if value:
            chunks.append({"text": value, "chunk_index": index})
    return chunks


@retry_openai
async def generate_embeddings(texts: list[str], client=None) -> list[list[float]]:
    """Gera embeddings em batch via OpenAI."""
    active_client = client or get_openai_client()
    response = await active_client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
    return [item.embedding for item in response.data]


@retry(
    retry=retry_if_exception_type(RETRYABLE_QDRANT_EXCEPTIONS),
    stop=stop_after_attempt(MAX_RETRIES),
    wait=wait_exponential(multiplier=RETRY_BACKOFF, min=RETRY_BACKOFF, max=RETRY_BACKOFF * 4),
    reraise=True,
)
async def ensure_collection_exists(client: AsyncQdrantClient | None = None) -> None:
    """Cria a collection, se necessário."""
    active_client = client or qdrant
    collections = [collection.name for collection in (await active_client.get_collections()).collections]
    if COLLECTION_NAME not in collections:
        await active_client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
        )
        logger.info("Collection '%s' criada no Qdrant.", COLLECTION_NAME)
    else:
        logger.info("Collection '%s' já existe.", COLLECTION_NAME)


def _deterministic_id(text: str) -> str:
    """Gera UUID determinístico baseado em SHA-256 para idempotência."""
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, digest))


@retry(
    retry=retry_if_exception_type(RETRYABLE_QDRANT_EXCEPTIONS),
    stop=stop_after_attempt(MAX_RETRIES),
    wait=wait_exponential(multiplier=RETRY_BACKOFF, min=RETRY_BACKOFF, max=RETRY_BACKOFF * 4),
    reraise=True,
)
async def _upsert_points(client: AsyncQdrantClient, points: list[PointStruct]) -> None:
    await client.upsert(collection_name=COLLECTION_NAME, points=points)


async def ingest_document(
    file_bytes: bytes | BinaryIO,
    filename: str,
    source: str | None = None,
    *,
    openai: object | None = None,
    qdrant_client: AsyncQdrantClient | None = None,
) -> dict[str, object]:
    """Executa o pipeline completo de ingestão de um PDF."""
    active_qdrant = qdrant_client or qdrant
    await ensure_collection_exists(active_qdrant)
    raw_text = extract_text_from_pdf(file_bytes)
    if not raw_text.strip():
        return {"status": "error", "detail": "Nenhum texto extraído do PDF."}

    chunks = chunk_text(raw_text)
    texts = [str(chunk["text"]) for chunk in chunks]
    embeddings = await generate_embeddings(texts, client=openai)
    points = [
        PointStruct(
            id=_deterministic_id(str(chunk["text"])),
            vector=embedding,
            payload={
                "text": chunk["text"], "chunk_index": chunk["chunk_index"],
                "source": source or filename, "filename": filename,
            },
        )
        for chunk, embedding in zip(chunks, embeddings)
    ]
    for start in range(0, len(points), 100):
        await _upsert_points(active_qdrant, points[start : start + 100])
    logger.info("Documento '%s' ingerido com %d chunks.", filename, len(chunks))
    return {"status": "ok", "filename": filename, "total_chunks": len(chunks),
            "total_characters": len(raw_text), "collection": COLLECTION_NAME}


def _is_blocked_address(ip_str: str) -> bool:
    """Verifica se um endereço IP aponta para redes internas/privadas.

    Usado para impedir SSRF (Server-Side Request Forgery): sem essa checagem,
    qualquer pessoa poderia usar o endpoint de ingestão por URL para fazer a
    API acessar serviços internos (ex.: o próprio Qdrant, metadados de nuvem
    em 169.254.169.254, ou serviços em localhost) que não deveriam ser
    expostos por essa via.
    """
    ip = ipaddress.ip_address(ip_str)
    return (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_reserved
        or ip.is_multicast
        or ip.is_unspecified
    )


async def _validate_public_host(hostname: str) -> str | None:
    """Resolve o host e garante que nenhum endereço resultante é interno.

    Retorna uma mensagem de erro (ou ``None`` se o host for válido).
    """
    try:
        infos = await asyncio.to_thread(socket.getaddrinfo, hostname, None)
    except socket.gaierror as exc:
        return f"Não foi possível resolver o host '{hostname}': {exc}"
    for family, _, _, _, sockaddr in infos:
        ip_str = sockaddr[0]
        try:
            if _is_blocked_address(ip_str):
                return f"URL aponta para um endereço de rede interno/privado ({ip_str}), não permitido."
        except ValueError:
            return f"Endereço IP inválido resolvido para '{hostname}'."
    return None


async def ingest_from_url(url: str) -> dict[str, object]:
    """Baixa um PDF com limites de rede/tamanho e o ingere."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return {"status": "error", "detail": "Apenas URLs http:// ou https:// são aceitas."}
    if not parsed.hostname:
        return {"status": "error", "detail": "URL inválida: host ausente."}

    host_error = await _validate_public_host(parsed.hostname)
    if host_error:
        return {"status": "error", "detail": host_error}

    filename = parsed.path.split("/")[-1] or "documento_url.pdf"
    if not filename.lower().endswith(".pdf"):
        filename += ".pdf"
    limits = httpx.Limits(max_connections=5, max_keepalive_connections=2)
    try:
        # follow_redirects=False é intencional: seguir redirecionamentos
        # automaticamente permitiria contornar a validação de host acima
        # (ex.: uma URL pública que redireciona para um IP interno).
        async with httpx.AsyncClient(timeout=30.0, limits=limits, follow_redirects=False) as client:
            async with client.stream("GET", url) as response:
                if response.is_redirect:
                    return {
                        "status": "error",
                        "detail": "URL retornou um redirecionamento; envie a URL final e direta do PDF.",
                    }
                response.raise_for_status()
                declared_size = response.headers.get("content-length")
                try:
                    is_too_large = declared_size is not None and int(declared_size) > MAX_DOWNLOAD_SIZE
                except ValueError:
                    is_too_large = False
                if is_too_large:
                    return {"status": "error", "detail": "Arquivo excede o limite de download de 50 MB."}
                content_type = response.headers.get("content-type", "")
                if "pdf" not in content_type and "octet-stream" not in content_type:
                    return {"status": "error", "detail": f"URL não retornou PDF. Content-Type: {content_type}"}
                data = bytearray()
                async for part in response.aiter_bytes():
                    data.extend(part)
                    if len(data) > MAX_DOWNLOAD_SIZE:
                        return {"status": "error", "detail": "Arquivo excede o limite de download de 50 MB."}
    except httpx.HTTPStatusError as exc:
        return {"status": "error", "detail": f"Erro HTTP ao baixar: {exc.response.status_code}"}
    except httpx.RequestError as exc:
        return {"status": "error", "detail": f"Erro de conexão: {exc}"}
    return await ingest_document(io.BytesIO(data), filename, source=url)

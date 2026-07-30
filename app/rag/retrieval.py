"""Etapa de retrieval do pipeline RAG."""

from __future__ import annotations

import httpx
from qdrant_client import AsyncQdrantClient
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import COLLECTION_NAME, EMBEDDING_MODEL, MAX_RETRIES, RETRY_BACKOFF, TOP_K
from app.llm.llm_client import get_openai_client, retry_openai
from app.rag.ingest import qdrant  # reusa a mesma instância singleton do Qdrant


@retry_openai
async def embed_query(query: str, client=None) -> list[float]:
    """Gera o embedding da pergunta do estudante."""
    response = await (client or get_openai_client()).embeddings.create(model=EMBEDDING_MODEL, input=[query])
    return response.data[0].embedding


@retry(
    retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError)),
    stop=stop_after_attempt(MAX_RETRIES),
    wait=wait_exponential(multiplier=RETRY_BACKOFF, min=RETRY_BACKOFF, max=RETRY_BACKOFF * 4),
    reraise=True,
)
async def retrieve_chunks(
    query_embedding: list[float], top_k: int = TOP_K, client: AsyncQdrantClient | None = None
) -> list[dict[str, object]]:
    """Busca os chunks mais similares no Qdrant."""
    results = await (client or qdrant).search(
        collection_name=COLLECTION_NAME, query_vector=query_embedding, limit=top_k
    )
    return [
        {"text": hit.payload.get("text", ""), "source": hit.payload.get("source", "desconhecido"),
         "score": round(hit.score, 4), "chunk_index": hit.payload.get("chunk_index", -1)}
        for hit in results
    ]

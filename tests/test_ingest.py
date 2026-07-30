import io

import pytest

from app.rag.ingest import (
    _deterministic_id,
    _is_blocked_address,
    chunk_text,
    extract_text_from_pdf,
    ingest_from_url,
)


def test_extract_text_from_pdf_returns_text(pdf_bytes):
    assert "Texto de teste" in extract_text_from_pdf(io.BytesIO(pdf_bytes))


def test_chunk_text_has_overlap():
    chunks = chunk_text(" ".join(f"palavra{i}" for i in range(12)), chunk_size=5, overlap=2)
    assert len(chunks) == 4
    assert chunks[0]["text"].split()[-2:] == chunks[1]["text"].split()[:2]


def test_chunk_text_empty_returns_empty_list():
    assert chunk_text("") == []


def test_deterministic_id_is_idempotent():
    assert _deterministic_id("mesmo texto") == _deterministic_id("mesmo texto")


def test_deterministic_id_changes_with_content():
    assert _deterministic_id("texto um") != _deterministic_id("texto dois")


@pytest.mark.parametrize(
    "ip,blocked",
    [
        ("127.0.0.1", True),        # loopback
        ("169.254.169.254", True),  # link-local / metadados de nuvem
        ("10.0.0.5", True),         # rede privada
        ("192.168.1.1", True),      # rede privada
        ("0.0.0.0", True),         # unspecified
        ("8.8.8.8", False),         # IP público
        ("1.1.1.1", False),         # IP público
    ],
)
def test_is_blocked_address(ip, blocked):
    assert _is_blocked_address(ip) is blocked


@pytest.mark.asyncio
async def test_ingest_from_url_rejects_non_http_scheme():
    result = await ingest_from_url("ftp://example.com/arquivo.pdf")
    assert result["status"] == "error"


@pytest.mark.asyncio
async def test_ingest_from_url_rejects_internal_host():
    result = await ingest_from_url("http://127.0.0.1:6333/collections")
    assert result["status"] == "error"
    assert "interno" in result["detail"] or "resolver" in result["detail"]


@pytest.mark.asyncio
async def test_ingest_from_url_rejects_localhost_by_name():
    result = await ingest_from_url("http://localhost/arquivo.pdf")
    assert result["status"] == "error"

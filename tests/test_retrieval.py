from types import SimpleNamespace

import pytest

from app.rag.retrieval import embed_query, retrieve_chunks


@pytest.mark.asyncio
async def test_embed_query_uses_injected_client(mock_openai):
    assert await embed_query("pergunta", client=mock_openai) == [0.1, 0.2]


@pytest.mark.asyncio
async def test_retrieve_chunks_maps_qdrant_hits(mock_qdrant):
    mock_qdrant.search.return_value = [SimpleNamespace(payload={"text": "trecho", "source": "pdf", "chunk_index": 1}, score=0.98765)]
    chunks = await retrieve_chunks([0.1, 0.2], client=mock_qdrant)
    assert chunks == [{"text": "trecho", "source": "pdf", "score": 0.9877, "chunk_index": 1}]

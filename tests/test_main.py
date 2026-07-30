from types import SimpleNamespace
from unittest.mock import AsyncMock

from fastapi.testclient import TestClient

from app.api import main


def test_health_stats_and_query(monkeypatch):
    monkeypatch.setattr(main, "ensure_collection_exists", AsyncMock())
    monkeypatch.setattr(main, "seed_documents", AsyncMock(return_value=[]))
    main.qdrant.get_collections = AsyncMock()
    main.qdrant.get_collection = AsyncMock(return_value=SimpleNamespace(points_count=3, status="green"))
    monkeypatch.setattr(main, "query_rag", AsyncMock(return_value={"answer": "ok", "sources": [], "chunks_used": 0}))
    with TestClient(main.app) as client:
        assert client.get("/health").status_code == 200
        assert client.get("/stats").json()["total_points"] == 3
        assert client.post("/query", json={"question": "Pergunta válida"}).json()["answer"] == "ok"

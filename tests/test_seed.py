import pytest

from app.database import seed


@pytest.mark.asyncio
async def test_seed_documents_empty_folder_returns_empty(tmp_path, monkeypatch):
    async def no_collection():
        return None
    monkeypatch.setattr(seed, "ensure_collection_exists", no_collection)
    assert await seed.seed_documents(str(tmp_path)) == []


@pytest.mark.asyncio
async def test_seed_documents_invalid_pdf_returns_error(tmp_path, monkeypatch):
    async def no_collection():
        return None
    (tmp_path / "invalid.pdf").write_text("não é um PDF", encoding="utf-8")
    monkeypatch.setattr(seed, "ensure_collection_exists", no_collection)
    result = await seed.seed_documents(str(tmp_path))
    assert result[0]["status"] == "error"

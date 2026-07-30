"""Ingestão em batch assíncrona dos PDFs da pasta ``docs/``."""

from __future__ import annotations

import io
import logging
import os
from pathlib import Path

from app.rag.ingest import ensure_collection_exists, ingest_document

logger = logging.getLogger(__name__)
DOCS_DIR = os.getenv("DOCS_DIR", "docs")


async def seed_documents(docs_dir: str = DOCS_DIR) -> list[dict[str, object]]:
    """Encontra e ingere PDFs de forma idempotente, retornando um resultado por arquivo."""
    await ensure_collection_exists()
    pdf_files = sorted(Path(docs_dir).rglob("*.pdf"))
    if not pdf_files:
        logger.warning("Nenhum PDF encontrado em '%s/'.", docs_dir)
        return []
    logger.info("Encontrados %d PDFs em '%s/'.", len(pdf_files), docs_dir)
    results: list[dict[str, object]] = []
    for pdf_path in pdf_files:
        logger.info("Ingerindo: %s", pdf_path.name)
        try:
            result = await ingest_document(io.BytesIO(pdf_path.read_bytes()), pdf_path.name, source=str(pdf_path))
            results.append(result)
            logger.info("Resultado para %s: %s", pdf_path.name, result.get("status"))
        except Exception as exc:
            logger.exception("Erro ao ingerir %s", pdf_path.name)
            results.append({"status": "error", "filename": pdf_path.name, "detail": str(exc)})
    logger.info("Seed completo: %d/%d arquivos ingeridos.", sum(r.get("status") == "ok" for r in results), len(results))
    return results


if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_documents())

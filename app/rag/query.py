"""Compatibilidade retroativa: funções de consulta agora vivem em módulos dedicados."""

from app.rag.generation import SYSTEM_PROMPT, build_augmented_prompt, generate_answer, query_rag
from app.rag.retrieval import embed_query, qdrant, retrieve_chunks

__all__ = [
    "SYSTEM_PROMPT", "build_augmented_prompt", "embed_query", "generate_answer",
    "qdrant", "query_rag", "retrieve_chunks",
]

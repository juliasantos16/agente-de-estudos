"""Etapa de geração e orquestração do pipeline RAG."""

from __future__ import annotations

from app.core.config import LLM_MODEL
from app.llm.llm_client import get_openai_client, retry_openai
from app.rag.retrieval import embed_query, retrieve_chunks

SYSTEM_PROMPT = """Você é um agente de estudos especializado em Engenharia de Dados e Inteligência Artificial.

Seu papel:
- Responder perguntas com base EXCLUSIVAMENTE nos trechos de documentos fornecidos no contexto.
- Explicar conceitos de forma clara, com exemplos práticos quando possível.
- Se a informação não estiver no contexto, diga explicitamente que não encontrou nos materiais disponíveis.
- Sempre indique de qual fonte/documento veio a informação.
- Use linguagem técnica mas acessível — o público está em transição de carreira.

Idioma: Português brasileiro."""


def build_augmented_prompt(query: str, chunks: list[dict[str, object]]) -> str:
    """Monta o contexto recuperado e a pergunta para o LLM."""
    context = "\n\n---\n\n".join(
        f"[Trecho {index} | Fonte: {chunk['source']} | Relevância: {chunk['score']}]\n{chunk['text']}"
        for index, chunk in enumerate(chunks, 1)
    )
    return f"""Com base nos trechos de documentos abaixo, responda à pergunta do estudante.

═══ CONTEXTO RECUPERADO ═══

{context}

═══ PERGUNTA ═══

{query}

═══ INSTRUÇÃO ═══

Responda usando APENAS as informações do contexto acima. Se a resposta não estiver no contexto, diga claramente."""


@retry_openai
async def generate_answer(augmented_prompt: str, client=None) -> str:
    """Envia o prompt aumentado ao LLM e retorna a resposta gerada."""
    response = await (client or get_openai_client()).chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": augmented_prompt}],
        temperature=0.3,
        max_tokens=1500,
    )
    return response.choices[0].message.content or ""


async def query_rag(question: str, *, openai=None, qdrant_client=None) -> dict[str, object]:
    """Orquestra embedding, retrieval e geração sem alterar o contrato público."""
    embedding = await embed_query(question, client=openai)
    chunks = await retrieve_chunks(embedding, client=qdrant_client)
    if not chunks:
        return {"answer": "Não encontrei informações relevantes nos materiais disponíveis. Tente reformular a pergunta ou ingira mais documentos.", "sources": [], "chunks_used": 0}
    answer = await generate_answer(build_augmented_prompt(question, chunks), client=openai)
    return {"answer": answer, "sources": list(set(str(chunk["source"]) for chunk in chunks)),
            "chunks_used": len(chunks), "retrieved_chunks": chunks}

import pytest

from app.rag.generation import build_augmented_prompt, generate_answer


def test_build_augmented_prompt_includes_context_and_question():
    prompt = build_augmented_prompt("O que é RAG?", [{"text": "RAG usa retrieval", "source": "a.pdf", "score": 0.9}])
    assert "O que é RAG?" in prompt and "RAG usa retrieval" in prompt and "a.pdf" in prompt


@pytest.mark.asyncio
async def test_generate_answer_uses_injected_client(mock_openai):
    assert await generate_answer("prompt", client=mock_openai) == "Resposta simulada"

"""Fábrica de clientes OpenAI e política de retry para chamadas remotas."""

from collections.abc import Callable
from typing import Any

import httpx
from openai import APIConnectionError, APITimeoutError, AsyncOpenAI
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import MAX_RETRIES, OPENAI_API_KEY, RETRY_BACKOFF

_default_client: AsyncOpenAI | None = None


def get_openai_client(api_key: str | None = None) -> AsyncOpenAI:
    """Retorna o cliente OpenAI assíncrono padrão (singleton lazy).

    Sem argumentos, o cliente só é instanciado na primeira chamada — não na
    importação do módulo. Isso evita que a aplicação inteira falhe ao subir
    (ou os testes falhem na coleta) apenas por ``OPENAI_API_KEY`` ainda não
    estar definida, já que o SDK da OpenAI valida a chave no construtor.
    Passe ``api_key`` explicitamente para injeção em testes/uso avulso —
    nesse caso um cliente novo e independente é sempre criado.
    """
    global _default_client
    if api_key is not None:
        return AsyncOpenAI(api_key=api_key)
    if _default_client is None:
        _default_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    return _default_client


RETRYABLE_OPENAI_EXCEPTIONS = (APIConnectionError, APITimeoutError, httpx.TimeoutException, httpx.NetworkError)


def retry_openai(func: Callable[..., Any]) -> Callable[..., Any]:
    """Aplica retry somente a falhas transitórias de rede/timeout."""
    return retry(
        retry=retry_if_exception_type(RETRYABLE_OPENAI_EXCEPTIONS),
        stop=stop_after_attempt(MAX_RETRIES),
        wait=wait_exponential(multiplier=RETRY_BACKOFF, min=RETRY_BACKOFF, max=RETRY_BACKOFF * 4),
        reraise=True,
    )(func)

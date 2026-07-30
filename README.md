# Agente de estudos RAG

Uma aplicação full-stack de estudos baseada em **Retrieval-Augmented Generation (RAG)**. Usuários podem enviar materiais em PDF, consultar uma base vetorial e receber respostas fundamentadas nos trechos recuperados, com as fontes utilizadas.

## Demonstração

O projeto possui uma interface web para perguntas, upload de PDFs, ingestão por URL, histórico local de conversas e visualização dos trechos que embasaram cada resposta.

## Principais funcionalidades

- Ingestão de PDFs por upload, URL pública ou pela pasta `docs/`.
- Extração de texto, chunking com sobreposição e embeddings da OpenAI.
- Armazenamento e busca semântica com Qdrant.
- Respostas RAG em português, com fontes e trechos recuperados.
- Limite de 50 MB para downloads por URL e validação de conteúdo.
- Clientes assíncronos, retry com backoff exponencial e logging centralizado.
- Interface React responsiva com status da API, histórico e métricas da coleção.

## Arquitetura

```text
React + Vite (frontend)
        │ HTTP
        ▼
FastAPI (API RAG)
        ├── OpenAI: embeddings e geração
        └── Qdrant: vetores e busca por similaridade
```

## Tecnologias

**Backend:** Python, FastAPI, OpenAI, Qdrant, pypdf, httpx, tenacity e Pydantic.

**Frontend:** React, TypeScript, Vite, TanStack Start, Tailwind CSS e shadcn/ui.

**Infraestrutura:** Docker Compose, Qdrant local e Render.



## Testes

```bash
pytest -q
```

A suíte usa mocks de OpenAI e Qdrant e cobre ingestão, retrieval, geração, seed e endpoints principais.

## Estrutura

```text
study_agent/
├── app/                 # Código da API, organizado por responsabilidade
│   ├── api/             # Rotas FastAPI
│   ├── rag/             # Ingestão, retrieval e geração
│   ├── llm/             # Cliente OpenAI
│   ├── core/            # Configurações e logging
│   └── database/        # Seed dos documentos
├── frontend/            # Interface React
├── tests/               # Testes automatizados
└── docker-compose.yml   # Ambiente local com Qdrant
```

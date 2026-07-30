# agente de estudos RAG

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

## Executar localmente

### 1. Backend

Na raiz do projeto, crie o arquivo de configuração e informe suas credenciais:

```bash
cp .env.example .env
```

No Windows PowerShell, use `Copy-Item .env.example .env`. Em seguida, preencha `OPENAI_API_KEY`, `QDRANT_URL` e `QDRANT_API_KEY` no `.env`.

Instale as dependências e inicie a API:

```bash
python -m pip install -r requirements.txt
uvicorn app.api.main:app --reload
```

A documentação interativa estará em `http://127.0.0.1:8000/docs`.

### 2. Frontend

Em outro terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Abra `http://localhost:5173`. O frontend usa `http://127.0.0.1:8000` por padrão; ajuste `VITE_API_URL` em `frontend/.env` para usar uma API publicada.

### 3. Qdrant local com Docker (opcional)

```bash
docker compose up --build
```

Nesse modo, configure `QDRANT_URL=http://qdrant:6333` para o container da API.

## Endpoints principais

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/query` | Consulta a base RAG. |
| `POST` | `/ingest` | Envia um arquivo PDF. |
| `POST` | `/ingest/url` | Baixa e ingere um PDF público. |
| `POST` | `/seed` | Processa PDFs existentes em `docs/`. |
| `GET` | `/health` | Verifica a conectividade com o Qdrant. |
| `GET` | `/stats` | Exibe métricas da coleção vetorial. |

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

## Segurança

As chaves ficam exclusivamente em `.env`, que não é versionado. Use `.env.example` como modelo e nunca publique credenciais no repositório.

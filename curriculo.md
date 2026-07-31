# Agente de Estudos RAG - Descrição para Currículo / LinkedIn

## Visão Geral do Projeto
**Nome do Projeto:** Agente de Estudos RAG (Retrieval-Augmented Generation)
**Papel:** Desenvolvedor Python / AI Engineer / Engenheiro de Machine Learning / Cientista de Dados

Desenvolvi uma aplicação full-stack de estudos corporativos focada em Engenharia de Dados e Inteligência Artificial, utilizando arquitetura **RAG (Retrieval-Augmented Generation)**. O sistema permite que os usuários façam upload de materiais de estudo em PDF (via upload direto, URL pública ou diretórios internos) e interajam com um assistente virtual capaz de responder perguntas baseadas exclusivamente no contexto dos documentos ingeridos. A solução foi projetada com alta resiliência, utilizando chamadas assíncronas, mecanismos de tolerância a falhas (retry com exponential backoff) e prevenção contra ataques SSRF na ingestão por URL.

## Principais Responsabilidades e Implementações (Foco em Backend / IA)

*   **Arquitetura e Desenvolvimento RAG (Python):**
    *   Implementação do pipeline completo de RAG utilizando **Python**, orquestrando o fluxo desde o processamento de texto até a geração da resposta.
    *   Desenvolvimento de lógicas de extração de texto de PDFs utilizando `pypdf`, além da criação de um sistema de "chunking" (fatiamento de textos) com sobreposição configurável (`chunk_size` e `chunk_overlap`) para manter o contexto semântico entre os parágrafos.
*   **Integração com LLMs (OpenAI):**
    *   Implementação de chamadas aos modelos da **OpenAI** (LLM e Embeddings) para transformar os blocos de texto estruturados em representações vetoriais de alta dimensão (1536 dimensões).
    *   Construção de um gerador de *Prompts Aumentados* (*Augmented Prompts*), combinando o histórico recuperado (`top_k` chunks) e a pergunta do usuário para alimentar o modelo de linguagem (GPT), assegurando que o assistente baseie suas respostas puramente nas informações documentadas.
*   **Banco de Dados Vetorial (Qdrant):**
    *   Integração profunda com o banco de dados vetorial **Qdrant** utilizando o cliente assíncrono (`AsyncQdrantClient`) para armazenamento dos *embeddings* e execução eficiente de buscas semânticas (similaridade por Cosseno).
    *   Geração de identificadores únicos determinísticos usando *hash* SHA-256 no conteúdo do texto (`uuid5`), garantindo idempotência e evitando a duplicação na inserção (upsert) dos trechos da base de conhecimento no vetor.
*   **Desenvolvimento de APIs (FastAPI):**
    *   Criação e estruturação da API utilizando o framework **FastAPI**, aproveitando a validação robusta de dados via **Pydantic** e recursos assíncronos (`async/await`) para gerenciar múltiplas conexões e suportar operações IO-bound (rede/disco).
*   **Resiliência, Escalabilidade e Segurança:**
    *   Implementação de estratégias de resiliência usando a biblioteca `tenacity` para *retries* automáticos (com *backoff* exponencial) em operações de rede do Qdrant e da OpenAI, garantindo robustez contra indisponibilidades passageiras de APIs externas.
    *   Na funcionalidade de ingestão por URL, implementei controles rígidos de segurança, com um validador proativo de host para identificar e barrar endereços IP internos (prevenção de SSRF - *Server-Side Request Forgery*).
    *   Gerenciamento eficiente de recursos de download (via `httpx`), limitando o tamanho dos arquivos a 50 MB, interceptando os *headers* e o fluxo contínuo de bytes (`stream`), e vetando redirecionamentos invisíveis por segurança.
*   **Boas Práticas e Testes:**
    *   Código fortemente tipado em Python e modularizado, separando camadas lógicas (`api`, `rag`, `llm`, `core`, `database`).
    *   Configuração do ambiente em **Docker** (utilizando `docker-compose.yml`) e CI/CD simulado, com toda a suite de testes coberta pelo **pytest**, incorporando `mocks` para validar serviços de terceiros (Qdrant e OpenAI).

## Tecnologias Utilizadas
*   **Linguagens e Frameworks:** Python, FastAPI, Pydantic, React, TypeScript.
*   **IA e Machine Learning:** RAG, OpenAI API (Modelos de Linguagem e Embeddings), Chunking Semântico.
*   **Bancos de Dados:** Qdrant (Vector Database).
*   **Ferramentas e Infraestrutura:** Docker, Docker Compose, Pytest, Httpx, Tenacity, PyPDF.

## Destaques para colocar no Currículo (Exemplos em Bullet Points)
*   **Engenharia de Dados e IA:** Idealizou e desenvolveu do zero uma arquitetura RAG (*Retrieval-Augmented Generation*), conectando modelos de linguagem LLM da OpenAI a um banco de dados vetorial (Qdrant) para respostas altamente contextualizadas.
*   **Desenvolvimento Backend (Python):** Desenvolveu a API assíncrona utilizando FastAPI, implementando ingestão de PDFs via file upload e URLs externas, processamento de NLP (chunking de documentos) e geração de vetores (*embeddings*).
*   **Resiliência e Segurança:** Adicionou camadas avançadas de tratamento de erros com *exponential backoffs* em chamadas de API (via `tenacity`) e implementou sistemas de segurança de rede (anti-SSRF) para downloads de documentos via URL limitados a 50 MB (via `httpx`).
*   **Qualidade de Código:** Garantiu a qualidade do software arquitetando de forma modular, aplicando tipagem estática e testes unitários automatizados com pytest, fazendo uso intensivo de "mocks" para os clientes OpenAI e Qdrant.
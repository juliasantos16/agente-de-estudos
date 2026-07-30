/** URL pública da API, configurada por VITE_API_URL em cada ambiente. */
const BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export interface HealthResponse {
  status: string;
  service: string;
  qdrant_connected: boolean;
}

export interface StatsResponse {
  collection: string;
  total_points: number;
  status: string;
}

export interface IngestResponse {
  status: string;
  filename: string;
  total_chunks: number;
  total_characters: number;
  collection: string;
  detail?: string;
}

export interface RetrievedChunk {
  text: string;
  source: string;
  score: number;
  chunk_index: number;
}

export interface QueryResponse {
  answer: string;
  sources: string[];
  chunks_used: number;
  retrieved_chunks: RetrievedChunk[];
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body && typeof body.detail === "string" ? body.detail : "";
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => fetch(`${BASE_URL}/health`).then(handle<HealthResponse>),
  stats: () => fetch(`${BASE_URL}/stats`).then(handle<StatsResponse>),
  query: (question: string) =>
    fetch(`${BASE_URL}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    }).then(handle<QueryResponse>),
  ingestFile: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetch(`${BASE_URL}/ingest`, { method: "POST", body: fd }).then(handle<IngestResponse>);
  },
  ingestUrl: (url: string) =>
    fetch(`${BASE_URL}/ingest/url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }).then(handle<IngestResponse>),
};

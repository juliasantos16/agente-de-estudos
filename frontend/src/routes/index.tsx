import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { QueryTab } from "@/components/QueryTab";
import { IngestTab } from "@/components/IngestTab";
import { HistorySidebar, type HistoryItem } from "@/components/HistorySidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { QueryResponse } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agente de Estudos — Engenharia de Dados & IA" },
      {
        name: "description",
        content:
          "Agente RAG para estudos de Engenharia de Dados e IA: pergunte, envie materiais e explore fontes.",
      },
      {
        property: "og:title",
        content: "Agente de Estudos — Engenharia de Dados & IA",
      },
      {
        property: "og:description",
        content:
          "Pergunte ao agente RAG e ingira PDFs ou URLs para expandir a base de conhecimento.",
      },
    ],
  }),
  component: Index,
});

const STORAGE_KEY = "rag_history_v1";

function Index() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [tab, setTab] = useState("query");

  const [preload, setPreload] = useState<{
    question: string;
    result: QueryResponse;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw) {
        setHistory(JSON.parse(raw));
      }
    } catch (error) {
      console.warn("Não foi possível carregar o histórico salvo:", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn("Não foi possível salvar o histórico:", error);
    }
  }, [history]);

  const handleAsk = (item: HistoryItem) => {
    setHistory((currentHistory) => [item, ...currentHistory].slice(0, 50));
  };

  const handleSelect = (item: HistoryItem) => {
    setTab("query");

    setPreload({
      question: item.question,
      result: {
        answer: item.answer,
        sources: item.sources,
        chunks_used: item.chunks_used,
        retrieved_chunks: item.retrieved_chunks,
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader online={online} setOnline={setOnline} onOpenSidebar={() => setSidebarOpen(true)} />

      {online === false && (
        <div className="bg-destructive/15 border-b border-destructive/30 text-destructive text-sm px-4 py-2 text-center flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4" />
          API offline — ações desabilitadas. Tentaremos reconectar em instantes.
        </div>
      )}

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-6 md:py-8 flex gap-6">
        <HistorySidebar
          items={history}
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          onSelect={handleSelect}
          onClear={() => setHistory([])}
        />

        <div className="flex-1 min-w-0">
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="glass-card !bg-[rgba(52,45,99,0.35)] p-1">
              <TabsTrigger
                value="query"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                💬 Perguntar
              </TabsTrigger>

              <TabsTrigger
                value="ingest"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                📄 Enviar Material
              </TabsTrigger>
            </TabsList>

            <TabsContent value="query" className="mt-6">
              <QueryTab online={online} onAskComplete={handleAsk} preload={preload} />
            </TabsContent>

            <TabsContent value="ingest" className="mt-6">
              <IngestTab online={online} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="mx-auto max-w-6xl w-full px-4 py-6 text-center text-xs text-muted-foreground">
        Powered by FastAPI + Qdrant + OpenAI
      </footer>
    </div>
  );
}

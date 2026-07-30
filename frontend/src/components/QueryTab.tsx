import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, FileText, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type QueryResponse } from "@/lib/api";
import type { HistoryItem } from "./HistorySidebar";

const SUGGESTIONS = [
  "O que é ETL?",
  "Explique Data Lake vs Data Warehouse",
  "Como funciona Apache Airflow?",
  "O que é RAG?",
  "Pra que serve um banco vetorial?",
];

function cleanAnswer(a: string) {
  return a.replace(/Trechos-fonte utilizados:[\s\S]*/i, "").trim();
}

interface Props {
  online: boolean | null;
  onAskComplete: (item: HistoryItem) => void;
  preload: { question: string; result: QueryResponse } | null;
}

export function QueryTab({ online, onAskComplete, preload }: Props) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [showChunks, setShowChunks] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (preload) {
      setQuestion(preload.question);
      setResult(preload.result);
    }
  }, [preload]);

  const canSubmit = question.trim().length >= 3 && !loading && online !== false;

  const ask = async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 3) {
      toast.error("A pergunta precisa ter pelo menos 3 caracteres.");
      return;
    }
    if (online === false) {
      toast.error("API offline. Tente novamente em instantes.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await api.query(trimmed);
      setResult(r);
      onAskComplete({
        id: crypto.randomUUID(),
        question: trimmed,
        answer: r.answer,
        sources: r.sources,
        retrieved_chunks: r.retrieved_chunks,
        chunks_used: r.chunks_used,
        timestamp: Date.now(),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao consultar o agente.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) ask(question);
    }
  };

  const cleanedAnswer = result ? cleanAnswer(result.answer) : "";

  return (
    <div className="flex flex-col gap-6">
      {/* Suggestions */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setQuestion(s);
              ask(s);
            }}
            disabled={loading || online === false}
            className="text-xs md:text-sm px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="inline h-3 w-3 mr-1" />
            {s}
          </button>
        ))}
      </div>

      {/* Input card */}
      <div className="glass-card p-4 md:p-5">
        <Textarea
          ref={textareaRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Digite sua pergunta sobre Engenharia de Dados & IA..."
          className="min-h-24 resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
          maxLength={1000}
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">
            {question.length}/1000 · Enter envia · Shift+Enter quebra linha
          </span>
          <Button
            onClick={() => ask(question)}
            disabled={!canSubmit}
            className="bg-primary text-primary-foreground hover:bg-[#E4BF5A] disabled:opacity-50 font-semibold"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Perguntar ao Agente
          </Button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="glass-card p-5 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 w-full animate-pulse" />
          ))}
        </div>
      )}

      {/* Result */}
      <AnimatePresence mode="wait">
        {result && !loading && (
          <motion.div
            key={cleanedAnswer.slice(0, 20)}
            className="flex flex-col gap-4"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4, delay: 0 }}
              className="glass-card p-5 md:p-6"
            >
              <div className="prose prose-invert dark:prose-invert max-w-none prose-headings:title-gradient prose-a:text-primary prose-strong:text-foreground prose-code:text-primary text-foreground">
                <ReactMarkdown>{cleanedAnswer}</ReactMarkdown>
              </div>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="glass-card p-5"
            >
              <h3 className="text-xs font-bold tracking-widest text-primary mb-3">FONTES</h3>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">
                  {result.chunks_used} chunks utilizados
                </Badge>
                {result.sources.map((s) => (
                  <Badge key={s} variant="outline" className="border-accent/40 text-foreground">
                    <FileText className="h-3 w-3 mr-1" />
                    {s}
                  </Badge>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="glass-card p-5"
            >
              <button
                onClick={() => setShowChunks((v) => !v)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="text-sm font-medium text-foreground">
                  Ver trechos recuperados ({result.retrieved_chunks.length})
                </span>
                {showChunks ? (
                  <ChevronUp className="h-4 w-4 text-primary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-primary" />
                )}
              </button>
              <AnimatePresence>
                {showChunks && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-3">
                      {result.retrieved_chunks.map((c, i) => {
                        const pct = Math.round(c.score * 100);
                        return (
                          <div
                            key={i}
                            className="rounded-xl border border-[rgba(243,226,228,0.1)] p-3 bg-[rgba(52,45,99,0.25)]"
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-3 w-3 text-primary shrink-0" />
                                <span className="text-xs font-medium truncate text-foreground">
                                  {c.source}
                                </span>
                                <Badge variant="outline" className="text-[10px]">
                                  #{c.chunk_index}
                                </Badge>
                              </div>
                              <span className="text-xs font-mono text-primary shrink-0">
                                {pct}%
                              </span>
                            </div>
                            <Progress value={pct} className="h-1 mb-2" />
                            <p className="text-xs text-muted-foreground line-clamp-4">{c.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

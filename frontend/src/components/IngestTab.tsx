import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Link2, Loader2, CheckCircle2, Database, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, type IngestResponse, type StatsResponse } from "@/lib/api";

interface Props {
  online: boolean | null;
}

export function IngestTab({ online }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ingestingUrl, setIngestingUrl] = useState(false);
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<IngestResponse | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const disabled = online === false;

  const handleFile = async (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Apenas arquivos PDF são aceitos.");
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const r = await api.ingestFile(file);
      setResult(r);
      toast.success(`PDF ingerido: ${r.filename}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleUrl = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error("Informe uma URL.");
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      toast.error("URL inválida.");
      return;
    }
    setIngestingUrl(true);
    setResult(null);
    try {
      const r = await api.ingestUrl(trimmed);
      setResult(r);
      toast.success(`URL ingerida: ${r.filename}`);
      setUrl("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao ingerir URL.");
    } finally {
      setIngestingUrl(false);
    }
  };

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const s = await api.stats();
      setStats(s);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar estatísticas.");
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid md:grid-cols-2 gap-4">
        {/* PDF Upload */}
        <div
          className={`glass-card p-6 flex flex-col items-center justify-center min-h-64 text-center transition-all cursor-pointer ${
            dragActive ? "ring-2 ring-primary" : ""
          } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          onClick={() => fileInput.current?.click()}
        >
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Enviando PDF...</p>
            </>
          ) : (
            <>
              <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Enviar PDF</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Arraste e solte ou clique para escolher
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">Apenas .pdf</p>
            </>
          )}
        </div>

        {/* URL */}
        <div className="glass-card p-6 flex flex-col justify-center min-h-64">
          <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-3">
            <Link2 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Ingerir de URL</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Cole um link para PDF ou página online
          </p>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://arxiv.org/pdf/2005.11401v4"
            disabled={disabled || ingestingUrl}
            className="mb-3 bg-background/40"
          />
          <Button
            onClick={handleUrl}
            disabled={disabled || ingestingUrl || !url.trim()}
            className="bg-primary text-primary-foreground hover:bg-[#E4BF5A] font-semibold"
          >
            {ingestingUrl ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4 mr-2" />
            )}
            Ingerir URL
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
              <h3 className="font-semibold text-foreground">Ingestão concluída</h3>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field
                label="Arquivo"
                value={result.filename}
                icon={<FileText className="h-3 w-3" />}
              />
              <Field label="Chunks" value={result.total_chunks.toString()} />
              <Field label="Caracteres" value={result.total_characters.toLocaleString("pt-BR")} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center gap-3">
        <Button
          variant="outline"
          onClick={loadStats}
          disabled={loadingStats}
          className="border-primary/40 text-primary hover:bg-primary/10"
        >
          {loadingStats ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          Ver Estatísticas da Base
        </Button>

        <AnimatePresence>
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card p-5 w-full"
            >
              <h3 className="text-xs font-bold tracking-widest text-primary mb-3">BASE VETORIAL</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Coleção" value={stats.collection} />
                <Field
                  label="Documentos vetorizados"
                  value={stats.total_points.toLocaleString("pt-BR")}
                />
                <Field label="Status" value={stats.status} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Field({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[rgba(243,226,228,0.1)] p-3 bg-[rgba(52,45,99,0.25)]">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold text-foreground mt-1 break-all">{value}</p>
    </div>
  );
}

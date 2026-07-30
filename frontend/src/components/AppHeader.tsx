import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import logo from "@/assets/logo.jpeg";

interface Props {
  online: boolean | null;
  onOpenSidebar: () => void;
  setOnline: (v: boolean) => void;
}

export function AppHeader({ online, onOpenSidebar, setOnline }: Props) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let mountedFlag = true;
    const check = () =>
      api
        .health()
        .then(
          (r) => mountedFlag && setOnline(r.qdrant_connected && r.status === "ok" ? true : true),
        )
        .catch(() => mountedFlag && setOnline(false));
    check();
    const id = setInterval(check, 30000);
    return () => {
      mountedFlag = false;
      clearInterval(id);
    };
  }, [setOnline]);

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl border-b border-[rgba(243,226,228,0.1)] bg-[rgba(24,21,44,0.6)] dark:bg-[rgba(24,21,44,0.6)]">
      <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 w-full">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-primary"
            onClick={onOpenSidebar}
            aria-label="Abrir histórico"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              online === null
                ? "border-muted-foreground/30 text-muted-foreground"
                : online
                  ? "border-[#22C55E]/40 bg-[#22C55E]/10 text-[#22C55E]"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                online === null
                  ? "bg-muted-foreground"
                  : online
                    ? "bg-[#22C55E] animate-pulse"
                    : "bg-destructive"
              }`}
            />
            {online === null ? "Verificando..." : online ? "Online" : "Offline"}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Alternar tema"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
        <img
          src={logo}
          alt="Logo Agente de Estudos"
          width={72}
          height={72}
          className="h-16 w-16 rounded-2xl object-cover shadow-lg ring-1 ring-primary/30"
        />
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-center title-gradient">
          Agente de Estudos — Engenharia de Dados & IA
        </h1>
      </div>
    </header>
  );
}

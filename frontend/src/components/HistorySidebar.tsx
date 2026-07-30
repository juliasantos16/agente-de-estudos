import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface HistoryItem {
  id: string;
  question: string;
  answer: string;
  sources: string[];
  retrieved_chunks: {
    text: string;
    source: string;
    score: number;
    chunk_index: number;
  }[];
  chunks_used: number;
  timestamp: number;
}

interface Props {
  items: HistoryItem[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

function List({
  items,
  onSelect,
}: {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center">
        Nenhuma pergunta ainda. Faça sua primeira consulta ao agente.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 p-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item)}
          className="text-left group rounded-xl p-3 border border-[rgba(243,226,228,0.1)] hover:border-primary/40 hover:bg-primary/5 transition-all"
        >
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2 text-foreground">
                {item.question}
              </p>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(item.timestamp).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function Header({ onClear, count }: { onClear: () => void; count: number }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(243,226,228,0.1)]">
      <div>
        <h2 className="font-semibold text-foreground">Histórico</h2>
        <p className="text-xs text-muted-foreground">{count} pergunta(s)</p>
      </div>
      {count > 0 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Limpar histórico"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function HistorySidebar({ items, open, onOpenChange, onSelect, onClear }: Props) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-72 shrink-0 glass-card overflow-hidden sticky top-32 max-h-[calc(100vh-9rem)]">
        <Header onClear={onClear} count={items.length} />
        <ScrollArea className="flex-1">
          <List items={items} onSelect={onSelect} />
        </ScrollArea>
      </aside>

      {/* Mobile */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="p-0 w-80 bg-card border-r border-[rgba(243,226,228,0.1)]">
          <SheetHeader className="px-4 py-3 border-b border-[rgba(243,226,228,0.1)]">
            <SheetTitle>Histórico ({items.length})</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <List
              items={items}
              onSelect={(i) => {
                onSelect(i);
                onOpenChange(false);
              }}
            />
          </ScrollArea>
          {items.length > 0 && (
            <div className="p-3 border-t border-[rgba(243,226,228,0.1)]">
              <Button variant="outline" className="w-full" onClick={onClear}>
                <Trash2 className="h-4 w-4 mr-2" /> Limpar histórico
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
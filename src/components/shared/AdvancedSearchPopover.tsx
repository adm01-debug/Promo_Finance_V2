import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type SeverityKey = "critica" | "alta" | "media" | "baixa";

export interface SeverityPreview {
  key: SeverityKey;
  label: string;
  count: number;
  variant: "destructive" | "secondary" | "outline";
}

export interface SearchSuggestion {
  /** Texto exibido na sugestão */
  label: string;
  /** Texto que será aplicado como query ao clicar */
  value: string;
  /** Categoria visível à esquerda (ex.: "Tipo", "Recente", "Descrição") */
  group?: string;
  /** Contagem opcional do lado direito */
  count?: number;
}

interface AdvancedSearchPopoverProps {
  /** Termo atual aplicado externamente */
  value: string;
  /** Aplica o termo no painel pai (debounced internamente) */
  onApply: (next: string) => void;
  /** Total de itens que casam com filtros + termo (em tempo real) */
  totalPreview: number;
  /** Contagens por severidade da prévia */
  severityPreview: SeverityPreview[];
  /** Sugestões dinâmicas (recentes, tipos, palavras-chave) */
  suggestions: SearchSuggestion[];
  /** Resumo curto do escopo atual (período + presets ativos) */
  scopeLabel?: string;
  placeholder?: string;
  /** Largura do botão trigger (utilitário tailwind opcional) */
  triggerClassName?: string;
}

/**
 * Busca avançada com sugestões e prévia em tempo real.
 *
 * - O termo digitado é debounced (200ms) e aplicado via `onApply`.
 * - O painel pai recalcula `totalPreview` e `severityPreview` a partir do
 *   próprio pipeline de filtros, garantindo coerência com período/presets.
 */
export function AdvancedSearchPopover({
  value,
  onApply,
  totalPreview,
  severityPreview,
  suggestions,
  scopeLabel,
  placeholder = "Buscar por descrição, tipo, observação…",
  triggerClassName,
}: AdvancedSearchPopoverProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincroniza o rascunho quando o valor externo mudar (ex.: limpar filtros)
  useEffect(() => {
    setDraft(value);
  }, [value]);

  // Debounce: aplica após 200ms parado
  useEffect(() => {
    if (draft === value) return;
    const t = setTimeout(() => onApply(draft), 200);
    return () => clearTimeout(t);
  }, [draft, value, onApply]);

  useEffect(() => {
    if (open) {
      // foca o input quando abrir
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filteredSuggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return suggestions.slice(0, 8);
    return suggestions
      .filter(
        (s) =>
          s.label.toLowerCase().includes(q) ||
          s.value.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [suggestions, draft]);

  const hasActiveSearch = value.trim().length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 ${triggerClassName ?? ""}`}
          aria-label="Abrir busca avançada"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Buscar</span>
          {hasActiveSearch && (
            <Badge
              variant="secondary"
              className="h-4 px-1 text-[10px] max-w-[120px] truncate"
              title={value}
            >
              {value}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[380px] p-0">
        <div className="p-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              className="pl-8 pr-8 h-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onApply(draft);
                  setOpen(false);
                } else if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
            />
            {draft && (
              <button
                type="button"
                onClick={() => setDraft("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpar termo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {scopeLabel && (
            <p className="text-[11px] text-muted-foreground">{scopeLabel}</p>
          )}
        </div>

        {/* Prévia de resultados */}
        <div className="p-3 border-b bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
              Prévia de resultados
            </span>
            <span className="text-xs font-semibold tabular-nums">
              {totalPreview} {totalPreview === 1 ? "item" : "itens"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {severityPreview.map((s) => (
              <Badge
                key={s.key}
                variant={s.count > 0 ? s.variant : "outline"}
                className={`text-[10px] gap-1 ${s.count === 0 ? "opacity-50" : ""}`}
              >
                <span className="capitalize">{s.label}</span>
                <span className="tabular-nums font-semibold">{s.count}</span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Sugestões */}
        <div className="max-h-[260px] overflow-y-auto">
          {filteredSuggestions.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center">
              <Sparkles className="h-3.5 w-3.5 inline mr-1 opacity-60" />
              Nenhuma sugestão para "{draft}"
            </div>
          ) : (
            <ul className="py-1">
              {filteredSuggestions.map((s, i) => (
                <li key={`${s.value}-${i}`}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent text-left"
                    onClick={() => {
                      setDraft(s.value);
                      onApply(s.value);
                      setOpen(false);
                    }}
                  >
                    {s.group && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 h-4 shrink-0"
                      >
                        {s.group}
                      </Badge>
                    )}
                    <span className="truncate flex-1">{s.label}</span>
                    {typeof s.count === "number" && (
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {s.count}
                      </span>
                    )}
                    <ArrowRight className="h-3 w-3 opacity-40 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

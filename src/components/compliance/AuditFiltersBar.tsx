import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, RotateCcw, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { usePersistedState } from "@/lib/persisted-ui-state";

export interface FiltrosState {
  inicio: string;
  fim: string;
  busca: string;
  acao: string;
  usuario?: string;
  escopos?: string[];
}

export interface EscopoOption {
  value: string;
  label: string;
}

interface Props {
  value: FiltrosState;
  onChange: (v: FiltrosState) => void;
  acoes?: { value: string; label: string }[];
  usuarios?: string[];
  mostrarUsuario?: boolean;
  /** Quando fornecido, exibe um seletor de escopos em formato de chips. */
  escoposOptions?: EscopoOption[];
  /** Texto exibido quando nenhum escopo está selecionado. Default: "(qualquer escopo)". */
  escoposEmptyLabel?: string;
  /** Label exibido para o grupo de escopos. Default: "Escopos". */
  escoposLabel?: string;
  /**
   * Chave única para persistir o estado expandido/recolhido no localStorage.
   * Quando omitida, o painel fica sempre expandido (comportamento legado).
   */
  storageKey?: string;

const PRESETS: { label: string; dias: number }[] = [
  { label: "7 dias", dias: 7 },
  { label: "30 dias", dias: 30 },
  { label: "90 dias", dias: 90 },
];

function isoDays(dias: number) {
  const d = new Date(Date.now() - dias * 24 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

export function AuditFiltersBar({
  value,
  onChange,
  acoes,
  usuarios,
  mostrarUsuario = true,
  escoposOptions,
  escoposEmptyLabel = "(qualquer escopo)",
  escoposLabel = "Escopos",
}: Props) {
  const [busca, setBusca] = useState(value.busca);

  const escoposSelecionados = value.escopos ?? [];

  const toggleEscopo = (v: string) => {
    const atual = escoposSelecionados;
    const proximo = atual.includes(v) ? atual.filter((x) => x !== v) : [...atual, v];
    onChange({ ...value, escopos: proximo });
  };

  return (
    <div className="flex flex-col gap-2 p-3 border rounded-md bg-muted/30">
      <div className="flex flex-col lg:flex-row gap-2 lg:items-end">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Início</label>
            <Input
              type="date"
              value={value.inicio}
              onChange={(e) => onChange({ ...value, inicio: e.target.value })}
              className="w-40"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Fim</label>
            <Input
              type="date"
              value={value.fim}
              onChange={(e) => onChange({ ...value, fim: e.target.value })}
              className="w-40"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground block mb-1">Busca</label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onChange({ ...value, busca });
              }}
            >
              <Input
                placeholder="usuário, tabela, detalhe..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </form>
          </div>
          {mostrarUsuario && usuarios && usuarios.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Usuário</label>
              <Select
                value={value.usuario || "todos"}
                onValueChange={(v) => onChange({ ...value, usuario: v === "todos" ? "" : v })}
              >
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {acoes && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Ação</label>
              <Select value={value.acao || "todas"} onValueChange={(v) => onChange({ ...value, acao: v })}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {acoes.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="flex gap-1">
          {PRESETS.map((p) => (
            <Button
              key={p.dias}
              size="sm"
              variant="outline"
              onClick={() => onChange({ ...value, inicio: isoDays(p.dias), fim: isoDays(0) })}
            >
              <CalendarIcon className="h-3 w-3 mr-1" /> {p.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setBusca("");
              onChange({ inicio: "", fim: "", busca: "", acao: "todas", usuario: "", escopos: [] });
            }}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {escoposOptions && escoposOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-muted-foreground mr-1">{escoposLabel}:</span>
          {escoposOptions.map((e) => {
            const ativo = escoposSelecionados.includes(e.value);
            return (
              <button
                key={e.value}
                type="button"
                onClick={() => toggleEscopo(e.value)}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
              >
                <Badge
                  variant={ativo ? "default" : "outline"}
                  className="cursor-pointer text-[11px] px-2.5 py-0.5"
                >
                  {e.label}
                </Badge>
              </button>
            );
          })}
          {escoposSelecionados.length === 0 && (
            <span className="text-xs text-muted-foreground self-center ml-1">{escoposEmptyLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

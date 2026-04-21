import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, RotateCcw } from "lucide-react";
import { useState } from "react";

export interface FiltrosState {
  inicio: string;
  fim: string;
  busca: string;
  acao: string;
}

interface Props {
  value: FiltrosState;
  onChange: (v: FiltrosState) => void;
  acoes?: { value: string; label: string }[];
}

const PRESETS: { label: string; dias: number }[] = [
  { label: "7 dias", dias: 7 },
  { label: "30 dias", dias: 30 },
  { label: "90 dias", dias: 90 },
];

function isoDays(dias: number) {
  const d = new Date(Date.now() - dias * 24 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

export function AuditFiltersBar({ value, onChange, acoes }: Props) {
  const [busca, setBusca] = useState(value.busca);

  return (
    <div className="flex flex-col lg:flex-row gap-2 lg:items-end p-3 border rounded-md bg-muted/30">
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
            onChange({ inicio: "", fim: "", busca: "", acao: "todas" });
          }}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

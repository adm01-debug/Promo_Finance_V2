import { Badge } from "@/components/ui/badge";
import { TrilhaTable, type ColunaDef } from "./TrilhaTable";

function nivelBadge(n: string) {
  switch (n) {
    case "excelente":
      return <Badge className="bg-success/10 text-success border-success/20">Excelente</Badge>;
    case "bom":
      return <Badge className="bg-primary/10 text-primary border-primary/20">Bom</Badge>;
    case "atencao":
      return <Badge variant="secondary">Atenção</Badge>;
    case "critico":
      return <Badge variant="destructive">Crítico</Badge>;
    default:
      return <Badge variant="outline">{n}</Badge>;
  }
}

const colunas: ColunaDef[] = [
  {
    key: "created_at",
    header: "Data",
    render: (r) => new Date(r.created_at as string).toLocaleString("pt-BR"),
  },
  { key: "periodo", header: "Período" },
  {
    key: "score",
    header: "Score",
    render: (r) => <span className="font-bold">{r.score as number}/100</span>,
  },
  { key: "nivel", header: "Nível", render: (r) => nivelBadge(r.nivel as string) },
  {
    key: "checks_aprovados",
    header: "Checks",
    render: (r) => `${r.checks_aprovados}/${r.total_checks}`,
  },
];

export function ConformidadeFiscalTab() {
  return <TrilhaTable tipo="conformidade" colunas={colunas} filename="conformidade-fiscal" />;
}

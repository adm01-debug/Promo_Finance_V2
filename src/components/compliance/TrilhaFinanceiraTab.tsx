import { Badge } from "@/components/ui/badge";
import { TrilhaTable, type ColunaDef } from "./TrilhaTable";

const colunas: ColunaDef[] = [
  {
    key: "created_at",
    header: "Data/Hora",
    render: (r) => new Date(r.created_at as string).toLocaleString("pt-BR"),
  },
  { key: "tabela", header: "Tabela" },
  {
    key: "operacao",
    header: "Operação",
    render: (r) => <Badge variant="outline">{(r.operacao ?? r.acao) as string}</Badge>,
  },
  { key: "usuario", header: "Usuário", render: (r) => (r.usuario as string) ?? "—" },
  { key: "registro_id", header: "Registro ID", render: (r) => <span className="font-mono text-xs">{(r.registro_id as string)?.slice(0, 8) ?? "—"}</span> },
];

export function TrilhaFinanceiraTab() {
  return (
    <TrilhaTable
      tipo="financeira"
      colunas={colunas}
      acoes={[
        { value: "INSERT", label: "Inserção" },
        { value: "UPDATE", label: "Atualização" },
        { value: "DELETE", label: "Exclusão" },
      ]}
      filename="trilha-financeira"
    />
  );
}

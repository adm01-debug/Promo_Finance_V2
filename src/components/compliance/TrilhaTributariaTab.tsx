import { Badge } from "@/components/ui/badge";
import { TrilhaTable, type ColunaDef } from "./TrilhaTable";

const colunas: ColunaDef[] = [
  {
    key: "criado_em",
    header: "Data/Hora",
    render: (r) => new Date(r.criado_em as string).toLocaleString("pt-BR"),
  },
  {
    key: "acao",
    header: "Ação",
    render: (r) => <Badge variant="outline">{r.acao as string}</Badge>,
  },
  { key: "entidade_tipo", header: "Entidade" },
  { key: "user_email", header: "Usuário" },
  {
    key: "entidade_id",
    header: "ID",
    render: (r) => <span className="font-mono text-xs">{(r.entidade_id as string)?.slice(0, 8) ?? "—"}</span>,
  },
];

export function TrilhaTributariaTab() {
  return (
    <TrilhaTable
      tipo="tributaria"
      colunas={colunas}
      acoes={[
        { value: "insert", label: "Inserção" },
        { value: "update", label: "Atualização" },
        { value: "delete", label: "Exclusão" },
      ]}
      filename="trilha-tributaria"
    />
  );
}

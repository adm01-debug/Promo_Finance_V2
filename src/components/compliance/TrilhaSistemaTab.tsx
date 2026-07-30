import { Badge } from "@/components/ui/badge";
import { TrilhaTable, type ColunaDef } from "./TrilhaTable";

const ACTION_COLORS: Record<string, string> = {
  INSERT: "bg-success/10 text-success border-success/20",
  UPDATE: "bg-accent/10 text-accent border-accent/20",
  DELETE: "bg-destructive/10 text-destructive border-destructive/20",
  LOGIN: "bg-primary/10 text-primary border-primary/20",
  LOGOUT: "bg-muted text-muted-foreground border-border",
  EXPORT: "bg-secondary/10 text-secondary border-secondary/20",
  APPROVE: "bg-success/10 text-success border-success/20",
  REJECT: "bg-destructive/10 text-destructive border-destructive/20",
};

const colunas: ColunaDef[] = [
  {
    key: "created_at",
    header: "Data/Hora",
    render: (r) => new Date(r.created_at as string).toLocaleString("pt-BR"),
  },
  {
    key: "action",
    header: "Ação",
    render: (r) => (
      <Badge variant="outline" className={ACTION_COLORS[r.action as string]}>
        {r.action as string}
      </Badge>
    ),
  },
  { key: "user_email", header: "Usuário" },
  { key: "table_name", header: "Tabela" },
  { key: "details", header: "Detalhes" },
  { key: "ip_address", header: "IP" },
];

export function TrilhaSistemaTab() {
  return (
    <TrilhaTable
      tipo="sistema"
      colunas={colunas}
      acoes={[
        { value: "INSERT", label: "Inserção" },
        { value: "UPDATE", label: "Atualização" },
        { value: "DELETE", label: "Exclusão" },
        { value: "LOGIN", label: "Login" },
        { value: "LOGOUT", label: "Logout" },
        { value: "EXPORT", label: "Exportação" },
        { value: "APPROVE", label: "Aprovação" },
        { value: "REJECT", label: "Rejeição" },
      ]}
      filename="trilha-sistema"
    />
  );
}

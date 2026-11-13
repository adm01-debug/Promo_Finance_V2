export const actionConfig: Record<string, { label: string; color: string }> = {
  INSERT: { label: 'Criação', color: 'bg-success/10 text-success border-success/20' },
  UPDATE: { label: 'Atualização', color: 'bg-accent/10 text-accent border-accent/20' },
  DELETE: { label: 'Exclusão', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  LOGIN: { label: 'Login', color: 'bg-primary/10 text-primary border-primary/20' },
  LOGOUT: { label: 'Logout', color: 'bg-muted text-muted-foreground border-border' },
  EXPORT: { label: 'Exportação', color: 'bg-secondary/10 text-secondary border-secondary/20' },
  APPROVE: { label: 'Aprovação', color: 'bg-success/10 text-success border-success/20' },
  REJECT: { label: 'Rejeição', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  troca_empresa: {
    label: 'Troca de Empresa',
    color: 'bg-primary/20 text-primary border-primary/30',
  },
  filtro_alterado: { label: 'Filtro Alterado', color: 'bg-streak/10 text-streak border-streak/20' },
};

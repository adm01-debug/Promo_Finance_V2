

## Plano — Reabrir anomalia revisada

Hoje `useRevisarAnomalia` só aceita transição **a partir** de `nova`/`investigando` (linhas 158-162 de `useAnomaliasDetectadas.ts`: `.in("status", ["nova", "investigando"])`). Não existe caminho de volta para `confirmada` / `falso_positivo`. Vou adicionar essa transição com auditoria e UI nos dois pontos onde o usuário enxerga o status final.

### Mudanças

**1. `src/hooks/useAnomaliasDetectadas.ts` — novo hook `useReabrirAnomalia`**

Mutation dedicada (não reusa `atualizarStatus` para registrar auditoria e validar transição):

```ts
export function useReabrirAnomalia() {
  const qc = useQueryClient();
  const audit = useLogAudit();

  return useMutation({
    mutationFn: async (input: { id: string; motivo: string }) => {
      const motivo = input.motivo.trim();
      if (motivo.length < 10) {
        throw new Error("Motivo deve ter ao menos 10 caracteres");
      }
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;

      const { data, error } = await supabase
        .from("anomalias_detectadas")
        .update({
          status: "investigando",
          observacoes: motivo,
          resolvida_em: null,
          resolvida_por: null,
        })
        .eq("id", input.id)
        .in("status", ["confirmada", "falso_positivo"])  // só reabre o que está fechado
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Anomalia não está em estado reabrível");

      await audit.mutateAsync({
        action: "REOPEN",
        tableName: "anomalias_detectadas",
        recordId: input.id,
        details: motivo,
      }).catch(() => undefined);

      return data;
    },
    onSuccess: () => {
      toast.success("Anomalia reaberta para investigação");
      qc.invalidateQueries({ queryKey: ["anomalias-detectadas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
```

**2. `src/components/insights-ia/anomalia/AnomaliaHeader.tsx` — botão Reabrir**

Quando `anomalia.status === "confirmada" || "falso_positivo"`, renderizar **apenas** o botão "Reabrir" (some o trio Investigar/Falso positivo/Confirmar — não faz sentido nesse estado). Clique abre um pequeno `Dialog` com `Textarea` exigindo motivo (mínimo 10 chars, mesma regra de `useRevisarAnomalia`):

```tsx
{(anomalia.status === "confirmada" || anomalia.status === "falso_positivo") && (
  <ReabrirAnomaliaDialog anomaliaId={anomalia.id} />
)}
```

`ReabrirAnomaliaDialog` é um componente novo curto (~50 linhas) em `src/components/insights-ia/anomalia/ReabrirAnomaliaDialog.tsx` — `Dialog` + `Textarea` + botão `RotateCcw` com `useReabrirAnomalia`.

**3. `src/components/admin/AnomaliasDetectadasPanel.tsx` — botão Reabrir inline**

No card de cada item da lista (linhas 469-481), quando o filtro está em "Confirmadas" ou "Falsos positivos" (ou "Todas" e o item está nesse estado), trocar o botão Drill-down secundário pelo botão "Reabrir" também via `ReabrirAnomaliaDialog`. Drill-down continua sendo a ação primária.

### Fora de escopo

- Reabrir em massa (bulk) — fila de revisão continua só pegando `nova`/`investigando`.
- Histórico de reaberturas (quem/quando) — fica no log de auditoria, não na UI ainda.
- Migration de banco — nenhuma alteração de schema; `resolvida_em` e `resolvida_por` são apenas limpos no UPDATE.
- Atalhos de teclado.

### Detalhes técnicos

- A transição é guardada no `.in("status", ["confirmada", "falso_positivo"])` do UPDATE, prevenindo race condition (alguém revisando ao mesmo tempo).
- `resolvida_em = null` e `resolvida_por = null` deixam o registro consistente com novas anomalias `investigando`.
- `observacoes` é sobrescrito pelo motivo da reabertura — alinhado ao comportamento atual de `useRevisarAnomalia`. Se quiser preservar o parecer anterior, é o item "histórico de pareceres" já discutido em mensagem anterior.
- Audit log usa `action: "REOPEN"` (string nova, não exige migration — `useLogAudit` aceita string livre).


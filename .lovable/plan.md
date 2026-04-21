

## Plano — Modo de revisão em fila para anomalias pendentes

Hoje o `AnomaliasDetectadasPanel` lista anomalias e oferece botões inline (Investigar / Falso+ / Confirmar) sem exigir comentário. Este plano adiciona um **modo de revisão sequencial**: o admin entra numa fila de pendentes (`nova` + `investigando`), revisa uma por vez em modal cheio com contexto, e precisa escrever um comentário (≥10 chars) antes de Confirmar ou Rejeitar.

### Mudanças

**1. Novo componente `AnomaliasReviewQueue.tsx`** (`src/components/admin/`)
- Botão "Iniciar revisão em fila" no topo do `AnomaliasDetectadasPanel` mostrando `{N} pendentes`.
- Abre `<Dialog>` em modo wizard que percorre as anomalias com status `nova` ou `investigando`, ordenadas por severidade (`critica → alta → media → baixa`) e depois `detectada_em ASC` (mais antigas primeiro — SLA).
- Para cada anomalia exibe:
  - Header: badge severidade + tipo + tempo decorrido ("há 2 dias").
  - Descrição completa + observações existentes.
  - Card "Dados" com `<pre>` do `dados` jsonb (collapsible).
  - Link "Abrir drill-down completo" (`/admin/insights-ia/anomalia/{id}`, target=_blank).
- Footer com:
  - `<Textarea>` "Comentário de revisão" obrigatório, label "Comentário (mínimo 10 caracteres)", contador.
  - 3 botões: **Confirmar como problema real** (verde), **Marcar como falso positivo** (cinza), **Pular** (sem ação, vai pra próxima).
  - Confirmar/Rejeitar ficam `disabled` enquanto comentário < 10 chars.
- Indicador de progresso "Revisando 3 de 12".
- Após ação salva, avança automaticamente para a próxima; ao chegar ao fim, mostra estado de sucesso "Fila concluída — X confirmadas, Y rejeitadas, Z puladas" com botão "Fechar".
- Tecla `Esc` fecha dialog; `Ctrl+Enter` aciona Confirmar quando válido.

**2. Hook `useAnomaliasDetectadas` ampliado**
- Adicionar `revisar`: mutation que aceita `{ id, status: 'confirmada' | 'falso_positivo', observacoes: string }`, valida `observacoes.trim().length >= 10` no client, grava `resolvida_por = auth.uid()` (já temos `resolvida_em`), invalida cache.
- Adicionar query auxiliar `usePendingAnomaliasQueue()` que retorna apenas as pendentes ordenadas por severidade + data, usada exclusivamente pelo modal (cache separado do painel para evitar reordenação visual durante revisão).

**3. Integração em `AnomaliasDetectadasPanel.tsx`**
- Adicionar botão no header: `<Button>Revisar em fila ({pendentes})</Button>` com ícone `ListChecks`, abre `<AnomaliasReviewQueue />`.
- Pendentes = anomalias com status em `('nova','investigando')`.
- Botão fica `disabled` quando 0 pendentes.

**4. Auditoria**
- O hook existente `useLogAudit` (via `log_audit` RPC) é chamado dentro de `revisar` com `action='APPROVE'` (confirmada) ou `action='REJECT'` (falso_positivo), `tableName='anomalias_detectadas'`, `recordId={id}`, `details={observacoes}`. Gera trilha consultável em `/admin/compliance-auditoria`.

### Detalhes técnicos

- **Sem migração**: `observacoes` e `resolvida_por` já existem; aproveitamos `resolvida_em` que o hook já preenche.
- **Validação**: 10 chars é o mínimo prático para forçar comentário substantivo (ex.: "Confirmado, fornecedor X duplicou NF" tem 38). Trim aplicado antes do count.
- **Ordenação por severidade**: feita client-side com map `{critica:0, alta:1, media:2, baixa:3}` após o fetch (Supabase não ordena enum por critério custom sem case).
- **UX de "pular"**: avança index local sem mutation; anomalia continua `nova`/`investigando` na próxima sessão.
- **Concorrência**: se outro admin já resolveu, o update retorna 0 rows afetadas — exibimos toast "Já revisada por outro usuário" e avançamos.
- **A11y**: foco automático no `<Textarea>` ao abrir cada anomalia; `aria-live="polite"` no contador de progresso.

### Fora de escopo

- Atribuição de revisor (assign-to) — fila é compartilhada, primeiro a abrir vê todas.
- Bulk approve/reject sem comentário (intencionalmente proibido).
- Export do log de revisões (já disponível via `audit_logs`).


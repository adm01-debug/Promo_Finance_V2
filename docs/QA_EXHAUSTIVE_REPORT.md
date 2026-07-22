# Relatório QA Exaustivo — 2026-07-22

## Sumário

| Métrica | Resultado |
|---|---|
| Typecheck (`tsgo --noEmit`) | ✅ 0 erros |
| Suíte Vitest | ✅ 1235/1235 (83 arquivos, 99.7s) |
| Smoke E2E (28 rotas públicas) | ✅ 28/28 HTTP 200, 0 erros JS |
| Bugs 🔴 críticos encontrados | **1** (corrigido) |
| Bugs 🟡 importantes | 0 novos (27 warnings SECURITY DEFINER pré-existentes) |
| Melhorias 🔵 aplicadas | 1 índice de performance |

## Inventário

- 88 Edge Functions em `supabase/functions/`
- 216 hooks em `src/hooks/`
- 108 rotas registradas em `src/App.tsx`
- 55 arquivos com `@ts-nocheck/@ts-ignore` (dívida técnica remanescente)
- 4 usos legítimos de `dangerouslySetInnerHTML` (shadcn chart, rich-text editor, copilots — todos com fonte controlada)

## 🔴 P0 — Boot-blocking Backend Health-check (CORRIGIDO)

**Sintoma:** 100% das rotas exibiam "Erro de configuração do backend — status 401" e o React nem chegava a montar.

**Causa-raiz:** `verifySupabaseHealth()` em `src/integrations/supabase/client.ts` chamava `GET /rest/v1/` que PostgREST reserva ao `service_role`. Com a anon key válida a resposta é sempre `401 {"hint":"Only the service_role API key can be used"}`. O código tratava qualquer 4xx como configuração inválida e substituía a árvore React por uma tela de erro estático.

**Evidência:**
```
$ curl "$URL/rest/v1/" -H "apikey: $ANON"        → HTTP 401
$ curl "$URL/rest/v1/profiles?limit=1" -H "…"    → HTTP 200 []
$ curl "$URL/auth/v1/health" -H "apikey: $ANON"  → HTTP 200 {"name":"GoTrue"}
```

**Correção:** health-check agora usa `/auth/v1/health` (endpoint público do GoTrue). Diff mínimo, documentado inline, sem migração.

**Validação:** Playwright pós-fix mostra a tela de login renderizada com 0 `pageerror` na home.

## 🔵 Performance — Índice parcial `alert_configurations`

Slow-query top #1: `alert_configurations WHERE is_enabled = true` — 13.951 chamadas, 9,2s totais. Adicionado:

```sql
CREATE INDEX IF NOT EXISTS idx_alert_configurations_is_enabled_true
  ON public.alert_configurations (alert_type, channel)
  WHERE is_enabled = true;
```

## Auditoria estática — resultados limpos

- ❌ Nenhum `console.log` fora de `import.meta.env.DEV`
- ❌ Nenhuma referência a `SERVICE_ROLE` no código do cliente
- ⚠️ 10 componentes ainda > 400 linhas (backlog de modularização, sem bug funcional):
  Asaas.tsx (559), SpedEcdWizard (558), MinhasPreferencias (556), SSOWizardDialog (555), Step3Download (538), SugestoesMatchIA (537), LancamentosTab (520), Auth (506)

## Backend — Linter Supabase

27 avisos pré-existentes (`SECURITY DEFINER` executável por anon/authenticated). Já rastreados no relatório anterior; requerem revisão função-a-função antes de revogar EXECUTE. Sem regressões novas.

## Limitações desta rodada

Sessão do sandbox veio como `signed_out` (`LOVABLE_BROWSER_AUTH_STATUS=signed_out`), portanto simulações E2E autenticadas (CRUD, filtros salvos, workflows) não puderam ser executadas nesta rodada. Recomenda-se logar no preview e reexecutar para cobrir os 20 grupos de fluxos autenticados listados no plano.

## Próximas ações sugeridas

1. Logar no preview para reabilitar E2E autenticado (300+ cenários planejados)
2. Fase 2 do backlog: revogar `EXECUTE` seletivo nas 27 funções `SECURITY DEFINER`
3. Fase 3: modularizar os 10 arquivos > 400 linhas restantes

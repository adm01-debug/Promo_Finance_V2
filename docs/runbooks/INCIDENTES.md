# Runbook: Resposta a Incidentes

> Objetivo: primeira resposta em <15 min, diagnóstico estruturado, comunicação clara.

## 1. Classificar severidade

| Sev | Critério                                | Exemplo                             | Resposta            |
| --- | --------------------------------------- | ----------------------------------- | ------------------- |
| S1  | Prod down ou dado financeiro corrompido | app fora do ar, pagamento duplicado | Imediato, escalonar |
| S2  | Funcionalidade crítica degradada        | NF-e não emite, conciliação parada  | <1h                 |
| S3  | Degradação não-crítica                  | relatório lento, alerta atrasado    | Próximo dia útil    |

## 2. Diagnóstico — onde olhar primeiro

1. **Supabase logs** — Dashboard > Edge Functions > Logs (filtrar por fn e janela). Logs estruturados têm `request_id`/`correlation_id` e `function_name`.
2. **edge_function_logs** — `SELECT * FROM edge_function_logs WHERE created_at > now() - interval '1h' ORDER BY created_at DESC` (admin).
3. **Vercel** — deploys recentes em https://vercel.com/juca1/promo-finance-v2 (incidente começou logo após deploy? suspeitar do último merge).
4. **Supabase status** — https://status.supabase.com e status do projeto `bwwbeyolnnzppeuhgkcd`.
5. **Integrações externas** — Asaas/Bling/SEFAZ: verificar se o erro é do nosso lado ou timeout do parceiro (mensagem `error_message` e `status_code` nos logs).

## 3. Mitigação (ordem de preferência)

1. **Rollback de deploy Vercel**: Dashboard > Deployments > ⋮ > "Redeploy" do deploy anterior estável. Leva ~2min.
2. **Desligar integração degradada** (quando o circuit breaker do roadmap existir): update em `feature_flags`/`INTEGRACOES_DESATIVADAS`.
3. **Edge function específica**: redeploy da versão anterior via workflow `functions-deploy` (workflow_dispatch, escolher a fn).
4. **Migração problemática**: **não** fazer `db push` reverso às cegas — ver runbook HOTFIX e BACKUP_DR antes.

## 4. Comunicação

- Registrar no incidente: horário de início, sintoma, suspeita, ação tomada, horário de normalização.
- Após resolução: post-mortem curto em `docs/postmortems/AAAAMMDD-<slug>.md` com causa-raiz e ação preventiva.

## 5. Escalada

- Persistência de erro após mitigação → envolver quem tem acesso Supabase admin (service_role) e Vercel admin.
- Incidente de segurança (vazamento de credencial/dado) → seguir ROTACAO_SECRETS.md + registrar escopo afetado.

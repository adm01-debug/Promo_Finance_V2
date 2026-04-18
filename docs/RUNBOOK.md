# Runbook Operacional — Promo Finance

Procedimentos de resposta a incidentes para os fluxos críticos do sistema.

---

## 1. Cron job falhou ou não executa

**Sintoma**: Alertas tributários não foram gerados; usuários reclamam de avisos atrasados.

**Diagnóstico**:
1. Acessar painel admin → Configurações → Cron Jobs.
2. Inspecionar histórico via `get_cron_run_history('gerar-alertas-tributarios-diario', 20)`.
3. Verificar coluna `status` (`succeeded` / `failed`) e `return_message`.

**Resolução**:
- **Job inativo**: chamar `toggle_cron_job(jobid, true)`.
- **Erro de permissão (`pg_net`)**: validar que a extensão está habilitada no schema `extensions` (ver `mem://security/manual-configuration-requirements`).
- **Edge Function falhando**: ver seção 2 abaixo.
- **Backlog acumulado**: chamar manualmente `gerar_alertas_vencimento()` para forçar execução.

---

## 2. Edge Function timeout ou erro 500

**Sintoma**: Operações tributárias travam; logs frontend mostram falha em chamadas a `gerar-alertas-tributarios`, `simular-regimes`, etc.

**Diagnóstico**:
1. Logs da Edge Function via painel Lovable Cloud → Backend → Functions.
2. Procurar `JSON.stringify({level: "error", ...})` (logging estruturado).
3. Validar `frontend_error_logs` para correlacionar com erros do cliente.

**Resolução**:
- **Timeout em chamada externa**: a função usa `AbortController` com 30s; se persiste, aumentar timeout ou ativar fallback.
- **Erro 429 (rate limit)**: já há retry com backoff exponencial (3 tentativas: 500ms, 1s, 2s). Verificar quotas.
- **Erro 500 inesperado**: o `try/catch` top-level garante CORS sempre. Inspecionar `return_message` no payload de erro.

---

## 3. RLS bloqueando usuário legítimo

**Sintoma**: Usuário relata "permission denied" ou tela em branco em página onde deveria ter acesso.

**Diagnóstico**:
1. Confirmar role atual via `SELECT * FROM user_roles WHERE user_id = '<uid>'`.
2. Inspecionar policies da tabela bloqueada via Supabase → Authentication → Policies.
3. Validar uso correto de `has_role()` e `has_any_role()` (security definer).

**Resolução**:
- **Role faltando**: `INSERT INTO user_roles (user_id, role) VALUES ('<uid>', 'financeiro')`.
- **Policy mal definida**: jamais usar `auth.uid()` dentro de subquery em policy — sempre via função security definer.
- **Cache de sessão**: pedir ao usuário fazer logout/login para refresh do JWT.

---

## 4. Telemetria de erros frontend (`frontend_error_logs`)

**Como consultar**:
```sql
-- Erros mais recentes (admin only)
SELECT created_at, message, url, severity, user_id
FROM frontend_error_logs
ORDER BY created_at DESC
LIMIT 50;

-- Top 10 erros por frequência
SELECT message, COUNT(*) as ocorrencias
FROM frontend_error_logs
WHERE created_at > now() - INTERVAL '7 days'
GROUP BY message
ORDER BY ocorrencias DESC
LIMIT 10;
```

**Limpeza**: admins podem `DELETE FROM frontend_error_logs WHERE created_at < now() - INTERVAL '90 days'`.

---

## 5. Integrações externas (Bling, ASAAS, Bitrix)

Cada integração tem sua própria estratégia de resiliência (ver `mem://integrations/bling-erp-v3-estrategia-e-resiliencia`).

**Diagnóstico geral**:
- `bling_sync_logs`, `bling_webhook_events`, `asaas_payments`, `bitrix_sync_logs`.
- Status `falhou` + `mensagem_erro` indica causa.

**Resolução**:
- **Token expirado (Bling/Bitrix)**: refresh automático configurado; se persiste, regerar via OAuth.
- **Webhook não recebido**: validar URL configurada no provedor + secret token.

---

## Contatos

- Banco de dados: painel Supabase do projeto (`iikqosstymnnxaujzadw`).
- Logs Edge Functions: painel Lovable Cloud → Backend.
- Suporte interno: equipe DevOps Promo Brindes.

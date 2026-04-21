

## Plano — Enriquecer log do `sso-callback` com provider e grupo casado do magic link

### Diagnóstico

Hoje, ao final do callback OIDC bem-sucedido (`supabase/functions/sso-callback/index.ts`, linhas 737-753):

1. `logAttempt(...)` grava em `sso_login_attempts` apenas: `provider_id`, `email`, `success`, `error_code`, `duration_ms`, `ip`, `user_agent`, `app_redirect`. **Não grava** o `matched_group`, a `role` resolvida, os `groups_received`, nem o `provider_nome`/`tipo`.
2. Em seguida, `admin.auth.admin.generateLink({ type: 'magiclink', email, ... })` cria o magic link e redireciona — **sem nenhum log** que correlacione esse magic link específico ao mapeamento de role/grupo aplicado nesta sessão.

Resultado: ao auditar "por que o usuário X recebeu role Y neste login às 14:32?", o admin precisa cruzar manualmente `sso_login_attempts` (login) ↔ `audit_logs.sso_jit_provisioning` (só existe quando JIT criou) ↔ `audit_logs.user_roles` (só quando matched_group). Para logins **subsequentes sem mudança de role e sem JIT** (caso mais comum), **não há trilha** ligando o magic link ao grupo casado.

A tabela `sso_login_attempts` já tem uma coluna `context jsonb NOT NULL DEFAULT '{}'` exatamente para esse tipo de enriquecimento — não é usada hoje no callback.

### Comportamento

1. Estender `logAttempt` para aceitar um campo opcional `context: Record<string, unknown>` e gravá-lo na coluna existente `sso_login_attempts.context`.
2. No callback OIDC, antes do `generateLink`, montar um contexto estruturado e passá-lo para o `logAttempt` de sucesso:
   ```json
   {
     "provider_nome": "Azure AD",
     "provider_tipo": "oidc",
     "matched_group": "DevOps-Admins",
     "role_resolved": "admin",
     "default_role": "visualizador",
     "role_origin": "group_mapped",
     "groups_received": ["DevOps-Admins", "All-Employees"],
     "via": "oidc-jit",
     "jit_created": true,
     "empresa_id": "uuid-or-null"
   }
   ```
   `role_origin` é derivado: `"group_mapped"` quando `matchedGroup != null`, senão `"default"`.
3. Registrar o magic link emitido com um audit_log dedicado **`sso_magic_link_issued`** em `audit_logs` (table_name discreto, filtrável):
   ```ts
   await admin.from("audit_logs").insert({
     user_id: result.userId,
     user_email: email,
     action: "LOGIN",
     table_name: "sso_magic_link_issued",
     record_id: result.userId,
     new_data: { provider_id, provider_nome, provider_tipo, matched_group, role: result.role, default_role, role_origin, groups_received, via, app_redirect },
     details: `Magic link emitido via ${providerNome} → role=${result.role} (${roleOrigin === 'group_mapped' ? `grupo ${matchedGroup}` : 'default'})`,
   });
   ```
   Esse evento existe **em todo login bem-sucedido** (mesmo sem JIT e sem mudança de role) e é o ponto único de auditoria que correlaciona "magic link → provider → grupo → role".
4. O `applyPipeline` hoje devolve `{ userId, role, matchedGroup, jitCreated }`. Já temos tudo o que precisamos sem refatorar o pipeline.
5. Adicionar a nova `table_name` em `tableNameLabels` de `src/components/audit/AuditLogTable.tsx` como **"Magic Link SSO"** para a UI já mostrar legível.
6. Falhas em qualquer um dos novos writes são engolidas (`try/catch` com `console.warn`) — login nunca pode quebrar por causa de auditoria.

### Detalhes técnicos

**Edit em `supabase/functions/sso-callback/index.ts`**:

- `logAttempt(args)`: adicionar `context?: Record<string, unknown>` na assinatura; quando presente e não-vazio, incluir `context` no `.insert`.
- No bloco de sucesso OIDC (linha ~737), construir `magicLinkContext` a partir do `result` + variáveis locais (`provider`, `groups`) e passar para `logAttempt`.
- Logo antes do `generateLink`, inserir o novo `audit_logs` `sso_magic_link_issued` envolvido em `try/catch`.
- Nada muda no SAML finalize neste plano (SAML não usa magic link — o broker já emite a sessão diretamente). Auditoria SAML equivalente fica como follow-up.

**Edit em `src/components/audit/AuditLogTable.tsx`**:

- Adicionar 1 entrada em `tableNameLabels`:
  ```ts
  sso_magic_link_issued: 'Magic Link SSO',
  ```

**Sem schema migrations**: a coluna `context jsonb` em `sso_login_attempts` já existe, e `audit_logs` aceita qualquer `table_name`/`new_data` jsonb.

**Reflexo automático**:
- `/audit-logs` ganha o novo filtro de tabela via `tableNameLabels`.
- `/admin/sso-jit-events` continua mostrando só os JIT (sem regressão).
- `SSOMetricsPanel` (que lê `sso_login_attempts`) passa a ter `context` populado para futuros widgets, sem nova migration.

### Critério de pronto

1. Após um login OIDC bem-sucedido, `select context from sso_login_attempts where email = '...' order by created_at desc limit 1` retorna o JSON com `provider_nome`, `matched_group`, `role_resolved`, `role_origin`, `groups_received`, `via`, `jit_created`.
2. Para o mesmo login, existe uma linha em `audit_logs` com `table_name = 'sso_magic_link_issued'`, `action = 'LOGIN'`, `new_data` contendo `provider_id`, `matched_group` e `role`, e `details` legível.
3. O evento é gravado **mesmo quando** não houve JIT e não houve mudança de role (login subsequente normal) — caso onde antes não havia trilha alguma.
4. Filtro `Tabela: Magic Link SSO` aparece em `/audit-logs` e retorna os eventos novos.
5. Falha simulada no `audit_logs.insert` **não impede** o redirect do magic link — só gera `console.warn`.
6. Sem regressão: trilhas existentes (`sso_profile_sync`, `sso_jit_provisioning`, `user_roles`, `sso_login_attempts`) continuam sendo gravadas.

### Arquivos

- ✏️ `supabase/functions/sso-callback/index.ts` (assinatura de `logAttempt` + chamada enriquecida + novo audit_log `sso_magic_link_issued` antes do `generateLink`).
- ✏️ `src/components/audit/AuditLogTable.tsx` (1 entrada em `tableNameLabels`).


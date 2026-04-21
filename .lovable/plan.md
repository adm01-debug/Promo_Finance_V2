

## Plano — Auditoria explícita e atualização de perfil no JIT provisioning

O JIT provisioning **já está implementado e ativo** no `supabase/functions/sso-callback/index.ts`:

- Quando o usuário não existe e `auto_provision_users=true`, cria em `auth.users` com `email_confirm: true`.
- Resolve papel via `sso_role_mappings` (grupos do IdP → `app_role`), com fallback para `default_role`.
- Vincula em `user_empresas` (`provisioned_via='sso'`, `is_default=true`).
- Mantém `user_roles` para compatibilidade com `has_role()`.
- Registra cada tentativa em `sso_login_attempts` (sucesso/falha + duração).

**Gaps que este plano fecha:**

1. **Auditoria fraca**: criação JIT e mapeamento de papel não aparecem em `audit_logs` (a tabela usada por toda a UI de compliance). Hoje só ficam em `sso_login_attempts`, que é log técnico, não trilha de governança.
2. **`full_name` não atualiza**: se o usuário muda nome no IdP, nosso perfil fica desatualizado para sempre.

### Mudanças

**Arquivo único editado: `supabase/functions/sso-callback/index.ts`** (bloco JIT, linhas 117-162)

- **Atualização de perfil em re-login**: quando `found` existe e o IdP envia `fullName` diferente do `user_metadata.full_name` atual, chama `admin.auth.admin.updateUserById()` e `UPDATE profiles SET full_name`.
- **Flag `jitCreated`** para distinguir criação nova vs login subsequente.
- **Captura `matchedGroup`** ao resolver role mapping.
- **Insert explícito em `audit_logs`**:
  - Se `jitCreated`: `action='INSERT'`, `table_name='auth.users'`, `details` com nome do provider, role e grupo casado.
  - Senão, se `matchedGroup`: `action='UPDATE'`, `table_name='user_roles'`, registrando a aplicação do mapeamento.
- **`sso_login_attempts.error_code`** recebe `'jit_provisioned'` (semântica: "evento", não erro) para facilitar filtro nas métricas.

### Fora de escopo

- Desprovisionamento automático (deactivate) quando IdP remove o usuário — isso é responsabilidade do SCIM, não do callback SSO.
- Sincronização incremental de grupos a cada login (já acontece naturalmente).
- UI nova de auditoria — `audit_logs` já é consumido por `ComplianceAuditoria.tsx`.


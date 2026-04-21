` direto.

<lov-plan>

## Plano — Trilha explícita de JIT provisioning no `audit_logs`

### Diagnóstico

A função `sso-callback` (`applyPipeline`, linhas 269-298) **já grava** alguma trilha, mas é incompleta:

- **Caminho JIT** (linhas 270-287): registra `INSERT` em `auth.users` com `provider_id`, `provider_nome` e a role no `details` (string livre). Faltam dados estruturados úteis: `empresa_id`, `default_role`, lista de `groups` recebidos, se houve match de grupo ou foi fallback.
- **Caminho não-JIT com role mapping** (linhas 288-297): registra `UPDATE user_roles` apenas se `matchedGroup` foi resolvido — usuários SSO existentes que caem no `default_role` não geram nada.
- O `details` mistura informações em string livre, dificultando filtros na tela `/audit-logs` (que indexa por `action` e `table_name`).
- Não existe um **evento dedicado** que um admin possa filtrar para responder "quem foi provisionado por JIT no último mês".

### Comportamento

Adicionar um **registro estruturado e único** em `audit_logs` toda vez que `applyPipeline` provisiona um usuário via JIT (OIDC criou aqui, ou SAML broker criou agora). O insert existente de role mapping (`UPDATE user_roles`) para usuários já existentes fica preservado.

Estrutura do novo registro:

```jsonc
{
  action: "INSERT",
  table_name: "sso_jit_provisioning",   // tag estável para filtragem
  record_id: <userId>,
  user_id: <userId>,
  user_email: <email>,
  details: "JIT via {providerNome}: role={role}{matchedGroup ? \" (grupo {matchedGroup})\" : \" (default)\"}",
  new_data: {
    provider_id, provider_nome, provider_tipo,    // contexto do IdP
    empresa_id,                                   // empresa-alvo do vínculo
    role,                                         // role efetivamente aplicada
    default_role,                                 // role default do provider (fallback)
    matched_group,                                // grupo IdP que casou (null = default)
    groups_received: [...],                       // todos os grupos vindos do IdP
    full_name,
    via: "oidc-jit" | "saml-broker-jit"
  }
}
```

`table_name = "sso_jit_provisioning"` é uma **convenção de tag** (não tabela real). Vira chave indexável que aparece automaticamente no `Select` "Tabela" da tela `/audit-logs`.

Cobertura:
- **OIDC** (linhas 192-222): `jitCreated = true` quando `createUser` roda — já existe.
- **SAML finalize**: o broker SAML cria o usuário antes do pipeline rodar, então `existingUserId` chega preenchido e `jitCreated` fica `false` hoje. Para detectar JIT no caminho SAML, após `getUserById` (linha 225) comparar `u.user.created_at` com `Date.now() - 60_000`; se mais novo, marcar `jitCreated = true` e `via = "saml-broker-jit"`.

### Detalhes técnicos

**Arquivo único de backend**: `supabase/functions/sso-callback/index.ts`

1. Em `applyPipeline`, após o bloco de role mapping (linha 257), montar payload com `groups`, `defaultRole`, `empresaId`, `matchedGroup`, `role`, `provider.tipo`.
2. Substituir o bloco de audit atual (linhas 270-298) por:
   - Se `jitCreated === true` → insert único em `audit_logs` com `table_name = "sso_jit_provisioning"` e payload completo acima.
   - Caso contrário, manter o insert existente de `UPDATE user_roles` quando `matchedGroup` for resolvido (sem regressão).
3. No caminho SAML (linhas 224-241), após o `getUserById`, checar `created_at` para detectar criação recente (< 60s) e setar `jitCreated = true` antes do bloco de auditoria.
4. Falhas no insert de audit engolidas com `logger.warn` (já existe no arquivo) — auditoria nunca derruba o login.

**Sem migrações**: `audit_logs` aceita `table_name TEXT` arbitrário, `new_data JSONB`, `details TEXT`. RLS já permite SELECT para admin e INSERT via `service_role` (cliente `admin` da edge function).

**Frontend** — alteração trivial em `src/components/audit/AuditLogTable.tsx`: adicionar entrada `sso_jit_provisioning: 'Provisionamento SSO (JIT)'` em `tableNameLabels` para leitura amigável. O `Select` de filtro de tabela em `/audit-logs` já é populado dinamicamente a partir dos logs, então passa a listar a nova tag automaticamente.

### Critério de pronto

1. Toda vez que `sso-callback` provisiona um usuário novo via JIT (OIDC ou SAML broker), surge em `audit_logs` um registro com `table_name = "sso_jit_provisioning"` e payload completo (provider, empresa, role efetiva, default_role, matched_group, groups_received, via).
2. Admin filtra `/audit-logs → Tabela: Provisionamento SSO (JIT)` e vê toda a trilha do período.
3. Comportamento existente de `UPDATE user_roles` para usuários SSO já existentes com grupo mapeado continua funcionando.
4. Falha no insert de audit não bloqueia o login.
5. Sem alterações de schema, RLS ou outros componentes além do `sso-callback` e do label amigável.

### Arquivos

- ✏️ `supabase/functions/sso-callback/index.ts` (refator do bloco de audit em `applyPipeline` + detecção JIT-via-SAML)
- ✏️ `src/components/audit/AuditLogTable.tsx` (1 linha em `tableNameLabels`)


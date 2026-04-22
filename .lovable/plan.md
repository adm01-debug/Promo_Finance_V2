

## Plano — Histórico de simulações do Sandbox SSO

### Diagnóstico

O `SSOSandboxPanel` hoje executa simulações via `sso-test-login` mas descarta o resultado quando o admin muda os inputs ou clica em "Simular" novamente. Não há como:

- Comparar duas simulações lado a lado (ex.: "antes do ajuste do `claim_mapping` o usuário era bloqueado, agora seria JIT").
- Reproduzir a mesma entrada (claims + provider + config manual) com um clique.
- Auditar quem simulou o quê (útil quando vários admins testam o mesmo provider).

A tabela `sso_login_attempts` registra logins reais — não simulações. Misturar os dois lá poluiria as métricas. Precisamos de uma tabela própria.

### Comportamento

1. **Persistência automática** — toda chamada bem-sucedida ao `sso-test-login` (sucesso ou com erros lógicos) é salva em `sso_sandbox_runs` junto com o snapshot de input. Erros HTTP/exception não são salvos.

2. **Aba/seção "Histórico"** dentro do `SSOSandboxPanel`, abaixo dos dois cards atuais ou em uma nova `Tabs` interna (`Simular` / `Histórico`):
   - Tabela com colunas: data/hora, provider, email mascarado, **outcome** (badge), papel resolvido, grupo casado, autor.
   - **Outcome** é derivado do `preview` em uma única classe semântica:
     - `bloqueado` (vermelho) — `errors.length > 0` ou `domain_allowed=false` ou `provision_blocked_reason`.
     - `seria_jit` (azul) — `would_jit_provision=true` e sem erros.
     - `usuario_existente` (verde) — `user_exists=true` e sem erros.
     - `sem_email` (cinza) — sem email parseável.
   - Filtros: provider (Select), outcome (chips), busca por email, range de datas.
   - Paginação simples (20 por página, `range()` no Supabase).

3. **Ações por linha**:
   - **Ver detalhes** — abre `Sheet` lateral com o JSON completo de input e o `preview` retornado, mais a trilha de `role_mappings_evaluated` (reutiliza `RulesAppliedCard`).
   - **Reproduzir** — preenche o painel da esquerda (provider, useProviderConfig, claims JSON, mapping manual etc.) com os valores salvos e troca para a aba "Simular". Não dispara a simulação automaticamente — admin revisa e clica "Simular".
   - **Comparar** — checkbox em cada linha permite selecionar até **2** runs. Quando 2 estão selecionadas, aparece um botão "Comparar (2)" que abre um `Dialog` em duas colunas mostrando lado a lado: input diff (claims, claim_mapping, role_mappings, default_role), outcome, grupos, papel, e diferenças destacadas.
   - **Excluir** — soft delete (admin only). Confirmação inline.

4. **Limites e housekeeping**:
   - RLS: apenas admins fazem SELECT/INSERT/DELETE.
   - Política de retenção: TTL de 90 dias (cleanup feito por job já existente ou simplesmente via `created_at < now() - 90d` na próxima execução). Sem cron novo nesta entrega; documentado no README da feature.

### Detalhes técnicos

**Migration — `sso_sandbox_runs`**:

```sql
CREATE TABLE public.sso_sandbox_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_email text,
  provider_id uuid REFERENCES public.sso_providers(id) ON DELETE SET NULL,
  provider_nome text,
  use_provider_config boolean NOT NULL DEFAULT true,
  input jsonb NOT NULL,           -- {mock_claims, claim_mapping, role_mappings, default_role, allowed_domains, provider_id}
  result jsonb NOT NULL,          -- preview + errors + success
  outcome text NOT NULL,          -- 'bloqueado' | 'seria_jit' | 'usuario_existente' | 'sem_email'
  email_masked text,
  resolved_role text,
  matched_group text,
  has_errors boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_sso_sandbox_runs_created_at ON public.sso_sandbox_runs (created_at DESC);
CREATE INDEX idx_sso_sandbox_runs_provider ON public.sso_sandbox_runs (provider_id, created_at DESC);
CREATE INDEX idx_sso_sandbox_runs_outcome ON public.sso_sandbox_runs (outcome, created_at DESC);

ALTER TABLE public.sso_sandbox_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read sandbox runs"
  ON public.sso_sandbox_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert sandbox runs"
  ON public.sso_sandbox_runs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = created_by);

CREATE POLICY "Admins delete sandbox runs"
  ON public.sso_sandbox_runs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

**Hook — `src/hooks/useSSOSandboxRuns.ts`** (novo):
- `useSSOSandboxRuns(filters)` — query paginada com filtros de provider/outcome/email/from/to.
- `useSaveSSOSandboxRun()` — mutação para INSERT após cada simulação.
- `useDeleteSSOSandboxRun()` — DELETE por id, invalida cache.

**`SSOSandboxPanel.tsx`** — refactor leve:
- Envolver os dois cards atuais em `<Tabs>` com `simular` / `historico`.
- Após `testMutation.mutateAsync`, computar `outcome` no client e disparar `useSaveSSOSandboxRun().mutate({ input, result, outcome, ... })` em fire-and-forget (sem bloquear UX, apenas log de erro).
- Receber prop/state para preencher inputs ao "Reproduzir" — handler `applyRun(run)` que faz `setProviderId / setUseProviderConfig / setClaimsJson / setManual*` e troca aba para `simular`.
- Como o componente já está perto do limite, extrair a aba de histórico para `src/components/admin/sso/sandbox/SandboxHistory.tsx` e os subcomponentes para `sandbox/` (cumpre regra de modularização).

**Novos arquivos UI**:
- `src/components/admin/sso/sandbox/SandboxHistory.tsx` — tabela + filtros + seleção.
- `src/components/admin/sso/sandbox/SandboxRunDetailSheet.tsx` — `Sheet` lateral com input/preview/regras.
- `src/components/admin/sso/sandbox/SandboxCompareDialog.tsx` — `Dialog` com diff de 2 runs.
- `src/components/admin/sso/sandbox/outcome.ts` — helper `computeOutcome(result)` + `OUTCOME_META` (label/cor/icon).

**Diff de comparação** — implementação simples client-side: para cada chave de `input.mock_claims` mostra "==" / "diff" e renderiza ambos lados; para o `result.preview`, destaca campos que mudaram (`outcome`, `resolved_role`, `matched_group`, `user_exists`, `would_jit_provision`, `domain_allowed`). Sem libs externas.

**Reprodução**:
- O snapshot `input` contém tudo necessário. Quando o admin clica "Reproduzir", aplicamos:
  - `setProviderId(input.provider_id ?? '')`
  - `setUseProviderConfig(!!input.provider_id)`
  - `setClaimsJson(JSON.stringify(input.mock_claims, null, 2))`
  - Se manual: `setManualEmail(input.claim_mapping.email)`, `setManualName(...)`, `setManualGroups(...)`, `setManualRole(input.default_role)`, `setManualDomains(input.allowed_domains.join(','))`, `setManualMappings(input.role_mappings.map(...).join('\n'))`.
- Toast: "Entrada carregada. Revise e clique em Simular."

### Critério de pronto

1. Toda simulação executada no Sandbox aparece em "Histórico" em até 1s, com outcome correto.
2. Filtros por provider, outcome, email e data reduzem a lista; a busca por email funciona em emails mascarados.
3. "Reproduzir" preenche os inputs exatamente como estavam no momento da simulação original e troca para a aba "Simular".
4. "Comparar" só fica habilitado com exatamente 2 seleções; o dialog mostra diferenças nos inputs e nos outcomes.
5. "Ver detalhes" mostra o JSON cru de input e preview, plus a trilha de regras.
6. Não-admins não conseguem ler/escrever a tabela (RLS bloqueia).
7. Falha ao salvar run não interrompe a simulação — apenas log de warning.
8. Sem regressão nas funcionalidades atuais do Sandbox (chips de claim em foco, regras aplicadas, JSON colapsável continuam funcionando).

### Arquivos

- ➕ migration `sso_sandbox_runs` (tabela + RLS + índices).
- ➕ `src/hooks/useSSOSandboxRuns.ts`
- ➕ `src/components/admin/sso/sandbox/outcome.ts`
- ➕ `src/components/admin/sso/sandbox/SandboxHistory.tsx`
- ➕ `src/components/admin/sso/sandbox/SandboxRunDetailSheet.tsx`
- ➕ `src/components/admin/sso/sandbox/SandboxCompareDialog.tsx`
- ✏️ `src/components/admin/sso/SSOSandboxPanel.tsx` (Tabs + persistência + handler `applyRun`)


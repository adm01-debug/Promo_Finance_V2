

## Plano — Validação de consistência do editor SSO

### Diagnóstico

Hoje o `SSOWizardDialog` salva `claim_mapping`, `allowed_domains` e `role_mappings` sem checar conflitos lógicos entre eles. Problemas reais que passam batido:

- `claim_mapping.email` vazio ou apontando para chave que nenhum preset emite (ex.: `mail` em Azure quando o IdP entrega `preferred_username`).
- `allowed_domains` vazio com `auto_provision_users=true` → qualquer pessoa do mundo entra via JIT.
- `allowed_domains` com domínios duplicados, com espaços, em maiúsculas, ou inválidos (sem `.`).
- `role_mappings` com `idp_group` duplicado, `app_role` desconhecido, ordem repetida, ou ZERO mappings + `default_role='admin'` (escalonamento involuntário).
- `default_role` apontando para papel que não existe no enum (`admin|financeiro|operacional|visualizador`).
- Nenhum `role_mapping` cobre os grupos comuns do preset (Azure → `Admins-*`, Okta → `Operacional`) → todo mundo cai no `default_role`, "rota sem correspondência".
- `force_sso_for_domains=true` mas `allowed_domains` vazio → flag inerte.
- `claim_mapping.groups` definido, mas zero `role_mappings` cadastrados → grupos vêm e são descartados.

### Solução

**1. Lib pura `src/lib/sso/consistency.ts`** com função `validateSSOConfig(config) → Issue[]`:

```ts
type Severity = 'error' | 'warning' | 'info';
type Scope = 'claim_mapping' | 'allowed_domains' | 'role_mappings' | 'default_role' | 'global';

interface Issue {
  id: string;            // 'cm.email.missing', 'rm.duplicate.group', etc.
  severity: Severity;
  scope: Scope;
  field?: string;        // 'allowed_domains[2]', 'role_mappings[0].idp_group'
  message: string;       // pt-BR, curta
  hint?: string;         // sugestão acionável
  autofix?: { label: string; patch: Partial<SSOConfig> };
}
```

Regras implementadas (~15):

| ID | Severidade | Quando |
|---|---|---|
| `cm.email.missing` | error | `claim_mapping.email` vazio |
| `cm.email.unknown_for_preset` | warning | preset=azure e email≠`email`/`preferred_username`/`upn` |
| `cm.groups.unused` | warning | `claim_mapping.groups` definido + 0 `role_mappings` |
| `dom.empty_with_jit` | error | `allowed_domains=[]` + `auto_provision_users=true` |
| `dom.invalid` | error | domínio sem `.`, com espaço, ou regex inválido |
| `dom.duplicate` | warning | duplicados (case-insensitive) |
| `dom.case_or_whitespace` | info | tem maiúscula/espaço (com autofix de normalização) |
| `dom.force_without_domains` | warning | `force_sso_for_domains=true` + `allowed_domains=[]` |
| `rm.duplicate_group` | error | mesmo `idp_group` 2× |
| `rm.unknown_role` | error | `app_role` fora do enum |
| `rm.empty_group` | error | `idp_group` em branco |
| `rm.coverage_missing` | warning | preset tem grupos comuns esperados não cobertos |
| `rm.no_admin_route` | info | nenhum mapping resolve para `admin` (intencional?) |
| `default.privileged` | warning | `default_role='admin'` ou `'financeiro'` (privilege escalation) |
| `default.unknown` | error | `default_role` fora do enum |
| `global.no_routes` | warning | 0 `role_mappings` E `default_role` é privilegiado |

**2. Hook `useSSOConsistency(config)`** — `useMemo` que retorna `{ issues, errors, warnings, infos, hasBlocker }`. Sem chamadas de rede.

**3. Componente `SSOConsistencyPanel`** — card colapsável com:
- Header: badges contando `N erros · M avisos · K infos` + cor dominante.
- Lista por severidade, agrupada por escopo, cada item com:
  - Ícone + mensagem + `field` em mono.
  - Hint em texto secundário.
  - Botão "Corrigir" se houver `autofix` (aplica `patch` no estado do form).
- Filtro por severidade (chips: Tudo / Erros / Avisos / Infos).
- Estado vazio: "Configuração consistente ✓".

**4. Integração no `SSOWizardDialog`**:
- Painel renderizado no topo do passo de revisão (e sempre visível como sticky no rodapé do dialog quando há `error`).
- Botão "Salvar" desabilitado enquanto `hasBlocker=true`, com tooltip "Resolva os erros antes de salvar".
- Aplicar autofix dispara o mesmo setter do form (sem persistir; usuário ainda revisa).
- Validação roda em tempo real via `useMemo` sobre o estado do form.

**5. Cobertura de testes** em `src/lib/sso/__tests__/consistency.test.ts`: 1 caso por regra (entrada feliz + entrada que dispara o issue), garantindo IDs estáveis.

### Não-escopo

- Sem mudanças na edge `sso-test-login` nem em migrations.
- Sem validação online (DNS, MX, JWKS) — só checagem estática local.
- Sem alteração no fluxo de runtime do login real.

### Critérios de aceite

1. Editor mostra painel de consistência com contagem ao vivo.
2. Salvar fica bloqueado se houver `severity='error'`.
3. Cada regra da tabela acima dispara/cessa conforme o caso.
4. Autofixes (normalizar domínios, remover duplicados) funcionam em 1 clique.
5. Configuração 100% válida: painel exibe estado "Configuração consistente".
6. Testes unitários cobrem todas as regras.

### Arquivos

- ➕ `src/lib/sso/consistency.ts`
- ➕ `src/lib/sso/__tests__/consistency.test.ts`
- ➕ `src/hooks/useSSOConsistency.ts`
- ➕ `src/components/admin/sso/SSOConsistencyPanel.tsx`
- ✏️ `src/components/admin/sso/SSOWizardDialog.tsx` (integração + bloqueio do botão Salvar)


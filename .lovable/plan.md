

## Plano — Filtro de claims + rastreamento de regras aplicadas no Sandbox SSO

### Diagnóstico

O `SSOSandboxPanel` hoje:
- Mostra o JSON de claims inteiro num `Textarea`, sem foco em uma claim específica.
- O painel "Resultado" exibe `resolved_role` e `matched_group`, mas **não diz qual claim do JSON foi consumida** para email/nome/grupos, nem qual regra de `claim_mapping` casou, nem por que as outras `role_mappings` foram **descartadas**.
- A edge `sso-test-login` retorna o resultado final mas não expõe a "trilha" da decisão (só `matched_group`).

### Comportamento

1. **Chips "Claim em foco"** acima do `Textarea` (esquerda): `Tudo` (default), `email`, `name`, `groups`, `domain`. Ao escolher, o painel direito ganha um card `<ClaimFocusCard />` no topo destacando:
   - O **caminho da claim** no JSON segundo o `claim_mapping` em uso (ex.: `claim_mapping.email = "preferred_username"`).
   - O **valor bruto** lido das `mock_claims` para essa chave (ou "(não encontrada)").
   - O **valor normalizado** que entrou na decisão (email lowercased, groups como array, domain extraído).
   - Para `groups`: lista cada item com badge verde no(s) que casou(aram) com algum role mapping e cinza nos demais.

2. **Card "Regras aplicadas"** (direita, sempre visível após simular):
   - **Claim mapping aplicado**: tabela `Campo lógico → Claim no JWT → Valor obtido`, com badge `aplicado`/`vazio`. Permite ver que `email` veio de `preferred_username` e não de `email`.
   - **Role mappings avaliados**: lista ordenada de TODAS as regras `idp_group:app_role` cadastradas no provider, cada uma com badge:
     - `✓ aplicada` (verde) — primeira que casou.
     - `○ ignorada (regra anterior já casou)` (cinza) — regras subsequentes que também casariam.
     - `✗ não casou` (outline) — grupo não está nos grupos do usuário.
   - Sinaliza também quando o **`default_role`** prevaleceu (badge "fallback aplicado").

3. **Filtros de visualização** (cliente-only) acima do card "Regras aplicadas": chips `Todas`/`Aplicadas`/`Ignoradas`/`Sem match` + busca livre por nome de grupo IdP.

### Detalhes técnicos

- ✏️ **`supabase/functions/sso-test-login/index.ts`** — adicionar ao `preview`:
  - `claim_mapping_used: { email, full_name, groups }` — chaves efetivamente usadas (com fallbacks resolvidos).
  - `claim_values: { email_raw, full_name_raw, groups_raw }` — valor bruto extraído de `mock_claims` antes da normalização.
  - `role_mappings_evaluated: Array<{ idp_group, app_role, status: 'matched' | 'skipped' | 'no_match', ordem }>` — lista completa em ordem.
  - `default_role_used: boolean`.
  - Substituir o loop atual de `role_mappings` por um que percorre todos e marca status. Sem breaking changes — só campos novos opcionais.

- ✏️ **`SSOSandboxPanel.tsx`**:
  - Atualizar tipo `SimulationResult`.
  - Estado `focusClaim`, `mappingFilter`, `mappingSearch`.
  - Chips de focus claim acima do `Textarea`.
  - `<ClaimFocusCard />` no topo do painel de resultado, antes dos `<Step />`.
  - `<RulesAppliedCard />` após os `<Step />`, antes do `Collapsible` JSON.
  - Linha extra no Step "Resolução de papel" quando `default_role_used`.

- Tudo coeso no mesmo arquivo; se ultrapassar ~450 linhas, extraio para `src/components/admin/sso/sandbox/`.

### Critério de pronto

1. Chips de claim em foco renderizam acima do JSON e funcionam antes de simular (mostram só o caminho do mapping).
2. "Claim em foco = email" mostra: chave usada, valor bruto, valor normalizado.
3. "Claim em foco = groups" lista cada grupo do usuário com badge indicando se casou em algum role mapping.
4. Card "Regras aplicadas" lista todas as regras com badges `aplicada`/`ignorada`/`sem match` na ordem cadastrada.
5. Filtro `Aplicadas` reduz a lista para apenas a regra que casou.
6. Quando ninguém casa, UI sinaliza "fallback default_role aplicado".
7. Edge continua compatível com chamadas antigas.

### Arquivos

- ✏️ `supabase/functions/sso-test-login/index.ts`
- ✏️ `src/components/admin/sso/SSOSandboxPanel.tsx`


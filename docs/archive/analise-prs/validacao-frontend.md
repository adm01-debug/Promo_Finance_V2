# Validação Frontend — PRs #237, #226, #225

> **Tipo:** auditoria somente-leitura (nenhum código alterado)
> **Data:** 2026-11-07
> **Repo:** `adm01-debug/Promo_Finance_V2`
> **Base de verificação:** `main` @ `6bedb9246ff083fbfec8d08073f058eaf3845bad` (06/11/2026 21:04Z)
> **Método:** API GitHub (diffs, compares, commits por arquivo, conteúdo de `main`, deployments)

---

## Resumo executivo

| PR | Escopo | Classificação | Chegou ao main? |
|----|--------|---------------|-----------------|
| #237 | AcordoParcelamentoDialog, app-url, asaas-proxy | **CORRIGIDO E VERIFICADO** | ✅ Sim (merge direto `c464deb2`) |
| #226 | boletos types, useBoletos, SECURITY_RULES, migrations | **SUPERADO** (entregue via #247) | ✅ Sim (via PR #247, merge `309ee321`) |
| #225 | n8n-callback (HMAC + fallback) | **SUPERADO** (entregue via commit `dca65c5a`) | ✅ Sim (via commit direto) |

**Prettier pendente:** nenhum. A única diferença de formatação observada (`severity invalida` sem acento) é mudança intencional do commit `dca65c5a`, não pendência de formatação.

**Deploy:** produção `success` em 07/11/2026 (deployment `7622478453`, sha `c3efb8d9` — posterior ao HEAD do main verificado, portanto inclui os 3 fixes).

---

## 1. PR #237 — AcordoParcelamentoDialog + app-url + asaas-proxy

**Status do PR:** MERGED (06/11/2026 19:26Z), merge commit `c464deb25e8b01f6de0b38babde7ba5fe34768e8`, head `claude/feat-steps25-26-30-32` @ `47c95f9de`, 3 arquivos, +22/−3.

### 1.1 Banner amarelo no AcordoParcelamentoDialog (Step 25)

**Classificação: CORRIGIDO E VERIFICADO**

Evidência no `main` — `src/components/cobranca/AcordoParcelamentoDialog.tsx:179-186`:

```tsx
{contasReceberId.length === 0 && clienteNome.length > 0 && (
  <div className="flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
    <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
    <div>
      <p className="text-sm font-semibold text-yellow-500">
        Nenhuma conta a receber vinculada
      </p>
      ...
```

- Import de `AlertTriangle` presente no topo do arquivo.
- Condição de exibição: `contasReceberId.length === 0 && clienteNome.length > 0` (banner só aparece quando há cliente selecionado mas sem contas vinculadas).

### 1.2 Throw em `_shared/app-url.ts` (Step 26)

**Classificação: CORRIGIDO E VERIFICADO**

Evidência no `main` — `supabase/functions/_shared/app-url.ts`:

```ts
throw new Error('[app-url] Nenhuma URL base configurada. Defina APP_BASE_URL.');
```

### 1.3 Guard `exigirPapel` em asaas-proxy `consultar_saldo` (Step 30)

**Classificação: CORRIGIDO E VERIFICADO**

Evidência no `main` — `supabase/functions/asaas-proxy/index.ts`:

- Linha 15: `import { exigirVinculoEmpresa, exigirPapel } from '../_shared/auth-guard.ts';`
- Linha 752: `case 'consultar_saldo': {`
- Linha 753: `const guardSaldo = await exigirPapel(req, ['admin', 'admin_global', 'financeiro']);`
- Linha 760: `const escopoExtrato = await exigirVinculoEmpresa(user.id, data?.empresa_id, req);`

### 1.4 Integração ponta a ponta

**Classificação: CORRIGIDO E VERIFICADO**

Evidência no `main` — `src/pages/Cobrancas.tsx`:

- Linha 48: `import { AcordoParcelamentoDialog } from '@/components/cobranca/AcordoParcelamentoDialog';`
- Estado: `const [acordoDialogOpen, setAcordoDialogOpen] = useState(false);`
- Botão "Novo Acordo Proativo" com `onClick={() => setAcordoDialogOpen(true)}` (desabilitado sem `currentEmpresaId`/`selectedDevedor`)
- Renderização condicional no final:

```tsx
{currentEmpresaId && (
  <AcordoParcelamentoDialog
    open={acordoDialogOpen}
    onOpenChange={setAcordoDialogOpen}
    contasReceberId={selectedDevedor?.conta_ids}
    clienteNome={selectedDevedor?.cliente_nome}
    valorTotal={selectedDevedor?.valor_total}
    empresaId={currentEmpresaId}
  />
)}
```

---

## 2. PR #226 — boletos types + useBoletos + SECURITY_RULES + migrations

**Status do PR:** CLOSED sem merge (merged_at: null, mergeable_state: "dirty"). Head `Github_Copilotfix-boletos-types-security-rules-261031` @ `516eb487`, 5 arquivos, +57/−9, 2 commits.

**Rota de chegada ao main:** o conteúdo do #226 **não** entrou por merge direto. Foi entregue pelo **PR #247** ("fix: boletos asaas_id types + migrations steps 10+20 (rebuid sem conflito)"), MERGED em 01/11/2026 03:15Z, merge commit `309ee321077f1a4732d8e37ac9bf930ffdb77ff6`, head `claude/fix-boletos-types-261031-1822` @ `256b40ce`, 4 arquivos, +23/−9.

O corpo do #247 confirma: *"Rebuild limpo de #226, sem conflito com main. O conflito original de #226 era exclusivamente em SECURITY_RULES.md (seção admin_global já mergeada via PR #236). Esta PR aplica apenas as mudanças funcionais."*

### 2.1 `src/integrations/supabase/types.ts` — asaas_id/external_provider

**Classificação: CORRIGIDO E VERIFICADO** (via #247)

Evidência no `main` — `types.ts` adiciona `asaas_id: string | null` e `external_provider: string | null` em boletos `Row`, `Insert` e `Update` (+6 linhas). Último commit do arquivo no main: `309ee321` (merge do #247).

### 2.2 `src/hooks/useBoletos.ts` — sem cast

**Classificação: CORRIGIDO E VERIFICADO** (via #247)

Evidência no `main`:
- Interface `Boleto` com `asaas_id?: string | null` e `external_provider?: string | null`.
- Removido o type alias `BoletosData` (workaround) e o cast `as unknown as BoletosInsert`; usa `data as Boleto[]`.
- `validarEmissaoBoletoConfirmada` presente (VAL-GAP-04).

### 2.3 Migrations `20260913160000` e `20260913170000`

**Classificação: CORRIGIDO E VERIFICADO** (via #247)

Evidência no `main`:
- `supabase/migrations/20260913160000_mv_perf_weekly_unique_idx.sql` — índice único idempotente em `mv_performance_alerts_weekly`.
- `supabase/migrations/20260913170000_boletos_add_asaas_cols.sql` — `ADD COLUMN IF NOT EXISTS asaas_id text, external_provider text` em `boletos`.

### 2.4 `SECURITY_RULES.md` — seção "Modelo de Admin Global"

**Classificação: CONTRADITÓRIO** (achado de revisão, não corrigido)

Evidência no `main` — seção "Modelo de Admin Global" presente (+56 linhas). Porém:

1. **`admin_global` não é papel real registrado no banco.** O review do codex-correção no #226 apontou que o papel real é apenas `admin`; `admin_global` não existe nas policies/roles. O guard do asaas-proxy (`exigirPapel(req, ['admin', 'admin_global', 'financeiro'])`) referencia `admin_global` — se o papel não existir no banco, o guard nunca autoriza por esse caminho (não quebra, mas a permissão documentada não é efetiva).
2. **Contradiz policies tenant-scoped.** A seção descreve um admin com acesso global, o que conflita com o modelo de isolamento por `empresa_id`/`empresa_acessivel(empresa_id)` usado nas policies RLS.

> ⚠️ **Nota:** este item é um achado de auditoria, não uma correção do PR. O PR #226/#247 não introduziu a seção (ela já veio via #236); o #247 explicitamente **não** modificou `SECURITY_RULES.md`.

---

## 3. PR #225 — n8n-callback (HMAC-SHA256 + fallback)

**Status do PR:** CLOSED sem merge (merged_at: null). Head `c0a2c8cd` @ `c0a2c8cd7bbd3d199eb74d30e1fe40d9d2faacea`, 1 arquivo (`n8n-callback/index.ts`), +79/−29.

**Rota de chegada ao main:** o conteúdo do #225 **não** entrou por merge direto. Foi entregue pelo commit `dca65c5a507bfaae` (06/11/2026 03:07Z), mensagem "fix(n8n-callback): BufferSource + readBytes + prettier — **Substitui #227**". O PR #227 (que substituiria o #225) também foi fechado sem merge; o commit direto incorporou os fixes de CI.

### 3.1 HMAC-SHA256 com fallback estático

**Classificação: CORRIGIDO E VERIFICADO** (via commit `dca65c5a`)

Evidência no `main` — `supabase/functions/n8n-callback/index.ts`:

- `readBytes` no lugar de `readJson` (lê body bruto para HMAC e reusa para `JSON.parse` sem consumir o stream duas vezes).
- `authorizeHmacOrSharedSecret(secret, rawBytes, x-n8n-signature, x-n8n-secret)`:
  - Tentativa 1: HMAC-SHA256 via `x-n8n-signature: sha256=<hex>` com `crypto.subtle.importKey`/`sign` e `timingSafeEqual`.
  - Fallback transitório: `x-n8n-secret` com comparação timing-safe + `console.warn` de migração.
  - Erros: `secret_not_configured` (503), `unauthorized` (401), `hmac_verification_failed` (401), `invalid_body` (400), `invalid_json` (400).
- `body as unknown as BufferSource` — fix do erro TS2345 (Uint8Array não é BufferSource no tipo do Deno).
- Testes reescritos em `index.test.ts`: `readJson` → `readBytes`, asserts ajustados (readBytes é chamado antes da verificação do segredo).

### 3.2 Prettier

**Classificação: SEM PENDÊNCIA**

A única diferença de formatação observada é `severity inválida` → `severity invalida` (remoção do acento) no `throw new Error` do `create_alert`. O diff do commit `dca65c5a` mostra que essa mudança foi **intencional** (parte do commit "prettier"), não uma pendência de formatação. Nenhum arquivo dos 3 PRs está com formatação Prettier pendente no main.

---

## 4. Deploy

**Classificação: VERIFICADO**

Evidência — deployments do repo:

| Deployment | Ambiente | Sha | Status |
|------------|----------|-----|--------|
| `7622478453` | Production | `c3efb8d9` | **success** (07/11/2026 14:36Z) |
| `7622012688` | Production | `1bdaf6fe` | success (07/11/2026 13:52Z) |

O deploy de produção mais recente (`c3efb8d9`, 07/11) é posterior ao HEAD do main verificado (`6bedb924`, 06/11), portanto inclui os 3 fixes.

> ⚠️ **Limitação:** o deploy de **edge functions** (n8n-callback, asaas-proxy) não é observável via API GitHub. O deploy Vercel cobre o frontend. A presença das edge functions em produção (Supabase) é **NÃO VERIFICADA** nesta auditoria — requer checagem via MCP Supabase (`supabase_functions_list`).

---

## 5. Tabela consolidada

| # | Correção | PR original | Classificação | Evidência (main) |
|---|----------|-------------|---------------|------------------|
| 1 | Banner amarelo AcordoParcelamentoDialog | #237 | CORRIGIDO E VERIFICADO | `AcordoParcelamentoDialog.tsx:179-186` |
| 2 | Throw em app-url.ts | #237 | CORRIGIDO E VERIFICADO | `_shared/app-url.ts` |
| 3 | Guard exigirPapel em consultar_saldo | #237 | CORRIGIDO E VERIFICADO | `asaas-proxy/index.ts:753` |
| 4 | Integração dialog em Cobrancas.tsx | #237 | CORRIGIDO E VERIFICADO | `Cobrancas.tsx:48` + render final |
| 5 | types.ts asaas_id/external_provider | #226 | CORRIGIDO E VERIFICADO (via #247) | `types.ts` Row/Insert/Update |
| 6 | useBoletos sem cast | #226 | CORRIGIDO E VERIFICADO (via #247) | `useBoletos.ts` |
| 7 | Migrations 20260913160000/170000 | #226 | CORRIGIDO E VERIFICADO (via #247) | `supabase/migrations/` |
| 8 | SECURITY_RULES admin_global | #226 | CONTRADITÓRIO (achado) | `SECURITY_RULES.md` +50-56 |
| 9 | n8n-callback HMAC + fallback | #225 | CORRIGIDO E VERIFICADO (via `dca65c5a`) | `n8n-callback/index.ts` |
| 10 | Testes n8n-callback readBytes | #225 | CORRIGIDO E VERIFICADO (via `dca65c5a`) | `n8n-callback/index.test.ts` |
| 11 | Prettier | #225 | SEM PENDÊNCIA | `severity invalida` intencional |

---

## 6. Achados e riscos

1. **`admin_global` não é papel real** — o guard do asaas-proxy (`asaas-proxy/index.ts:753`) e a seção do SECURITY_RULES.md referenciam um papel que não existe no banco. Não quebra o fluxo (admin/financeiro continuam autorizados), mas a permissão documentada é inefetiva. **Recomendação:** verificar se `admin_global` existe como papel no banco; se não, remover da lista do guard ou criar o papel.
2. **PRs fechados sem merge como rota oficial** — #226 e #225 foram fechados sem merge; o conteúdo chegou por rotas alternativas (#247 e commit direto). O registro de "PR fechado" pode confundir auditorias futuras. **Recomendação:** documentar a substituição nos PRs fechados (comentário apontando para #247/`dca65c5a`).
3. **Deploy de edge functions não verificado** — a auditoria confirma o código no main e o deploy Vercel, mas não confirma se n8n-callback/asaas-proxy estão deployados no Supabase.

---

## 7. Metodologia

- Diffs por arquivo dos 3 PRs (via `github_get_pr_diff`/`list_pr_files`).
- Compare `head...main` para cada PR (revelou que o conteúdo de #226/#225 já estava no main).
- Rota de chegada via `github_list_commits` por arquivo no main (último commit de cada arquivo).
- Conteúdo atual do main via `github_get_file`/`github_get_content` (ref=main).
- Deploy via `github_list_deployments` + statuses.
- Nenhum arquivo do repo foi criado/modificado por esta auditoria.
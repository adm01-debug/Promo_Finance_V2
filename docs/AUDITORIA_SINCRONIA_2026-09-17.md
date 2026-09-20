# Auditoria de Sincronia — Local ↔ GitHub ↔ Banco (2026-09-17)

> Auditoria exaustiva executada por agente (Cline) em 17/09/2026, comparando o estado do clone local (`/home/joaquim_ataides/projetos/Promo_Finance_V2`), o repositório GitHub (`adm01-debug/Promo_Finance_V2`) e o banco Supabase canônico do projeto (`bwwbeyolnnzppeuhgkcd`).

## Resumo executivo

| Dimensão | Situação antes | Ação tomada | Situação depois |
| --- | --- | --- | --- |
| Commits locais sem GitHub | 25 commits em 6 branches | Push de todas as branches + PR #88 | ✅ Protegidos |
| `main` local vs remota | 5 commits atrás (PRs #73, #79, #85–#87) | Fast-forward | ✅ Sincronizada |
| Branch de trabalho vs `main` | Divergida (sem os 5 commits) | Merge sem conflitos (`c358cf4a`) | ✅ PR aberto |
| Migration remote-only `20260912100000` | Aplicada no banco, sem arquivo local | Confirmada idêntica à da `origin/main` (PR #79) | ✅ Coberta pelo merge |
| Edge Functions | 104 remotas | Comparação nome a nome | ✅ 100% com fonte local |
| Histórico de migrations | Drift estrutural | Documentado (abaixo) | ⚠️ Pendente decisão |
| `delete_branch_on_merge` | `false` | Ativado via API | ✅ Ativo |

## 1. Git / GitHub

### 1.1 Branches recuperadas (commits exclusivos locais → GitHub)

| Branch | Commits | Ponta | Status |
| --- | --- | --- | --- |
| `fix/plano-50-etapas-20260913` | 19 | `19364b08` | Enviada + merge com `main` → **PR #88** |
| `fix/codex-h111911-preserva-c696391` | 2 | `7c684900` | Enviada (backup) |
| `fix/codex-c696391-contratos-auth-e2e` | 1 | `29eb6719` | Fast-forward no remoto |
| `fix/codex-h0831-gates-pos-merge` | 1 | `fb9e6442` | Enviada como `backup/codex-h0831-gates-blinda-replay` (remoto havia divergido) |
| `fix/codex-h0831-reconciliacao-online` | 1 | `80aa2880` | Fast-forward no remoto |
| `fix/codex-auditoria-financeira-20260910` | 1 (docs) | `8b62718f` | Enviada (backup) |

Verificação por SHA via GraphQL (`object(oid:)`): os commits acima retornavam `null` no GitHub antes do envio.

### 1.2 Estado limpo confirmado

- Working tree: 0 modificados / 0 não rastreados.
- Stash: vazio.
- 17 branches locais já idênticas ao remoto; commits das branches `graphify*`, `054955`, `revisao-plano` preservados via merges anteriores (PRs #68, #80).

## 2. Banco de dados (Supabase `bwwbeyolnnzppeuhgkcd`)

### 2.1 Edge Functions — ✅ sincronizadas

- 104 funções remotas; **todas** com diretório-fonte local.
- Extras locais: `_shared` (biblioteca), `fuzz_test.ts`, `stress_test.ts` (testes) — esperados.

### 2.2 Histórico de migrations — ⚠️ drift estrutural (não resolvido)

Comparação `supabase/migrations/` local × `supabase_migrations.schema_migrations` do banco:

| Conjunto | Quantidade | Observação |
| --- | --- | --- |
| Versões só no banco | 324 | Linha do tempo 2026-05 → 2026-07 (histórico antigo do schema) |
| Versões só local | 562 | Inclui `001`–`003`, linha 2024-12 → 2026-09 |
| Em ambos | 33 | Inclui `20260905130000` e `20260912100000` |

Fatos:

- A migration `20260912100000_revoke_anon_admin_observability_rpcs` estava aplicada no banco e sem arquivo no branch de trabalho local — o arquivo já existia na `origin/main` (PR #79) com conteúdo **byte a byte idêntico** aos statements registrados no banco.
- O schema real foi construído majoritariamente fora do fluxo `supabase db push`, por isso o histórico remoto não reflete os 598 arquivos locais.

**Risco**: qualquer `supabase db push`/preview que confie no histórico tentará reaplicar 562 migrations sobre um schema já existente.

**Recomendação** (decisão pendente, exige validação do schema alvo):

1. Emitir `supabase db pull` em ambiente de validação para quantificar o drift real do schema (não do histórico).
2. Se o schema canônico refletir as migrations locais, executar `supabase migration repair --status applied <versões locais>` para alinhar o histórico.
3. Alternativa conservadora: manter como está e **nunca** rodar `db push` contra produção sem revisão manual (comportamento atual de fato).

## 3. Configuração e higiene

- **MCP "Supabase — Visão V2" aponta para outro projeto** (sistema de câmeras): qualquer agente usando esse MCP contra este repo auditará o banco errado. Corrigir a config do MCP para `bwwbeyolnnzppeuhgkcd`.
- Repo está **público** (AGENTS.md declara privado) — decisão de negócio pendente: tornar privado (impacta forks/CI externos se houver).
- `delete_branch_on_merge` ativado nesta auditoria (alinhado ao fluxo do AGENTS.md).
- 18 worktrees ativos em `~/codex-workspaces` e `~/hermes-workspaces` — limpeza recomendada após conferência individual (multi-agente).

## 4. Evidências

- `git ls-remote` pós-auditoria confirma as 6 branches com as pontas listadas em §1.1.
- Dump do histórico de migrations: `supabase db dump --data-only --schema supabase_migrations`.
- PR #88: 21 commits, 136 arquivos, +18.098/−6.800; suíte local 240 arquivos / 2.956 testes OK.

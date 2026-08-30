# Relatório do Lote 01 — Documentação + Contenção de CI

> **PR:** #51 · **Branch:** `fix/cline-h120728-indice-e-matrizes` · **Base:** `origin/main` @ `5093a727`
> **Data:** 2026-08-30 · **Orquestrador:** Cline (worktree isolado `chat-h120728`)
> Este relatório cobre o commit inicial (`ebb253bf`) e a rodada de correções da revisão (vazamento E2E, comentários de revisão e serialização do logout destrutivo).

## 1. Escopo executado

| Item | Artefato | Estado |
|------|----------|--------|
| Índice das 100 etapas (§14) | `docs/execucao-cline/INDICE.md` | ✅ criado e corrigido |
| Matriz de decisões (§16) | `docs/execucao-cline/MATRIZ_DECISOES.md` | ✅ criada e corrigida |
| Matriz auth 103/103 (etapa 048, pré-classificação estática) | `docs/execucao-cline/MATRIZ_AUTH_EDGE.md` | ✅ criada e corrigida |
| Este relatório | `docs/execucao-cline/RELATORIO_LOTE_01.md` | ✅ criado |
| Contenção do vazamento de artefatos E2E | `.github/workflows/ci.yml` | ✅ aplicada |
| Serialização do fluxo destrutivo de logout | `ci.yml`, `playwright.config.ts`, `e2e/auth/*` | ✅ aplicada |

## 2. Contenção do vazamento de artefatos E2E

**Problema (evidência, run 33336176738):** os jobs E2E publicavam artefatos com o conteúdo completo das execuções contra o ambiente real do Supabase:
- `blob-report-<shard>.zip` (ex.: 207,8 MB e 226,5 MB) com `if: always()`, retenção 7 dias;
- `playwright-report` (HTML mesclado, inclui traces/screenshots/vídeos de páginas autenticadas com o usuário `E2E_USER_EMAIL`), retenção **30 dias**.

Em repositório público, qualquer pessoa com acesso de leitura pode baixar artefatos de runs de PR → exposição de dados de sessão/ambiente de teste.

**Correção (`.github/workflows/ci.yml`):**
1. Removido o step `Upload blob report` e todo o job `e2e-report` (download + merge + upload do HTML);
2. Reporter dos shards alterado de `--reporter=blob` para `--reporter=list` (saída apenas no log do runner);
3. Screenshots/traces/vídeos continuam gravados **apenas no disco efêmero do runner** (nunca publicados);
4. Artefatos não-E2E mantidos: `function-privileges` (metadado de schema) e `ci-error-logs` (logs de build, `if: failure()`).

**Risco residual:** perda de debug E2E por artefato. Mitigação: diagnóstico via log do runner. Rollback: restaurar os steps removidos (reversível via git).

## 3. Serialização do fluxo destrutivo de logout

**Mecanismo do problema:** `src/hooks/AuthProvider.tsx` → `signOut()` (linha 215+) marca `user_sessions.revoked = true` para o usuário (linhas 251–266), chama `supabase.auth.signOut()` (linha 276) e faz cleanup local. Os 3 shards do CI compartilham **o mesmo usuário** (`E2E_USER_EMAIL`); o teste `logout retorna para /auth e limpa sessão` (ex-`admin-rbac.e2e.ts:153`) rodava em paralelo dentro do shard 2 e invalidava a sessão em uso — padrão consistente com as **34 falhas em cascata** do shard 2 (run 33336176738: 12 passed / 34 failed / 1 flaky, incluindo rotas autenticadas e redirecionamentos inesperados para `/auth`).

**Correção (opção "serializar o fluxo destrutivo", conforme direção do proprietário):**
1. `playwright.config.ts`: projeto `chromium` ganhou `testIgnore: /auth\/logout-real\.e2e\.ts/`; novo projeto **`chromium-destructive`** (testMatch do arquivo, storageState vazio, sem dependência de setup);
2. `e2e/auth/logout-real.e2e.ts` (novo): recebeu os 3 testes do fluxo real admin (login, `/admin/system-health`, logout) com `test.describe.configure({ mode: 'serial' })` e contexto limpo;
3. `e2e/auth/admin-rbac.e2e.ts`: describe movido e helper `logout` órfão removidos (bloqueio anônimo, senha inválida e RBAC negativo permanecem nos shards);
4. `ci.yml`: novo job **`E2E Destructive (serial)`** com `needs: [e2e]` — roda **após** os shards, sozinho, sem upload de artefatos; `post-merge-audit` agora depende dele.

A alternativa "isolar usuários por shard" exigiria 3 conjuntos de credenciais (secrets novos) — fica registrada como opção futura para o proprietário.

## 4. Correções de revisão aplicadas aos documentos

| Origem | Correção |
|--------|----------|
| CodeRabbit (INDICE.md) | pt-BR na prosa: "Desempenho" (lote H), "em relação a" (etapa 014), "navegadores" (etapa 078), com nota de edição |
| CodeRabbit (INDICE.md, MD038) | etapa 074: `\|\| true` sem espaços dentro do code span |
| CodeRabbit (MATRIZ_AUTH_EDGE.md) | resumo JWT-gateway alinhado à tabela: quem valida `getUser` é `bitrix24-sync` e `open-finance` (não `conciliacao-ia`) |
| CodeRabbit (MATRIZ_DECISOES.md, D11) | "abuso anônimo" requalificado como **potencial**, pendente de testes negativos de runtime |
| Codex (MATRIZ_DECISOES.md, D1) | números corrigidos com fonte: **551 arquivos no repo** (contagem local; auditoria de 26/08 registrava 548) vs **28 entradas no ledger live** (`docs/AUDITORIA_EXAUSTIVA_PLANO_100_ETAPAS_2026-08-26.md` §6.3, 6 versões ausentes) |

## 5. Testes executados e não executados

| Teste | Onde | Resultado |
|-------|------|-----------|
| `bunx playwright test --list` (valida config + compilação dos specs) | local | ver seção 6 |
| YAML do `ci.yml` parseável | local | ver seção 6 |
| Quality Gate (lint, zod-coverage, secret-isolation, type-check, unit, build) | CI | aguardando push deste commit |
| E2E shards 1–3 (agora sem logout destrutivo) | CI | aguardando push deste commit |
| E2E Destructive serial (job novo) | CI | aguardando push deste commit |
| Testes negativos de runtime das 21 P0 da matriz auth | — | **não executados** (continuação da etapa 048; requer ambiente de teste — decisão D12) |

**Snapshots:** verificado que **não existem** baselines commitados no repo — nenhum `*.snap`, nenhum `__screenshots__` e **nenhum commit no histórico** tocando `e2e/visual-theme.e2e.ts-snapshots/`. No run 33337843772 o shard 3 falhou com `A snapshot doesn't exist ... writing actual` nos testes visuais: sem baseline e com telas autenticadas renderizando **dados reais mutáveis**, a comparação não é determinística entre runs (e localmente a página nem renderiza sem as env `VITE_*`). Decisão registrada: `toHaveScreenshot` roda com `ignoreSnapshots: true` **somente em CI** (a navegação, os headings e a aplicação de tema continuam sendo exercitados; localmente a comparação segue ativa). A suíte visual determinística com dados mockados fica registrada como débito ligado à etapa 078 — não é cobertura perdida, porque a comparação sem baseline nunca protegeu nada.

## 6. Evidências

- Run anterior (pré-correção): `actions/runs/33336176738` — shard 2/3 failed (34 testes); artefatos `blob-report-2.zip` (207,8 MB, ID 9739234842) e `blob-report-3.zip` (226,5 MB, ID 9739271129) publicados.
- Comentários de revisão atendidos: 4 × CodeRabbit (discussion_r3890577005, r3890577007, r3890577010, r3890577014) + 1 × Codex (discussion_r3890581789).
- Contagem de migrations: `ls supabase/migrations | wc -l` → **551** (2026-08-30).
- Contagens da matriz auth: 103 linhas; 4 `verify_jwt=sim`; prioridades 21×P0 + 13×P1 + 42×P2 + 27×P3 = 103.

## 7. Riscos e rollback

| Risco | Mitigação | Rollback |
|-------|-----------|----------|
| Perda de debug E2E por artefato | log `list` no runner | restaurar steps de upload (git revert) |
| Job novo não registrado como required check no branch protection | se o protection listar apenas os shards, o job novo é informativo até decisão do proprietário | n/d |
| Outro spec passe a fazer logout real no futuro | nenhum outro faz hoje (grep: apenas `logout-real.e2e.ts`) | — |
| `post-merge-audit` não roda se `e2e-destructive` falhar | comportamento desejado (gate) | ajustar `needs` |

## 8. Pendências e bloqueios

- Merges de #48/#49/#50/#51: **aguardando autorização do proprietário**.
- Isolamento por usuário/shard: requer secrets adicionais (decisão do proprietário).
- Testes negativos de runtime das P0 da matriz auth: requer ambiente (D12).
- Nenhuma ação remota/destrutiva foi executada nesta rodada (apenas push do branch próprio).


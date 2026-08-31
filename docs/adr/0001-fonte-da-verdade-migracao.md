# ADR 0001 — Fonte da Verdade para Migracao

Data: 2026-08-25
Status: Aceito

## Contexto

O projeto Promo Finance V2 tem dois projetos Supabase:
- **SRC** (`lszcmoymovkpckehlagr`) — Lovable Cloud, origem do schema e código
- **DST** (`bwwbeyolnnzppeuhgkcd`) — destino canônico, alvo do go-live

Após múltiplas waves de migração executadas por agentes diferentes (Claude, Hermes, Codex),
o estado dos dois bancos divergiu em schema, policies, funções e ledger.

## Decisão

1. **SRC define schema, funções e policies** — toda nova coluna, constraint, função ou policy
   deve existir primeiro na SRC (via migration no repo) e depois ser propagada ao DST.

2. **DST define dados de produção** — rows em `oportunidades_elisao`, seeds fiscais, usuários
   auth e snapshots operacionais vivem no DST e não são sobrescritos pela SRC.

3. **O repo é a única forma de aplicar mudanças** — DDL manual via MCP sem migration
   correspondente no ledger é proibido após E56 (cutover).

4. **Colunas DST-only são preservadas enquanto houver código referenciando** — verificar
   grep no repo antes de qualquer DROP COLUMN.

5. **Agentes não fazem DROP de dados sem APROVADO explícito de Joaquim** — incluindo
   DROP COLUMN em tabela com linhas, DELETE de seeds, DROP TABLE.

## Consequências

- O diff `diff.mjs SRC DST` deve tender a zero após as fases 1-5.
- Divergências aceitas ficam documentadas no Apêndice A do plano.
- Cada wave de agente cria PRs rastreáveis em `fix/*` branches, nunca push direto em main.

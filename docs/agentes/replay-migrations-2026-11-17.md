# Replay das migrations — estado em 2026-11-17

Resposta com evidência à issue #90 ("Replay do zero das migrations não completa").

## O replay completa

`bash scripts/db/replay-migrations.sh` num Postgres 16 limpo:

```
aplicados=1034  falharam=0  total=1034
```

**Requisito que "postgresql-16" não cobre:** as migrations
`20251214193742` e `20251214204951` fazem `CREATE EXTENSION pg_cron` e
`pg_net` **sem tratamento de erro**, então o replay precisa dos _arquivos_
dessas extensões no host (em Debian/Ubuntu: `postgresql-16-cron`,
`postgresql-16-pg-net`, `postgresql-contrib`). A biblioteca `.so` do pg_cron
não é necessária — o replay só cria objetos SQL, não roda o agendador. O script
checa isso antes de começar e aborta nomeando o que falta, em vez de produzir um
"falhou" enganoso.

A issue foi aberta em 20/09/2026, quando o replay parava em ~`20260421`. Os erros
documentados nela (ALTER VIEW sem guard, policy duplicada) foram corrigidos pelas
PRs #87 e #88 e pelos commits `dee40a96`, `1859c623`, `5f16e5a0`. Desde então nada
quebra o replay.

## O que faltava não era migration: era reproduzir o ambiente

Antes de concluir que um arquivo está quebrado, duas condições têm de ser iguais às
de produção. Sem elas o replay acusa 72 falhas que não existem na Supabase:

1. **Objetos que a plataforma provê, não a migration** — `scripts/db/replay-bootstrap.sql`:
   roles (`anon`, `authenticated`, `service_role`, …), schemas (`auth`, `storage`,
   `vault`, `extensions`), `auth.users`/`auth.uid()`/`auth.jwt()`, `storage.buckets`,
   a publicação `supabase_realtime`, `supabase_migrations.schema_migrations` (criada
   pelo CLI) e o schema `cron` (o `pg_cron` não tem biblioteca `.so` em container
   comum, então é simulado com as funções que as migrations realmente chamam).
2. **Uma transação por arquivo** (`psql --single-transaction`), que é como o
   `supabase db push` aplica. Sem isso, `CREATE TEMP TABLE … ON COMMIT DROP` é
   descartado no commit do próprio `CREATE` e o arquivo falha por um motivo que não
   existe em produção — foi o caso de `20260728124719` (`_rep`) e
   `20261112024218` (`_cat_map`).

Classificação das 72 falhas iniciais: 35 por falta da tabela de controle do CLI,
29 pelo schema `cron`, 2 por `pg_stat_statements`, 4 em cascata das anteriores e
2 pela semântica de transação. **Zero** eram defeito de migration.

## Divergência repo × produção (drift)

O replay produz mais objetos que o banco canônico `bwwbeyolnnzppeuhgkcd`:

| objeto   | replay (repo) | produção | delta |
| -------- | ------------- | -------- | ----- |
| tabelas  | 292           | 272      | +20   |
| views    | 24            | 20       | +4    |
| funções  | 492           | 212      | +280  |
| policies | 861           | 615      | +246  |
| índices  | 1160          | 686      | +474  |

As 28 tabelas de diferença se separam em dois grupos:

- **8 partições de log** (`audit_logs_2026_11`…`2027_02`, `frontend_error_logs_*`):
  criadas por agenda, não são lacuna. Na direção inversa, produção tem
  `audit_logs_2026_01`…`04` que o repo já não cria — é retenção, mesmo mecanismo.
- **20 tabelas de features nunca ligadas**: `account_lockouts`,
  `asaas_scheduled_transfers`, `audit_log`, `auditoria_configuracoes`,
  `boleto_events`, `cnpja_rate_limit`, `conciliacao_sugestoes`,
  `configuracoes_receber`, `contatos_financeiros`, `elisao_analise_gap`,
  `entity_versions`, `known_devices`, `lalur_lancamentos`,
  `obrigacoes_acessorias`, `ponto_departamentos`, `ponto_funcionarios`,
  `ponto_registros`, `ponto_sync_log`, `registro_duplicidade`,
  `user_preferences`.

**Nenhuma das 20 é consultada pelo app nem por edge function.** Conferido por busca
em `src/` e `supabase/functions/`: a única menção é a string `'account_lockouts'`
numa lista de prioridade em `src/lib/audit-priority.ts:42`, que não acessa a tabela.
Ou seja: é andaime de feature que nunca foi ligada — **não há tela quebrada nem
funcionalidade viva ausente de produção**.

Isso também explica o delta de funções/policies/índices: acompanham essas tabelas,
mais objetos que produção recebeu por caminho fora do `db push` e depois divergiram.

## O que este documento NÃO resolve

- A estratégia do histórico (`migration repair` vs. squash em baseline nova) segue
  sendo decisão do dono — item 2 da recomendação da issue #90.
- O gate de CI que roda este replay em cada PR é mudança de workflow, portanto
  §6.6: fica para o dono. O script já está pronto para ser chamado por um job.
- O limite de preview branches da conta Supabase está estourado, então o check
  `Supabase Preview` é cancelado em todo PR que toca `supabase/` — é ajuste de
  configuração da conta, não de código.

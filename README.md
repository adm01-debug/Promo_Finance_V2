# Branch gerada: inventário do estado real

`inventario/estado/` é refeito pelo workflow `inventario-estado.yml` da main, do banco
oficial (somente leitura) e do código em main — não edite nem abra PR desta branch.

| Arquivo | O que é | Fonte |
| --- | --- | --- |
| `banco.json` | tabelas, RLS, policies, triggers, linhas, cron, extensões, edges publicadas, órfãs e `alertas` | `scripts/inventario/banco.sql` no banco `bwwbeyolnnzppeuhgkcd` + `GET /functions` |
| `rotas.json` | cada URL do front: arquivo, papéis, item de menu, hooks, edges, RPCs, tabelas e buckets | `src/App.tsx` + menu lateral + imports de cada página |
| `edges.json` | cada edge function: linhas, segredos lidos e quem a invoca | `supabase/functions/` |

Comece por `alertas` em `banco.json` e por `problemas` em `rotas.json`.

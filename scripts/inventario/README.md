# scripts/inventario — inventário do estado real

Gera `inventario/estado/` do **estado real**, não de documentação: o banco oficial ao vivo e o código
em `main`. Publicado pelo workflow `.github/workflows/inventario-estado.yml` na branch gerada
**`inventario`** (nunca em `main`, nunca por PR).

## Como ler (antes de grepar o repo)

```sh
git fetch origin inventario
git show origin/inventario:inventario/estado/banco.json | head -40
git show origin/inventario:inventario/estado/rotas.json
```

Ou pelo MCP do GitHub: `github_get_file(ref="inventario", path="inventario/estado/banco.json")`.
Ou pela URL crua:
`https://raw.githubusercontent.com/adm01-debug/Promo_Finance_V2/inventario/inventario/estado/rotas.json`.

Comece por `alertas` (em `banco.json`) e `problemas` (em `rotas.json`): é o que está fora do lugar.

## Os três arquivos

| Arquivo | O que responde | Fonte |
| --- | --- | --- |
| `banco.json` | quais tabelas existem, quais têm RLS e policy, quantas linhas, quais cron jobs rodam e falham, quais extensões, quais edges estão publicadas, quais tabelas estão órfãs | `banco.sql` no banco `bwwbeyolnnzppeuhgkcd` (somente leitura) + `GET /functions` + `.from()` em `src/` e `supabase/functions/` |
| `rotas.json` | cada URL do front: arquivo da página, papéis exigidos, item de menu, hooks, edge functions, RPCs, tabelas e buckets que a tela usa | `src/App.tsx`, `src/components/layout/sidebar/` e o fecho de imports de cada página |
| `edges.json` | cada edge function: linhas, segredos lidos (`Deno.env.get`) e quem a invoca (src, migrations, outras edges, e2e, CI) | `supabase/functions/` |

## Rodar na mão

```sh
# 1) banco — com credencial viva (Management API, transação somente leitura)
SUPABASE_ACCESS_TOKEN=... node scripts/inventario/gerar-banco.mjs

# 1-alt) banco — sessão de agente sem token: rodar banco.sql no MCP
#        `SUPABASE - PROMO FINANCE V2 - MCP` (db_query), salvar a resposta e:
node scripts/inventario/gerar-banco.mjs --entrada /tmp/resposta.json

# 2) front e edges (não precisam de banco; `rg` é obrigatório)
node scripts/inventario/gerar-rotas.mjs
node scripts/inventario/gerar-repo.mjs < /dev/null

# 3) mudou de verdade? (ignora carimbo de data e telemetria rolante do cron)
INVENTARIO_REF=origin/inventario node scripts/inventario/mudou-conteudo.mjs

# 4) testes das funções puras
node --test scripts/inventario/inventario.unit.mjs
```

`gerar-rotas.mjs --check` sai com 1 se o arquivo gerado difere do que está em
`inventario/estado/rotas.json`.

## Garantias

- **Só leitura no banco.** `banco.sql` é um `SELECT` só; o caminho da Management API é
  `POST /database/query/read-only`, que abre transação somente leitura.
- **Banco certo.** `gerar-banco.mjs` recusa qualquer projeto que não seja `bwwbeyolnnzppeuhgkcd`
  (salvo `INVENTARIO_PERMITIR_OUTRO_PROJETO=1`, só para teste) e confere a resposta contra a lista de
  tabelas de `src/integrations/supabase/types.ts` — 90% de cobertura nos dois sentidos, para um banco
  irmão (Lovable, VPS) não passar.
- **Sem segredo na saída.** De `cron.job` sai só o nome das funções chamadas, nunca o `command`
  (que pode ter URL, cabeçalho ou chave); antes de gravar, a saída é recusada se tiver cara de
  credencial (`Bearer …`, JWT, `sb_secret_`).
- **Diff estável.** As chaves são ordenadas e a comparação ignora `medido_em`/`gerado_em` e a
  telemetria de 7 dias do cron: a branch só recebe commit quando algo estrutural muda.

## Limites conhecidos

- `.from(variável)` que não seja `const` de módulo no mesmo arquivo não é resolvido: a tabela pode
  aparecer com uso 0 mesmo sendo usada.
- O ledger de migrations **não** é usado como prova de origem: aqui a produção fica legitimamente à
  frente da `main` enquanto há PR de DDL aberta, e `supabase/migrations/` tem arquivos não rastreados.
- `rotas.json` cobre o menu lateral (`SidebarNavGroups.tsx` + `sidebarFiscalNavGroup.ts`); menus de
  dentro de módulo (ex.: `NavigationTributaria.tsx`) não entram — por isso `menu_sem_rota` pode
  apontar rota que existe em sub-navegação própria.
- `componente` de cada rota é o **último** JSX capitalizado do bloco `<Route>` (fora de wrappers
  conhecidos como `MainLayout`/`ProtectedRoute`): se a página algum dia ganhar filho JSX inline na
  própria declaração da rota (ex. `<Pagina><Modal/></Pagina>`), o script atribui o filho, não a
  página — hoje nenhuma das rotas está assim.

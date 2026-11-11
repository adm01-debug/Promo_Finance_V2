# regras_negocio — regras de negócio para agentes de IA

Produtor da fonte **regras de negócio** do contexto para agentes. Lê código, migrations/`types.ts` e
`docs/contexto/regras/manual/` (texto humano) e publica, na branch derivada `contexto`:

| Arquivo                                          | Conteúdo                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md`   | regras manuais · RLS por operação · constraints/CHECK/FK/colunas calculadas · triggers + `RAISE EXCEPTION` · máquinas de estado (colunas de status, mapas de transição, valores usados no código) · validações (Zod + refine, react-hook-form, inputs) · fórmulas · parâmetros e prazos · mensagens de erro · testes como especificação · eventos de webhook · efeitos colaterais |
| `docs/contexto/regras/10-ACESSO-E-SEGURANCA.md`  | perfis, matriz tabela × operação → quem pode, onde o RLS é ignorado (service_role, SECURITY DEFINER), edge functions públicas, rotas protegidas, multi-tenancy, soft delete, PII, colunas de dinheiro                                                                                                                                                                             |
| `docs/contexto/regras/11-GLOSSARIO-E-LACUNAS.md` | glossário, seed, inconsistências código × schema (NÃO VERIFICADO) e lacunas que só o dono do negócio responde                                                                                                                                                                                                                                                                     |
| `docs/contexto/regras/manifest.json`             | `gerado_em` (ISO-8601 UTC; o job `gate` do `contexto.yml` calcula a idade com ele), `commit`, `entrada`, `arquivos` — lido pelo `indice.py`                                                                                                                                                                                                                                       |
| `docs/contexto/00-INDEX.md`                      | índice único das três fontes (banco real, código, regras), gerado por `indice.py`                                                                                                                                                                                                                                                                                                 |

O que **não** é daqui (cada fato tem um dono): schema real → snapshot do banco (`docs/contexto/supabase/`,
`scripts/supabase_snapshot/`); rotas/módulos/hooks/edges/grafo → `docs/contexto/codigo/` (`scripts/ai-context/gerar.mjs`). Tudo na branch `contexto`, job a job em `.github/workflows/contexto.yml`.

## Arquivos

- `generate.py` — gerador (stdlib; ~15 s neste repo). `--profile regras` escreve só 07/10/11; `--schema-snapshot` faz o 06 apontar para o snapshot em vez de reconstruir.
- `indice.py` — monta `00-INDEX.md` lendo o `manifest.json` de cada fonte (`--fonte "NOME=CAMINHO[@BRANCH]"`); fonte que vive em outra branch entra como "como ler" (git show / raw), sem inventar conteúdo.
- A publicação é do job `publicar` do `contexto.yml`, que monta a branch `contexto` e o índice. O `publish.sh`
  do pacote de origem (publicação standalone) **não** existe aqui: não era usado e o `GEN_CMD` default dele
  apontava para um caminho inexistente neste repo.
- Workflow: job `regras` (+ `publicar`, que monta o índice) em `.github/workflows/contexto.yml`.

O índice distingue `ok`, `parcial` (falha de coleta ou reaproveitamento), `não verificável` (manifest/relatório ilegível, sem `gerado_em` ou com data no futuro), `desatualizado` e fonte ausente (pasta vazia ou só com subpastas, como `regras/manual/`).
Código/regras com commit igual ao HEAD continuam atuais apesar da idade da coleta; banco real e fontes sem commit confirmado seguem o limite de idade configurado.

## Fontes SQL

Arquivos `.sql` em diretórios chamados exatamente `_foreign` ou `_superseded` são históricos:
continuam no inventário de arquivos, mas não entram na reconstrução do schema nem na extração
de regras do código. Outras pastas de migrations e fontes SQL, Prisma e tipos gerados mantêm
a seleção existente. A reconstrução é estática; só o snapshot descreve o banco em produção.

O replay aplica os arquivos em ordem de nome e a última definição vence (tabela, política, constraint
de mesmo nome, função, job de cron). Regras do replay:

- comentários e `;` são reconhecidos fora de literais, identificadores entre aspas e `$tag$...$tag$`;
- `ALTER TABLE` com várias ações, `ALTER POLICY`, `DROP TABLE` (leva políticas, triggers, índices e RLS),
  `DROP VIEW/TYPE/INDEX`, `cron.unschedule` e reagendamento de job;
- DDL estático dentro de `DO $$ ... $$` (direto ou em `EXECUTE 'literal fixo'`) conta, porque a guarda
  `IF NOT EXISTS`/`EXCEPTION` deixa passar num replay do zero; `EXECUTE format(...)` não é reconstruível e
  vira o aviso **NÃO VERIFICADO** da matriz em `10` (para `CREATE` e para `DROP POLICY`);
- `CREATE TABLE IF NOT EXISTS` de tabela já vista substitui a definição anterior: neste repo é a migration
  de reconciliação que bate com produção;
- `src/integrations/supabase/types.ts` completa tabelas, colunas, views, enums e funções que não estão nas
  migrations; tabela que só existe ali aparece com RLS `não verificado` (`?` na matriz).

## Regras humanas

`docs/contexto/regras/manual/*.md` (exceto README e TEMPLATE) entram na seção A do 07 com prioridade
máxima e nunca são sobrescritos. Comece copiando `TEMPLATE-regras-de-negocio.md` (criado na 1ª execução)
para `regras.md`. Editar `manual/` em main dispara o workflow.

## Rodar local

```bash
python3 scripts/regras_negocio/generate.py --repo . --out docs/contexto/regras --profile regras --schema-snapshot docs/contexto/supabase --no-pointer
python3 scripts/regras_negocio/indice.py --repo . --out docs/contexto/00-INDEX.md \
  --fonte "banco real=docs/contexto/supabase" --fonte "código=docs/contexto/codigo" --fonte "regras de negócio=docs/contexto/regras"
```

Ler o resultado: `git fetch origin contexto && git show origin/contexto:docs/contexto/00-INDEX.md`.

## Testes de regressão

```bash
python3 scripts/regras_negocio/test_generate.py -v
python3 scripts/regras_negocio/test_indice.py -v
```

As suítes usam fixtures locais em diretório temporário. `test_generate.py` cobre o tokenizador SQL, o
replay (políticas, `ALTER`/`DROP`, blocos `DO`, enums, cron), `types.ts`, máquinas de estado, matriz de
acesso e o CLI (manifest × arquivos emitidos, determinismo, idempotência, saída corrompida, argumentos
inválidos, snapshot ausente, acentos). `test_indice.py` cobre manifests ausentes/malformados, idade e
commit de cada fonte, `--head` vazio, reescrita só em mudança estrutural e argumentos inválidos.
Nenhum teste acessa banco, rede ou API de LLM.

Códigos de saída: `0` ok; `1` apenas em `generate.py --check` com saída desatualizada; `2` argumento
inválido (`--repo` inexistente, `--out` na raiz do repo ou apontando para arquivo, perfil desconhecido,
`--fonte` vazia/repetida/fora do repo) — nesse caso nada é escrito.

Origem e testes (430 cenários sintéticos + simulação git de 3 produtores na mesma branch): pacote
`ai-context-sync` no Project "SCRIPTS | AUTÔNOMOS | REPOSITÓRIO".

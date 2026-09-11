# Validação Graphify e catálogo canônico — 11/09/2026

## Resultado executivo

O Graphify passou de piloto estrutural para um conjunto controlado de onze perfis,
incluindo os seis domínios financeiros solicitados. A expansão continua sendo uma
ferramenta privada de desenvolvimento: não executa código analisado, SQL, Edge
Functions, LLM, watcher, hook global ou listener MCP.

Esta validação não atribui nota 10/10 ao produto financeiro. Ela comprova os gates
da integração Graphify descritos abaixo e mantém as lacunas de banco/produção
explicitamente abertas.

Na validação local final, 68 testes específicos do Graphify e 2.712 testes
Vitest do produto passaram. `type-check`, build de produção, `actionlint` e
lint também concluíram sem erros; o lint preserva 11 avisos preexistentes fora
do diff desta integração.

## Simulação preventiva aplicada

| Falha simulada | Controle | Resultado |
| --- | --- | --- |
| Outro agente altera o arquivo durante a análise | snapshot de bytes, hash e diretório por execução | aprovado em teste e em worktrees simultâneos |
| Import com alias, relativo, barrel, tipo ou lazy | resolvedor lexical com fixtures e caminho exato | aprovado; zero import local ausente no checkout |
| Dependência externa confundida com arquivo faltante | estado `EXTERNAL` separado de `MISSING` | aprovado |
| Relação fora do perfil omitida | bruto preservado e lacuna contada | 7.920 lacunas nos seis perfis, não convertidas em bug |
| Agrupamento elimina relações válidas | comparação bruto/final | 86 relações resolvidas removidas/colapsadas, preservadas no bruto |
| Rótulo hostil injeta script na visualização | XML escape e SVG agregado sem CDN/script | aprovado |
| Evidência de outro SHA é consumida | commit e hashes obrigatórios | rejeição exercitada |
| Processo recebe `SIGKILL` durante a cópia | manifesto gravado antes da cópia; nenhum grafo final promovido | estado real `iniciado`, sem grafo final |
| Consulta excede orçamento | limite rígido por número de nós | truncamento exercitado |
| Migration local diferente é chamada de perda | comparação nominal tratada como indeterminada | nenhuma migration aplicada automaticamente |
| Catálogo parcial vira “zero objetos” | categoria indisponível permanece indisponível | aprovado por documentação |

Em dois worktrees distintos, o grafo final do piloto teve o mesmo SHA-256. O
bruto diferiu apenas em três identificadores de destinos não resolvidos nos quais
o fornecedor incorpora o caminho absoluto do worktree; esses destinos são
removidos do grafo final e permanecem explicitamente classificados como lacuna.

## Perfis financeiros reais

| Perfil | Arquivos | Bytes | Nós | Relações finais | Referências fora do recorte | Removidas/colapsadas |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| contas a pagar | 17 | 140.763 | 84 | 87 | 408 | 0 |
| contas a receber | 32 | 242.022 | 143 | 176 | 631 | 2 |
| cobrança | 40 | 284.293 | 185 | 176 | 875 | 0 |
| conciliação | 35 | 289.112 | 133 | 138 | 743 | 2 |
| contabilidade | 98 | 713.804 | 441 | 686 | 1.689 | 8 |
| tributário | 265 | 1.596.520 | 1.433 | 2.241 | 3.574 | 74 |

Foram conferidas dez localizações de origem por perfil; as 60 apontavam para
arquivo e linha existentes. Essa amostra valida proveniência, não semântica da
regra de negócio. O perfil tributário produziu 134 comunidades; quantidade alta
indica fragmentação do recorte e não qualidade superior.

## Imports, chamadas e backend

- 1.646 fontes TypeScript/TSX analisadas sem execução;
- 10.392 imports literais: 7.390 locais resolvidos, 3.002 externos e zero local ausente;
- 2.366 referências de aplicação: relações, RPCs, Edge Functions, rotas, query keys e mutation keys;
- chamadas dinâmicas contadas separadamente: 216 relações, 8 RPCs, 13 Edge Functions,
  272 query keys e zero mutation key; arrays com primeiro elemento literal e
  elementos dependentes de execução agora são classificados como dinâmicos;
- 102 Edge Functions locais, todas com entrada HTTP detectada;
- 102 Edge Functions ativas no destino canônico, com igualdade exata de nomes;
- 67 funções locais têm sinal estático de guard, 83 usam service role e 98 têm
  import externo. Sinal de guard não prova proteção em todos os caminhos;
- no deploy, 56 funções têm `verify_jwt=true` e 46 `false`. As 46 exigem validar
  JWT em código, HMAC, token/segredo ou contrato público antes de aprovação.

## Migrations e dependências indiretas locais

O inventário de 595 arquivos encontrou 5.005 declarações históricas e, adicionalmente:

| Dependência lexical | Quantidade |
| --- | ---: |
| FK tabela → tabela | 547 |
| função → relação | 1.682 |
| trigger → função | 317 |
| policy → tabela | 963 |

O refinamento de CTEs eliminou 340 vínculos lexicais para aliases locais como
`q`, `ct`, `ins` e `base`; esses nomes não são mais apresentados como relações
físicas sem confirmação.

As relações função→tabela têm confiança `LEXICAL_LOW`; SQL dinâmico, overloads,
renomes e remoções exigem catálogo vivo. Quatro migrations continuam marcadas por
literal semelhante a credencial, sem replicar o valor em artefato ou documento.

## Catálogo canônico comprovado por leitura

Identidade confirmada pelo MCP oficial:
`https://bwwbeyolnnzppeuhgkcd.supabase.co`.

| Categoria acessível | Resultado |
| --- | ---: |
| tabelas públicas | 271 |
| colunas | 3.578 |
| colunas de chave primária | 295 |
| FKs | 415 |
| tabelas com RLS habilitado | 271/271 |
| migrations aplicadas | 356 |
| Edge Functions ativas | 102 |
| extensões instaladas | 8 |

Extensões instaladas: `pg_cron`, `pg_net`, `pg_stat_statements`, `pg_trgm`,
`pgcrypto`, `plpgsql`, `supabase_vault` e `uuid-ossp`.

Somente 33 identificadores de migration coincidem literalmente entre os 595
arquivos e as 356 entradas canônicas. Isso **não** comprova 562 perdas locais nem
323 migrations estranhas: o histórico foi rebaselined/renomeado em fases anteriores.
Comparação segura exige assinatura/efeito dos objetos e decisões de migração.

Das 215 relações literais únicas referenciadas pelo código, 202 coincidem com uma
tabela pública. As demais incluem views `vw_*`, schemas/recursos externos ou itens
indeterminados; como o MCP não liberou views neste escopo, não foram classificadas
como ausentes. Sessenta e nove tabelas públicas não têm referência literal direta;
isso não significa tabela morta, pois trigger, função, job, integração e SQL
dinâmico podem consumi-las.

### Cobertura ainda indisponível

O OAuth atual recusou `execute_sql` por escopo insuficiente, e o gateway legado
retornou Management API 403. Portanto ainda faltam contagens/assinaturas vivas de
constraints além de PK/FK, índices, policies, rotinas, triggers, views, enums,
privilégios e jobs. A origem Lovable também não está autenticada nesta sessão.
Nenhuma dessas categorias foi tratada como vazia e nenhuma alteração foi feita.

## Advisors canônicos

O linter canônico retornou sete avisos de segurança (1 erro, 5 warnings, 1 info) e
seis de desempenho (3 warnings, 3 infos). São backlog de investigação, não correção
automática: `security_definer_view`, `function_search_path_mutable`, materialized
view exposta na API, execução de funções security-definer, proteção de senha vazada,
FKs sem índice, initplan em RLS, índices sem uso/duplicados e policies permissivas.

Nenhuma policy, função, índice ou configuração Auth foi modificada, pois cada
remediação precisa de alvo, impacto, teste e autorização compatíveis com produção.

Referências oficiais de remediação: [RLS sem policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy),
[view security definer](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view),
[search path mutável](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable),
[materialized view na API](https://supabase.com/docs/guides/database/database-linter?lint=0016_materialized_view_in_api),
[função security-definer para anon](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable),
[função security-definer para authenticated](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),
[senhas vazadas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection),
[FK sem índice](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys),
[initplan em RLS](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan),
[índice não usado](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index),
[policies permissivas](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies) e
[índice duplicado](https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index).

## Dependências e cadeia de suprimento

- lock Linux x86_64/Python 3.11 com 30 dependências e hashes SHA-256;
- instalação limpa com `--require-hashes` validada;
- Graphify 0.9.48 confirmado no ambiente limpo;
- `pip-audit` 2.9.0: nenhuma vulnerabilidade conhecida em 11/09/2026;
- licenças declaradas via `License-Expression`, classifiers ou arquivos: Apache-2.0,
  BSD-3-Clause, MIT e o conjunto permissivo declarado pelo NumPy;
- Dependabot mensal limitado a duas PRs para o ecossistema Python do Graphify;
- upgrade exige regenerar lock, repetir auditoria e comparar grafos; rollback mantém
  o lock anterior via revert do PR.

## Benchmark de navegação

Seis casos versionados localizaram o arquivo-âncora em 6/6 consultas do grafo e
5/6 buscas textuais. Medianas locais variaram de 0,0142 a 0,2168 ms no índice em
memória e de 4,1042 a 4,7990 ms no `rg`. Não extrapolar ganho percentual: o grafo
já estava carregado e as ferramentas respondem perguntas diferentes.

## Pendências que não podem ser encerradas automaticamente

1. Reautenticar o MCP oficial com escopo de `execute_sql` somente leitura e repetir
   o catálogo vivo completo.
2. Autenticar a origem Lovable e comparar assinaturas/definições com o destino,
   classificando intenção, divergência ou indeterminação.
3. Revisar individualmente advisors e as 46 Edge Functions sem JWT no gateway.
4. Obter decisão explícita antes de ativar MCP local, retenção com exclusão, LLM,
   hook global, serviço externo ou qualquer alteração no banco.
5. A aceitação operacional final pertence ao mantenedor; CI verde não certifica
   regras financeiras nem tráfego real.

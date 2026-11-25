# API de dados abertos da RFB (calculadora RT)

Contrato da API pública da Calculadora de Reforma Tributária, verificado por
requisição real em **2026-11-24** e completado em **2026-11-26**. É a fonte dos
syncs de catálogo das etapas 79 e 80 e o contrato verificado das etapas 81 e 82.

Base: `https://piloto-cbs.tributos.gov.br/servico/calculadora-consumo/api/calculadora/dados-abertos`

Ambiente: **piloto / apr**, não é produção. Não há autenticação nem token.

## Endpoints verificados

| Rota | `data` obrigatório | Conteúdo |
| --- | --- | --- |
| `GET /versao` | não | `ambiente`, `dataVersaoDb`, `versaoDb`, `descricaoVersaoDb` |
| `GET /classificacoes-tributarias/cbs-ibs` | **sim** | 170 classificações CBS/IBS |
| `GET /situacoes-tributarias/cbs-ibs` | **sim** | 18 situações tributárias (CST) |

Sem `data`, a resposta é `400`. `data` no formato `AAAA-MM-DD` e define a
**vigência consultada**; não é paginação.

`/versao` respondeu `versaoDb = V0073`, a mesma versão das migrations do
repositório oficial `ReceitaFederal/calculadora-rtc-regime-regular`, o que
permite detectar divergência por número de versão antes de gravar.

## Contratos antes tidos como indisponíveis

Até 2026-11-24 este documento registrava NCM/NBS como "sem contrato conhecido,
barrado pelo WAF". Estava errado em dois pontos: o WAF é **limitador de taxa**
(volta depois de alguns minutos, ver seção seguinte) e o contrato é público no
repositório oficial `ReceitaFederal/calculadora-rtc-regime-regular`
(`DadosAbertosController.java` + DTOs `*DadosAbertosOutput.java`). O contrato
abaixo vem desse código-fonte, lido em 2026-11-26.

| Rota | Parâmetros | Corpo |
| --- | --- | --- |
| `GET /ncm/vigentes` | `data` | `[{ncm, descricao}]` — `ncm` de 8 dígitos |
| `GET /nbs/lista` | `data` | `[{codigo, descricao}]` |
| `GET /fundamentacoes-legais` | `data` | `[{codigoClassificacaoTributaria, descricaoClassificacaoTributaria, codigoSituacaoTributaria, descricaoSituacaoTributaria, conjuntoTributo, texto, textoCurto, referenciaNormativa}]` |
| `GET /aliquota-uniao` | `data` | `{aliquotaReferencia, aliquotaPropria, formaAplicacao}` |
| `GET /aliquota-uf` | `data`, `codigoUf` | idem — `codigoUf` é **código IBGE da UF** (ex.: 43) |
| `GET /aliquota-municipio` | `data`, `codigoMunicipio` | idem — **código IBGE do município** (7 dígitos) |
| `GET /versao` | — | `{versaoApp, descricaoVersaoApp, versaoDb, descricaoVersaoDb, dataVersaoDb, ambiente}` |

`/aliquota-uf` e `/aliquota-municipio` respondem `400` sem o código do ente — é
parâmetro obrigatório, não ausência de dado. Verificado ao vivo em 2026-11-26,
com `data=2026-06-01`: `/aliquota-uniao` respondeu `0.9` para a CBS, `/aliquota-uf`
`0.1` para `codigoUf=43` e `/aliquota-municipio` `0.0` para
`codigoMunicipio=4314902`, em **pontos percentuais** — o banco guarda fração
(`0.0090` / `0.0010` / `0.0000`), como nos `p_red_*`. Nenhuma das três rotas
publicou `aliquotaPropria` ou `formaAplicacao` em 2026, então guardar só
`aliquotaReferencia` não perde dado.

Para `data` a partir de 2027 as três rotas de alíquota respondem **404 com corpo
JSON** (`"Alíquota de referencia ou padrão não encontrada para o tributo…"`): é a
alíquota ainda não publicada, não falha nem valor zero. O consumidor trata 404
como ausência e grava o ente em `nao_publicadas`.

## WAF

O piloto bloqueia por IP e responde **HTTP 200 com HTML** `Request Rejected` e
um `support ID`, não 403. Ocorreu em 2026-11-24 depois de ~30 requisições
seguidas, inclusive na rota `/versao` que antes respondia; em 2026-11-25 voltou
a responder normalmente, o que confirma bloqueio temporário por taxa (não
bloqueio permanente). Consequências para os syncs:

- resposta não-JSON é erro explícito (`dados_abertos_nao_json`), nunca lista
  vazia — senão o piso de 100 classificações leria "catálogo vazio" e encerraria
  todas as vigências;
- nenhuma escrita acontece quando a resposta é rejeitada.

## Formato de `/classificacoes-tributarias/cbs-ibs`

Lista de objetos com as chaves:

```
codigo, descricao, descricaoTratamentoTributario, nomenclatura, tipoAliquota,
dataAtualizacao, possuiPercentualReducao,
percentualReducao{Cbs,IbsUf,IbsMun},
indicaApropriacaoCreditoAdquirente{Cbs,Ibs},
indicaCreditoPresumido{Adquirente,Fornecedor},
creditoOperacaoAntecedente, exigeGrupoDesoneracao,
incompativelComSuspensao, tiposDfeClassificacao
```

Semântica, verificada item a item:

- `percentualReducao*` vem em **pontos percentuais** (`60.0`, `100.0`), igual a
  `PERE_VALOR` na base oficial. O banco guarda fração (`0.6000`): a conversão é
  `/100` e está em `fracoesReducao()` (`montar.ts`).
- **Não há CST na classificação.** O CST só existe em
  `/situacoes-tributarias`, que traz `classificacoesTributarias[]` ligando cada
  situação aos seus códigos. O sync monta o CST por esse vínculo e descarta como
  ambíguo qualquer código reivindicado por duas situações.
- **Não há vigência na resposta.** A vigência vem do parâmetro `data`. O sync
  grava sempre `inicio_vigencia = 2026-01-01` (marco inicial do IBS/CBS), porque
  a API não informa quando um código passou a valer.
- `possuiPercentualReducao = true` em 62 itens e `exigeGrupoDesoneracao = true`
  em 31, no snapshot verificado.
- **`exige_gibscbs` não é publicado pela API.** Vem de `SITR_IND_GIBSCBS` na
  base oficial; por isso é semeado pela migration de carga e o sync não o toca.

## Escopo CBS/IBS x Imposto Seletivo

As rotas `cbs-ibs` **nunca** devolvem classificação do Imposto Seletivo:
verificado para 2026-11-24, 2027-01-01 e 2027-06-01, sempre as mesmas 170
classificações e 18 situações.

Isso importa porque as duas tabelas oficiais **colidem**: 14 códigos existem nos
dois catálogos (`000001`-`000006`, `200001`-`200008`), com CST, descrição e
redução diferentes. Uma carga que misture as tabelas produz duas linhas vigentes
para o mesmo `cclasstrib`, e o consumidor
(`src/lib/tributario/catalogos/cclasstrib.ts`) fica com a última — podendo
aplicar CST de IS em nota de CBS/IBS.

## Guardas do sync (etapa 79)

`supabase/functions/sync-catalogo-cclasstrib`:

1. `/versao` primeiro; se `versaoDb` for menor que a última aplicada, aborta
   (`versao_anterior`) em vez de sobrescrever com base antiga.
2. Piso de 100 classificações: resposta menor é falha da API, não catálogo
   reduzido (`resposta_insuficiente`).
3. Teto de 10% de ausentes antes de encerrar vigência
   (`ausentes_acima_do_limite`): só encerra `fim_vigencia` quando a lista veio
   completa o suficiente para a ausência significar remoção real.
4. Upsert por `(cclasstrib, inicio_vigencia)` — a PK composta criada em
   `20261122023500_corrige_pk_catalogo_cclasstrib_vigencia.sql`, que já previa
   este sync.
5. Grava só as 9 colunas publicadas pela API; `exige_gibscbs` e `ind_dir` nunca
   são sobrescritos.

## Guardas do sync (etapa 80)

`supabase/functions/sync-catalogo-ncm-nbs` espelha `catalogo_ncm` e
`catalogo_nbs` — tabelas criadas na etapa 16 e vazias desde então, o que deixava
o validador da etapa 46 (`validador-ncm-cst.ts`) sem referência para comparar o
NCM do item.

1. Piso de **1.000 NCM** e **200 NBS** (a lista oficial tem ~10 mil e ~2 mil):
   resposta menor é falha da API, não catálogo reduzido.
2. Teto de **10% de ausentes** antes de encerrar vigência, aplicado por catálogo.
3. `inicio_vigencia = 2026-01-01`: a API publica o conjunto vigente na data e não
   desde quando cada código vale. Uma linha por ano faria `vigenteEm()` casar
   duas linhas do mesmo código.
4. Código publicado **sem descrição** conta como presente (não pode ser
   encerrado) mas não vira linha — `descricao` é `not null` e descrição inventada
   apareceria para o usuário.
5. A leitura dos códigos já abertos é **paginada** (1.000 por página): o
   PostgREST corta a resposta no `max-rows`, e sem paginação a decisão de
   encerrar seria tomada sobre 1.000 dos ~10 mil NCMs.
6. Sem guarda de versão, ao contrário da etapa 79: as duas tabelas não guardam
   `versao_it` e as listas não trazem percentual, então base anterior significa
   apenas menos códigos — o que os pisos e o teto já cobrem. `versaoDb` continua
   indo para log e resumo.

## Guardas do sync (etapa 81)

`supabase/functions/sync-aliquota-referencia` espelha `catalogo_aliquota_referencia`
— tabela criada na etapa 38 e vazia desde então, de modo que a alíquota de
referência de cada ano da transição não existia em lugar nenhum do sistema.

1. Uma linha por ente e ano: `cbs` (nacional), `ibs_uf` (por UF) e `ibs_mun` (por
   município). O ano vem de `data`, então `?data=2027-06-01` grava a vigência de
   2027 sem tocar em 2026.
2. Gravação por `id`, não por `on_conflict`: a unicidade da tabela são **três
   índices únicos parciais** (`cbs_uk`, `ibs_uf_uk`, `ibs_mun_uk`, migration
   `20261122023600`), que o PostgREST não consegue inferir em `on_conflict`. A
   função lê os ids existentes e faz `upsert` sobre a chave primária.
3. **404 = não publicada**, não falha: o ente entra em `nao_publicadas` do resumo e
   a rodada continua. `aliquotaReferencia` ausente ou fora de `[0, 10)` em pontos
   percentuais também gera ausência, nunca zero — zero é valor válido publicado
   (o IBS municipal de 2026 é 0,0%) e não pode ser confundido com falta de dado.
4. Incremental por causa do limitador de taxa: o que falta para o ano é consultado
   primeiro, o que já existe só completa a rodada depois, e há teto de requisições
   por execução (`MAX_UFS` 27, `MAX_MUNICIPIOS` 40). A função é idempotente, então
   a tabela converge em poucas rodadas.
5. Resposta **não-JSON** (o `200` com HTML `Request Rejected` do limitador)
   interrompe a rodada: o que já foi gravado fica, e a próxima execução retoma.
   Não confundir com o 404, que é JSON legítimo.
6. Universo de municípios = `aliquotas_iss_municipal` (o que o sistema realmente
   usa, `src/lib/tributario/ipi-iss/overlay-iss.ts`) mais os municípios que já
   estão no catálogo — consultar os 5.570 municípios seria inútil e impossível sob
   o limitador. Sigla da UF vem de `/ufs` a cada execução (a tabela guarda sigla,
   como `uf_brasil`), com aborto se a rota devolver menos de 27 UFs.
7. Pausa de 1,2 s entre requisições, todas sequenciais.

## Vigência e o consumidor (etapa 46)

`buscarReferenciasFiscais` (`src/lib/tributario/catalogos/cclasstrib.ts`)
devolve `cclasstribCarregado` / `ncmCarregado` com o significado **"há
referência para esta data"**, não "a tabela tem linhas". A diferença importa
porque todas as cargas gravam `inicio_vigencia = 2026-01-01`: uma nota de 2025
consulta um catálogo cheio, mas sem nenhuma linha vigente na data, e a comparação
com o mapa vazio acusava REG-011/REG-012/REG-013 em nota correta. Hoje a
cobertura é sondada com recorte de vigência e, sem cobertura, o validador fica em
silêncio — o mesmo comportamento de catálogo vazio.

## Chamada

```
GET /functions/v1/sync-catalogo-cclasstrib               # data = hoje (Brasília)
GET /functions/v1/sync-catalogo-cclasstrib?data=2026-12-01
GET /functions/v1/sync-catalogo-cclasstrib?forcar=true   # ignora a guarda de versão

GET /functions/v1/sync-catalogo-ncm-nbs                  # data = hoje (Brasília)
GET /functions/v1/sync-catalogo-ncm-nbs?data=2026-12-01

GET /functions/v1/sync-aliquota-referencia?escopo=uf        # CBS + 27 UFs
GET /functions/v1/sync-aliquota-referencia?escopo=municipio # municípios do ISS
GET /functions/v1/sync-aliquota-referencia?escopo=todos&data=2027-06-01
GET /functions/v1/sync-aliquota-referencia?escopo=uf&limite=5
```

Autenticação: `x-cron-secret` (`exigirChamadaInterna`, segredo `internal_jobs`).
Agendamento: pg_cron `40 4 * * *` para o cClassTrib
(`20261124121000_cron_sync_catalogo_cclasstrib.sql`), `0 5 * * *` para NCM/NBS
(`20261126060000_cron_sync_catalogo_ncm_nbs.sql`), `20 5 * * *` para as alíquotas
de UF/CBS (`20261126080000_cron_sync_aliquota_referencia.sql`) e `50 5 * * 0`
(domingo) para as municipais. O intervalo de 20 minutos entre os jobs não é
decorativo: os quatro consultam a mesma base oficial e disputam o mesmo limite de
taxa por IP.

Os jobs só passam a valer depois de deploy da function
(`functions-deploy.yml`, `deploy_all = true`) e aplicação da migration em
produção (regra 8: `prod-migrate`, disparo manual).
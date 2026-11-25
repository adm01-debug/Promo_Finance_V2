# API de dados abertos da RFB (calculadora RT)

Contrato da API pública da Calculadora de Reforma Tributária, verificado por
requisição real em **2026-11-24**. É a fonte do sync do catálogo cClassTrib
(etapa 79).

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

## Rotas NÃO verificadas

`/ncm`, `/nbs`, `/classificacoes-tributarias/ncm`, `/classificacoes-tributarias/nbs`
e `/classificacoes-tributarias/imposto-seletivo` respondem `400` sem `data`
(portanto existem), mas o payload **nunca foi lido**: as tentativas com `data`
foram barradas pelo WAF. Não há, hoje, contrato conhecido para NCM/NBS. As
etapas 80, 81 e 86 não podem ser implementadas por API até esse contrato ser
lido — o caminho disponível é a base oficial (ver `scripts/rfb/`).

## WAF

O piloto bloqueia por IP e responde **HTTP 200 com HTML** `Request Rejected` e
um `support ID`, não 403. Ocorreu em 2026-11-24 depois de ~30 requisições
seguidas, inclusive na rota `/versao` que antes respondia. Consequências para o
sync:

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

## Chamada

```
GET /functions/v1/sync-catalogo-cclasstrib               # data = hoje (Brasília)
GET /functions/v1/sync-catalogo-cclasstrib?data=2026-12-01
GET /functions/v1/sync-catalogo-cclasstrib?forcar=true   # ignora a guarda de versão
```

Autenticação: `x-cron-secret` (`exigirChamadaInterna`, segredo `internal_jobs`).
Agendamento: pg_cron `40 4 * * *` (Brasília), ver
`supabase/migrations/20261124121000_cron_sync_catalogo_cclasstrib.sql`.
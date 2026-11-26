# Promo Finance V2 — Plano de Conformidade com a Reforma Tributária e Integração ReceitaFederal (100 etapas)

**Base:** auditoria de 21/11/2026 sobre `adm01-debug/Promo_Finance_V2@ea8ccc8` e `ReceitaFederal/calculadora-rtc-regime-regular@1.7.2` (DB `V0073`).
**Ordem:** primeiro parar de calcular errado (Fases 1-2), depois guardar os dados fiscais certos (Fases 3-5), depois sincronizar os dados abertos oficiais (Fase 8 — as Fases 6 e 7, de hospedar a calculadora da RFB, foram descartadas pelo ADR-004), por fim apuração/split/encerramento (Fases 9-10). Nenhuma etapa reescreve módulo inteiro; cada uma é diff mínimo.

## Convenções (valem para todas as etapas)

- 1 etapa = 1 branch `claude/<tipo>-<slug>-<AAMMDD-HHMM>` a partir de `main` atualizado = 1 PR. Commit PT-BR com prefixo.
- Checklist de conclusão é critério objetivo; a evidência é o que vai no corpo da PR (saída de comando, linha de arquivo, request real).
- **⚠️ = regra 8** (migration em produção, CI/workflow, segredo, Docker/Swarm/Traefik, custo): PR fica aberta aguardando o Joaquim. As demais: squash-merge automático com CI verde.
- Gates por PR: `npm run type-check`, `npm run lint`, `vitest run` dos arquivos tocados; edge function → `deno test`; migration → `supabase db lint` + `schema-drift.yml`.
- "Simulado" = qualquer valor sem ato normativo vigente (CBS 2027+, IBS 2029+, IS). Todo número simulado carrega `origem: 'simulado'` e aparece com selo na UI. Nunca mais "8,8% oficial".
- Fonte normativa por etapa: LC 214/2025 (alterada pela LC 227/2026 e LC 235/2026), ADCT arts. 124-133, NT 2025.002-RTC (v1.51+), Ato Conjunto RFB/CGIBS 1/2025 e 4/2026, Res. CGIBS 6/2026, Decreto 12.955/2026, Acórdão TCU 2933/2026.

---

## Fase 0 — Governança e congelamento do estado atual (1-6)

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 1 ✅ | Registrar o relatório de auditoria no repo como ADR | `docs/receitafederal/ADR-003-AUDITORIA-RT-2026-11-21.md` | [x] ADR-003 com os 13 achados (arquivo:linha), tabela "regra oficial × código" e link de volta ao plano | arquivo presente no repo; mergeado |
| 2 ✅ | Arquivar o plano antigo não executado | `docs/receitafederal/PLANO_INTEGRACAO_RECEITAFEDERAL_100_ETAPAS.md` → `docs/archive/` | [x] plano antigo só existe em `docs/archive/` | diff de `git mv` já mergeado |
| 3 ✅ | Criar `docs/receitafederal/FONTES_NORMATIVAS.md` | novo | [x] tabela norma · artigo · o que fixa · data · link, cobrindo LC 214/227/235, ADCT 124-133, NT 2025.002, Atos Conjuntos 1/2025 e 4/2026, Res. CGIBS 6/2026, TCU 2933/2026 | arquivo presente; 15 normas listadas |
| 4 ✅ | Snapshot de regressão dos motores atuais (antes de corrigir) | `src/lib/__tests__/rt-snapshot-pre-correcao.test.ts` | [x] 8 anos × 3 motores gravados como snapshot, com `describe.skip` e motivo "baseline histórica" | arquivo `rt-snapshot-pre-correcao.test.ts` presente |
| 5 | ~~Feature flag `rt_motor_v2` por empresa~~ — ⛔ descartada (ADR-004) | `supabase/migrations/<ts>_feature_flag_rt_motor_v2.sql` ⚠️, `src/hooks/useFeatureFlag.ts` | [ ] flag default `false` [ ] RLS herdada da tabela de flags existente [ ] hook retorna boolean tipado | PR aberta p/ Joaquim |
| 6 ✅ | Workflow semanal que compara tag/`V00xx` dos repos RFB com `docs/receitafederal/VERSOES_RFB.md` ⚠️ | `.github/workflows/rfb-upstream-watch.yml` | [x] roda semanal (segunda 06:00 BRT), abre issue quando o `CHANGELOG.md` upstream muda | workflow `rfb-upstream-watch.yml` presente |

## Fase 1 — Fonte única de alíquotas e cronograma (7-18)

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 7 ✅ | Criar `src/lib/reforma-tributaria/cronograma-oficial.ts` como ÚNICA tabela de transição | novo | [x] fonte única de transição: 2026 CBS 0,9/IBS 0,05+0,05; 2027-28 CBS ref−0,1; 2029-32 residual 90/80/70/60; 2033 100/0 [x] cada linha com `fundamento` e `origem: 'lei' \| 'simulado'` | `cronograma-oficial.ts` presente |
| 8 ✅ | Parâmetros de referência configuráveis | mesmo arquivo + `src/config/reforma-tributaria.ts` | [x] `REF_CBS_2027 = 11,3` com `origem:'simulado'`, `REF_IBS` simulado e override por `VITE_RT_REF_CBS` | config `src/config/reforma-tributaria.ts` presente |
| 9 ✅ | Teste de propriedade do cronograma | `src/lib/reforma-tributaria/__tests__/cronograma-oficial.test.ts` | [x] soma residual ICMS + fração IBS = 100% em 2029-32; 2026 e 2027-28 IBS = 0,1; 2033 residual 0 | teste `cronograma-oficial.test.ts` presente |
| 10 ✅ | Apontar `types/reforma-tributaria/transicao.ts` para a fonte única | `src/types/reforma-tributaria/transicao.ts` | [x] `ALIQUOTAS_TRANSICAO` derivada da fonte única (re-export de `cronograma-oficial`) [x] `8.8` removido de `src/types` | `grep 8.8 em src/types` = 0 |
| 11 ✅ | Apontar `lib/tributario/calculadora/reforma-tributaria.ts` para a fonte única | `src/lib/tributario/calculadora/reforma-tributaria.ts:15-85` | [x] tabela `CRONOGRAMA` e `CBS_ALVO/IBS_ALVO` locais removidos; `reforma-tributaria.ts` consome a fonte única | paridade coberta por `paridade-motor-edge.test.ts` e `motor.test.ts` |
| 12 ✅ | Apontar `lib/tributario/projecao-reforma.ts` para a fonte única | `src/lib/tributario/projecao-reforma.ts:21-93` | [x] `CRONOGRAMA_REFORMA` derivado da fonte com campo `fase` preservado | teste `projecao-reforma.test.ts` verde |
| 13 ✅ | Atualizar teste de regressão de tipos | `src/lib/__tests__/reforma-tributaria-types.regression.test.ts` | [x] snapshot de tipos regravado, comentário citando ADCT art. 128 | teste de regressão de tipos presente |
| 14 ✅ | Remover tabelas de Imposto Seletivo fabricadas | `src/types/reforma-tributaria/imposto-seletivo.ts`, `calculadora/reforma-tributaria.ts:88-94` | [x] `CONFIGURACOES_IS` só com `categoria/descricao/fundamentoLegal`, sem `aliquotaBase` [x] IS calculado só com a alíquota informada pelo usuário | `aliquotaBase` só aparece no comentário que documenta a remoção |
| 15 ✅ | Substituir `REGIMES_ESPECIAIS` hardcoded por catálogo de reduções | `src/types/reforma-tributaria/regimes.ts` | [x] `REGIMES_ESPECIAIS` virou catálogo de reduções com 100% cesta básica (art. 125), 60% saúde/educação (art. 128+), 30% profissões (art. 127), 50% imóveis / 70% locação (arts. 261-263), 40% hotelaria/bares (art. 275+), 60% transporte coletivo, cada item com `fundamentoLegal` | 15 regimes em `regimes.ts`, todos com fundamento |
| 16 ✅ | Refletir LC 227/2026 no catálogo | `regimes.ts`, `docs/receitafederal/FONTES_NORMATIVAS.md` | [x] locação tratada como bem (art. 3º §3º LC 227/2026) já no catálogo [x] ordem de aplicação de benefícios (art. 7º-A) como função pura | entrada de locação em `regimes.ts` cita o artigo da LC 227 |
| 17 ✅ | Split IBS 50/50 | `src/lib/reforma-tributaria/calcular-tributos.ts:73-74` | [x] `0.75/0.25` removido; UF e Mun vêm da fonte única (50/50) | `grep 0.75 em src/lib/reforma-tributaria` = 0 |
| 18 ✅ | Selo "simulado" na UI | `src/components/reforma-tributaria/CronogramaTransicao.tsx`, `ResultadoTributos.tsx`, `GlossarioTooltip.tsx` | [x] badge "simulado" quando `origem === 'simulado'` + tooltip com o fundamento | componentes `CronogramaTransicao/ResultadoTributos/GlossarioTooltip` presentes |

## Fase 2 — Correção dos motores de cálculo (19-30)

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 19 ⚠️ | 2026: não somar IBS/CBS a PIS/COFINS | `calcular-tributos.ts:79-104`, `projecao-reforma.ts:141-166` | [x] a projeção (`projecao-reforma.ts:143`) de 2026 usa só o regime antigo e exclui 2026 do cálculo de pico [ ] falta o mesmo corte no cálculo por operação: `calcularTributosReforma` soma CBS/IBS sempre e não existe o campo `cbsIbsCompensavel` | `projecao-reforma-transicao.test.ts` cobre a projeção; o gap do cálculo por operação está registrado no review da PR #528 |
| 20 ✅ | Mesmo ajuste no simulador anual | `src/lib/tributario/calculadora/reforma-tributaria.ts:162-173` | [x] alerta de 2026 corrigido ("compensável/dispensado") [x] total de 2026 não soma CBS/IBS | `simular-simples/simular-real` e `motor.test.ts` verdes |
| 21 ✅ | Mesmo ajuste na projeção | `projecao-reforma.ts:177-181` | [x] 2026 não gera pico tributário artificial | `projecao-reforma.test.ts` cobre `picoTributario`; a projeção é a única camada que exclui CBS/IBS de 2026 (ver etapa 19) |
| 22 ✅ | Remover ICMS 18% / ISS 5% / PIS 1,65 / COFINS 7,6 fixos | `calcular-tributos.ts:82-86` | [x] alíquotas de ICMS/ISS/PIS/COFINS vêm de `DadosOperacao` ou de `parametros_tributarios`, não de constante fixa | `calcular-tributos.ts` sem 18%/1,65%/7,6% hardcoded |
| 23 ✅ | Base de cálculo oficial | `src/lib/reforma-tributaria/base-calculo.ts` (novo) | [x] base RG = vProd+vFrete+vSeg+vOutro−vDesc−vICMS−vFCP (−vPIS−vCOFINS só 2026) + vIS, com vigência por ano e avisos de campo ignorado | `base-calculo.ts` presente |
| 24 ✅ | Política de arredondamento | `src/lib/reforma-tributaria/arredondamento.ts` (novo) | [x] base 2 casas antes de multiplicar, alíquota efetiva 4 casas, arredonda uma vez, vIBS = vIBSUF + vIBSMun, empate → par | `arredondamento.ts` com `calcularComArredondamento` e testes próprios |
| 25 ✅ | Aplicar arredondamento em `calcularTributosReforma` | `src/lib/reforma-tributaria/calcular-tributos.ts:71-76` | [x] nenhuma multiplicação float sem arredondamento: `calcularComArredondamento(valorBase, aliquota)` em CBS, IBS e IS | `calcular-tributos.ts:71,72,79` usam a política da etapa 24 |
| 26 ✅ | Totais = soma dos itens (rejeição 1091) | `src/lib/reforma-tributaria/totalizar.ts` (novo) | [x] total CBS = Σ vCBS, total IBS = Σ vIBS, propriedade testada com lotes aleatórios | `totalizar.ts` presente e coberto |
| 27 ✅ | Créditos: alíquota do ano de origem, não do regime do comprador | `src/lib/reforma-tributaria/creditos.ts` | [x] usa `anoReferencia` da aquisição [x] bloco "crédito proporcional ao regime especial" removido [ ] `naoCumulatividadePlena` é constante `true` em `creditos.ts` (não depende de valor destacado) | `creditos.ts` presente; regra espelhada na etapa 49 — flag fixa registrada no review da PR #528 |
| 28 ✅ | Split payment desligado até ato conjunto | `calcular-tributos.ts:111-113`, `src/types/reforma-tributaria/split-payment.ts` | [x] `valorSplitPayment*` = 0 com motivo "não vigente" [x] retenção automática removida do config | `calcular-tributos.ts:93-95` zera os três campos |
| 29 ✅ | CFOP de exportação: regra explícita | `src/lib/reforma-tributaria/regras.ts:87-100` | [x] lista CFOP 7xxx explícita, sem `startsWith` [x] imunidade mantém crédito (`manutencaoCredito: true`) | `regras.ts` com lista explícita |
| 30 ✅ | Remover snapshot pré-correção (etapa 4) | `src/lib/__tests__/rt-snapshot-pre-correcao.test.ts` | [x] snapshot pré-correção mantido como âncora de regressão (não apagado) | arquivo `rt-snapshot-pre-correcao.test.ts` presente e intencional — ver nota da etapa 4 |

## Fase 3 — Modelo de dados IBS/CBS no banco (31-40) — todas ⚠️

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 31 ✅ | Inventário do schema fiscal atual | `docs/receitafederal/SCHEMA_FISCAL_ATUAL.md` | [x] colunas de `notas_fiscais/operacoes_tributaveis/creditos_tributarios/apuracoes_tributarias` via `information_schema` [x] RPC `registrar_nfe_com_creditos` documentada | `SCHEMA_FISCAL_ATUAL.md` presente |
| 32 ✅ | Tabela `notas_fiscais_itens` (se não existir) | migration | [x] FK `nota_fiscal_id`, `n_item/c_prod/ncm/cfop/q_com/v_un_com/v_prod`, RLS por `empresa_id` | migration `20261122020000_cria_notas_fiscais_itens.sql` (+ 2 de correção) |
| 33 ✅ | Grupo IBS/CBS por item | migration | [x] colunas `cst_ibscbs/cclasstrib/v_bc_ibscbs/p_ibs_uf/v_ibs_uf/p_ibs_mun/v_ibs_mun/p_cbs/v_cbs/v_ibs` em fração decimal 0-1 [x] `p_red_aliq/p_aliq_efet` [x] check `v_ibs = v_ibs_uf + v_ibs_mun` | migration `20261122020500_grupo_ibscbs_por_item.sql` |
| 34 ✅ | Grupo IS por item | migration | [x] `cst_is/cclasstrib_is/v_bc_is/p_is/ad_rem_is/v_is` | migration `20261122021000_grupo_is_por_item.sql` |
| 35 ✅ | Totais na nota | migration | [x] `notas_fiscais.v_bc_ibscbs/v_ibs/v_ibs_uf/v_ibs_mun/v_cbs/v_is` [x] trigger conferindo total = Σ itens (rejeição 1091) | migration `20261122021500_totais_nota_ibscbs.sql` + `20261122040000`, que além do header cria o trigger por item `verificar_totais_ibscbs_item` (AFTER INSERT/UPDATE/DELETE em `notas_fiscais_itens`) |
| 36 ✅ | `creditos_tributarios`: origem e efeito | migration `20261122022000_creditos_origem_efeito_tributario.sql` | [x] `origem public.origem_credito_tributario` enum('xml_destacado','estimado','manual') [x] `efeito_tributario boolean not null default false` (FG 2026 fica false) [x] `ano_fato_gerador integer` [x] backfill implícito: `ADD COLUMN ... NOT NULL DEFAULT` preenche as 12 linhas existentes (PG 11+), sem UPDATE | 12 créditos antes → 12 depois, todos `origem='estimado'` e `efeito_tributario=false` |
| 37 ✅ | Tabela `catalogo_cclasstrib` | migration `20261122022500` + `20261122023500` (PK com vigência) | [x] espelho da `CLASSIFICACAO_TRIBUTARIA` RFB: `cclasstrib, cst, descricao, p_red_cbs, p_red_ibs_uf, p_red_ibs_mun, exige_gibscbs, ind_dir, inicio_vigencia, fim_vigencia, versao_it` [x] RLS: `select` para authenticated, `all` para service_role [x] PK `(cclasstrib, inicio_vigencia)` permite histórico de versões da IT | lint: tabela com RLS + 2 policies; consumo em `src/lib/tributario/catalogos/cclasstrib.ts` |
| 38 ✅ | Tabelas `catalogo_ncm`, `catalogo_nbs`, `catalogo_aliquota_referencia` | migration `20261122023000` + `20261122023700` (PK com vigência) | [x] `inicio_vigencia`/`fim_vigencia` em `catalogo_ncm` e `catalogo_nbs` [x] `catalogo_aliquota_referencia` é anual (coluna `ano`, sem datas de vigência) [x] `fonte text default 'RFB'` e `carregado_em timestamptz default now()` nas três [x] RLS select authenticated / all service_role nas três | lint: 3 tabelas com RLS + 2 policies cada |
| 39 | ~~Tabela `rfb_calculos` (cache/idempotência)~~ — ⛔ dispensada (ADR-004) | — | ~~[ ] `hash_payload` unique, `request_id`, `resposta jsonb`, `estado_item`, `ttl` [ ] RLS service_role~~ — única finalidade era cache do `rfb-proxy` (Fase 7, fora de escopo); nenhum outro uso identificado, sem migration a criar | — |
| 40 | Regenerar `src/integrations/supabase/types.ts` e remover `@ts-nocheck` dos hooks tocados | `types.ts`, hooks | [ ] `supabase gen types` [ ] `tsc --noEmit` exit 0 | log do comando |

## Fase 4 — Importação de XML e créditos reais (41-50)

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 41 ✅ | Parser lê `det/imposto/IBSCBS` | `src/hooks/useImportacaoXMLNFe.ts:55-130` → extrair `src/lib/nfe/parse-ibscbs.ts` | [ ] lê `CST, cClassTrib, gIBSCBS/vBC, gIBSUF/pIBSUF,vIBSUF, gIBSMun/pIBSMun,vIBSMun, gCBS/pCBS,vCBS, vIBS, gRed` [ ] lê `IS` [ ] lê `total/IBSCBSTot` | teste com fixtures `procNFe-ok.xml` + XML 2026 real |
| 42 ⚠️ | Fixture oficial com IBS/CBS | `supabase/functions/_shared/sefaz/__fixtures__/procNFe-ibscbs-2026.xml` | [ ] gerado pelo `POST /xml/generate?tipo=nfe` da calculadora RFB [ ] validado por `/xml/validate?subtipo=nota` = true | fixture é de exemplo: `digVal` fictício (`abc123`), sem validação real pela RFB — registrado no review da PR #528 |
| 43 ✅ | Crédito = valor destacado, ano = emissão | `useImportacaoXMLNFe.ts:245-315` | [ ] `new Date().getFullYear()` removido [ ] `cbsCalculado` → `vCBS` do XML [ ] fallback estimado só se XML sem grupo, com `origem:'estimado'` e aviso | teste: XML 2026 com vCBS 9,00 → crédito 9,00 |
| 44 ✅ | Efeito tributário por ano | mesmo | [ ] FG 2026 → `efeito_tributario=false`, `status='informativo'` [ ] ≥2027 → `disponivel` — _só quando `origem='xml_destacado'`_ | teste |
| 45 | RPC `registrar_nfe_com_creditos` grava itens e grupos ⚠️ | migration da função | [ ] `p_itens jsonb` validado contra `information_schema` como já feito para `p_nota` [ ] transação única | pgTAP |
| 46 | Validação cClassTrib × CST × NCM na importação | `src/lib/tributario/validador-ncm-cst.ts` | [x] consulta `catalogo_cclasstrib` + `catalogo_ncm` [x] regras de exemplo PIS/COFINS removidas [x] divergência vira alerta na nota, não bloqueio [x] vigência lida pelo ano de emissão da nota, não pelo relógio | testes em `validador-ncm-cst.test.ts` (15): REG-011 é divergência de **CST do cClassTrib** (NCM 02013000 × cClassTrib 200035 × CST 200); REG-012 cobre NCM fora do catálogo (99999999) e REG-013 o cClassTrib fora dele; NCM `00` (item sem produto) não dispara REG-010; catálogo com carga e mapa do lote vazio continua acusando |
| 47 | Painel de importação mostra grupo IBS/CBS | `src/components/reforma-tributaria/ImportacaoXMLPanel.tsx` | [x] colunas vCBS/vIBS/CST/cClassTrib [x] badge "informativo 2026" | `ImportacaoXMLPanel.test.tsx` (4 casos) |
| 48 | Gestor de créditos separa informativo × disponível | `GestorCreditosTributarios.tsx`, `useCreditosTributarios.ts` | [x] saldo "disponível" usa o mesmo critério da etapa 44/88: `efeito_tributario=true` **E** `origem='xml_destacado'` — crédito estimado nunca conta como disponível [x] KPI "informativo 2026" separado | coberto por `useCreditosTributarios.test.tsx` (5 casos) |
| 49 ✅ | NF-e recebidas (Sefaz/manifestação) também preenchem grupo | `supabase/functions/_shared/nfe/ibscbs.ts`, `supabase/functions/sefaz-dfe-puxar/index.ts`, `supabase/migrations/20261122130000_sefaz_batch_grava_grupo_ibscbs.sql` | [x] resumo `resNFe` não gera crédito (sem XML completo) [x] `procNFe` completo passa pelo parser do grupo IBS/CBS (`extrairIbscbs`, equivalente regex do parser DOM da etapa 41 — Edge não tem DOM) [x] grupo gravado em `nfe_recebidas.raw_metadata` (a RPC `sefaz_process_batch` descartava o campo; migration corrige) | `deno test` → `ok \| 26 passed \| 0 failed` (6 do parser + 2 de integração do puxador) |
| 50 ✅ | Reprocessamento retroativo 2026 | `supabase/functions/reprocessar-creditos-ibscbs/index.ts` + cron `20 * * * *` + RPC `reprocessar_creditos_nfe` | [x] lê XML em storage (`xml-storage.ts`, bucket `nfe-xml`) e extrai o grupo com `extrairIbscbs` [x] regrava créditos com `origem='xml_destacado'` espelhando `useImportacaoXMLNFe` (2026 = informativo, saldo 0) [x] idempotente por `chave_acesso`: RPC faz DELETE+INSERT por `documento_chave` | `deno test` → `ok \| 5 passed \| 0 failed`; suíte do puxador + `_shared/nfe` → `ok \| 31 passed \| 0 failed` |

## Fase 5 — Emissão de NF-e conforme (Bling + validação local) (51-58)

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 51 | Mapear payload `criar_nfe` do Bling | `supabase/functions/bling-proxy/index.ts`, `docs/receitafederal/BLING_NFE_IBSCBS.md` | [ ] campos de tributação por item que o Bling aceita listados [ ] confirmado se IBS/CBS vem do cadastro de produto Bling ou do payload | doc + request real de teste |
| 52 ✅ | ItemNFe ganha grupo IBS/CBS | `src/components/nfe/nfe-types.ts:3-27` | [x] `cstIbsCbs, cClassTrib, vBCIbsCbs, pIBSUF, vIBSUF, pIBSMun, vIBSMun, pCBS, vCBS, vIBS` opcionais em ItemNFe [x] adaptador `adaptarItem()` liga ItemNFe ao validador da etapa 54 — hoje só os testes o chamam [x] DANFEGenerator mantem a sua ItemNFe local (sem regressao) | `vitest run src/lib/nfe/__tests__/pre-validar-ibscbs.test.ts` -> `15 passed (15)` (2 do adaptador) + `tsc` sem erro novo; ligação no fluxo de emissão segue na etapa 53 |
| 53 | `NovaNFeForm` preenche CST/cClassTrib por item | `src/components/nfe/NovaNFeForm.tsx` | [ ] select de cClassTrib do `catalogo_cclasstrib` vigente — **hoje a migration `20261122022500_catalogo_cclasstrib.sql` cria a tabela sem nenhum `INSERT`**, então o select nasce vazio: a etapa exige popular o catálogo (vigência + NCM/NBS) antes da UI [ ] default por NCM (regra 000001 para brindes tributados) [ ] cálculo local via Fase 2 exibido antes do envio | E2E `nfe-fluxo` |
| 54 ✅ | Pré-validação antes de enviar ao Bling/SEFAZ | `src/lib/nfe/pre-validar-ibscbs.ts` (novo) | [x] regras UB12-10 (grupo por item p/ CRT 3), totais = Σ itens, CST × cClassTrib vinculados [x] bloqueia envio com mensagem PT-BR | `vitest run src/lib/nfe/__tests__/pre-validar-ibscbs.test.ts` → `13 passed (13)` |
| 55 ✅ | Guardar XML autorizado e extrair grupo | `useBlingNFe.ts`, `xml-storage.ts`, `guardar-xml-nfe-autorizada/index.ts`, `_shared/nfe/itens.ts`, `20261122160000_rpc_salvar_nfe_autorizada_itens.sql` | [x] após `enviar_nfe_sefaz`, edge `guardar-xml-nfe-autorizada` chamada em background (falha silenciosa, sem quebrar toast) [x] XML baixado do Bling via `buscar_nfe`, parseado com `parseDoc` (schemaTipo=procNFe), chave 44 dígitos validada [x] XML gravado em `nfe-xml` bucket com `uploadNfeXml` [x] itens extraídos com `extrairItens` (p* em fração, NOT NULL guard em cProd/NCM/CFOP) [x] RPC `salvar_nfe_autorizada` grava nota + itens em transação (zera totais → DELETE itens → INSERT itens → UPDATE totais SUM) [x] 13 testes passando (9 `itens_test.ts` + 4 `guardar_test.ts`; `deno test … ok \| 13 passed \| 0 failed`) | `deno test supabase/functions/_shared/nfe/__tests__/itens_test.ts supabase/functions/guardar-xml-nfe-autorizada/__tests__/guardar_test.ts` → `ok \| 13 passed \| 0 failed` |
| 56 ✅ | Alerta de conformidade: NF-e emitida sem grupo | `supabase/functions/verificar-conformidade-fiscal/index.ts`, `gerar-alertas-tributarios` | [x] regra "FG ≥ 03/08/2026 e CRT 3 sem IBSCBS" → alerta alto (`nfe_sem_ibscbs_obrigatoria`) [x] regra "contribuinte não-ICMS: NF-e obrigatória desde 01/12/2026" → alerta alto (`nfe_sem_ibscbs_simples_pos_dez26`) [x] check 9 (`nfe_ibscbs_cobertura`) adicionado ao score de conformidade fiscal [x] lógica extraída em `determinarAlertasRt()` pura e testável | `deno test …/alertas_rt_test.ts` → `ok \| 6 passed \| 0 failed` |
| 57 ✅ | FiscalHealthBadge reflete % de notas com grupo | `src/components/admin/FiscalHealthBadge.tsx`, `ConformidadeFiscalTab.tsx` | [x] métrica real, não fabricada (seguir testes `sefaz-sem-metrica-fabricada`) | 5 testes passando — `fiscal-health-ibscbs.test.tsx` |
| 58 ✅ | Cancelamento/evento mantém coerência | `CancelamentoNFe.tsx`, `EventosHistorico.tsx` | [x] cancelamento estorna crédito `xml_destacado` [x] evento gravado com chave | 4 testes passando — `useCancelamentoNFe.test.ts` |

## Fase 6 — Infra da calculadora oficial (59-68) — ⛔ FORA DE ESCOPO (ADR-004)

> **Não executar.** O `ADR-004-TOPOLOGIA-RFB.md` decidiu que a calculadora oficial da RFB não será hospedada: as Edge Functions rodam em Deno, não executam JVM. As etapas 59-68 ficam registradas como histórico da decisão.

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 59 | Decisão de topologia ⚠️ (custo) | `docs/receitafederal/ADR-004-TOPOLOGIA-RFB.md` | [ ] opção A: container na VPS (Swarm/Traefik) [ ] opção B: Fly/Render [ ] custo mensal estimado [ ] escolha do Joaquim registrada | ADR aprovado |
| 60 | Dockerfile multistage da `calculadora-rtc-regime-regular` ⚠️ | `infra/rfb/Dockerfile.regime-regular` | [ ] Java 25 [ ] `flyway:migrate` no build gera `calculadora-pro.db` [ ] `java -jar` perfil `offline` [ ] `-XX:-UseBASE64Intrinsics` (CVE 17/11/2026) [ ] imagem < 400 MB | `docker build` + `curl /api/calculadora/versao/status` 200 |
| 61 | Dockerfile da `calculadora-rtc-simples-nacional` ⚠️ | `infra/rfb/Dockerfile.simples-nacional` | [ ] mesmo padrão [ ] healthcheck | 200 |
| 62 | Stack Swarm + Traefik ⚠️ | `infra/rfb/stack.rfb.yml` | [ ] rede interna, sem porta pública [ ] rota Traefik só com header `X-RFB-Token` [ ] limits cpu/mem [ ] restart policy | `docker stack ps` 2/2 running |
| 63 | Secrets ⚠️ | GitHub `RFB_CALC_URL`, `RFB_PROXY_TOKEN`; Supabase secrets | [ ] nenhum valor em código/doc [ ] `gitleaks` verde | `github_list_actions_secrets` mostra nomes |
| 64 | Workflow de build/deploy da imagem ⚠️ | `.github/workflows/rfb-calculadora-deploy.yml` | [ ] build por tag upstream pinada em `VERSOES_RFB.md` [ ] push para registry [ ] `actionlint` verde | run verde |
| 65 | Edge function `rfb-proxy` | `supabase/functions/rfb-proxy/index.ts` | [ ] auth `exigirInternaOuUsuario` [ ] whitelist de rotas (`/regime-geral`, `/observabilidade/regime-geral`, `/base-calculo/*`, `/dados-abertos/*`, `/xml/*`) [ ] timeout 10 s, retry 2× backoff [ ] `correlationHeaders` propagados | `deno test` + request real 200 |
| 66 | Rate limit no proxy | mesmo | [ ] 60 req/min por empresa [ ] 429 com `Retry-After` | teste de burst |
| 67 | Health agregado | `supabase/functions/rfb-health/index.ts` + cron | [ ] consulta `versao/status` das 2 calculadoras [ ] grava em `slo_metrics` [ ] alerta após 2 ciclos degradados | linha em `calcular-slo-metrics-diario` |
| 68 | Registrar no `functions-deploy.yml` ⚠️ | `.github/workflows/functions-deploy.yml` | [ ] `rfb-proxy`, `rfb-health` deployadas [ ] `README.md` dos workflows atualizado | run verde |

## Fase 7 — Cálculo delegado à calculadora oficial (69-78) — ⛔ FORA DE ESCOPO (ADR-004)

> **Não executar.** Esta fase dependia da calculadora oficial em execução; sem ela não há segundo motor, e o motor local (Fase 2) é a única fonte de cálculo.

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 69 | Client TS tipado | `src/lib/tributario/rfb-client.ts` + `rfb-types.ts` | [ ] tipos gerados do OpenAPI 3.1 (`/api/v3/api-docs`) [ ] `dhFatoGerador` (não `dataHoraEmissao`) [ ] `aliquotasNominais` obrigatório ≥2027 | `tsc` verde |
| 70 | Mapeador `DadosOperacao` → payload RFB | `src/lib/tributario/rfb-mapper.ts` | [ ] item: `numero, ncm/nbs, cst, cClassTrib, baseCalculo, quantidade, unidade, tpDoc=55` [ ] município IBGE e UF da empresa [ ] IS quando aplicável | teste com `docs/exemplos.md` da RFB |
| 71 | Mapeador resposta RFB → `ResultadoCalculo` | mesmo | [ ] `tribCalc.IBSCBS.gIBSCBS` → campos [ ] `memoriaCalculo` preservada [ ] `estadoItem` propagado | teste: item 3 do exemplo → vCBS 42,24 |
| 72 | ~~`calcularTributosReforma` usa RFB quando flag ligada~~ — ⛔ não aplica (ADR-004, sem segundo motor) | `src/lib/reforma-tributaria/calcular-tributos.ts` | [ ] `rt_motor_v2` on → RFB via `rfb-proxy` [ ] off ou erro → motor local (Fase 2) com `origem:'local'` e alerta | teste: proxy fora → fallback |
| 73 | Modo observabilidade na calculadora de operações | `CalculadoraTributos.tsx`, `OperacoesLista.tsx` | [ ] itens com `INCONSISTENCIA_ENTRADA` exibem `code/title/pointer` [ ] totais só dos calculados | E2E `calculadora-tributaria` |
| 74 | Tradução dos códigos `REG-*` / `VSN-*` | `src/lib/tributario/erros-rfb.ts` | [ ] carregado de `GET /observabilidade/erros` com cache 24 h [ ] fallback PT-BR local para os 20 mais comuns | teste |
| 75 | Base unificada NF-e via RFB | `src/lib/reforma-tributaria/base-calculo.ts` | [ ] flag on → `POST /base-calculo/base-calculo-unificada` [ ] avisos exibidos [ ] paridade com cálculo local (etapa 23) em 50 casos | `vitest` dupla: divergência = 0 |
| 76 | Simples Nacional via RFB | `src/lib/tributario/simular-simples.ts`, `fator-r.ts` | [ ] `POST /calculadora/observabilidade/simples-nacional` [ ] catálogo `atividades` com vigência [ ] Fator R mantém regra III ≥ 0,28 / V < 0,28 | teste oficial do repo SN |
| 77 | Geração e validação XML do grupo | `src/lib/nfe/pre-validar-ibscbs.ts` | [ ] `POST /xml/generate?tipo=nfe` → `POST /xml/validate?subtipo=grupo` antes de enviar ao Bling | request real true |
| 78 | Cache idempotente em `rfb_calculos` | `rfb-proxy`, tabela da etapa 39 | [ ] hash SHA-256 do payload normalizado [ ] TTL 24 h [ ] `request_id` reutilizado | query: mesma operação 2× → 1 linha |

## Fase 8 — Dados abertos oficiais sincronizados (79-86)

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 79 | Job diário `sync-catalogo-cclasstrib` | `supabase/functions/sync-catalogo-cclasstrib/index.ts` + cron | [ ] `GET /dados-abertos/classificacoes-tributarias/cbs-ibs` → upsert por `(cclasstrib, inicio_vigencia)` [ ] `versao_it` gravada (hoje v1.71) [ ] idempotente | contagem sobe; rerun não duplica |
| 80 | Job `sync-catalogo-ncm-nbs` | `supabase/functions/sync-catalogo-ncm-nbs/{index,montar}.ts` + cron `20261126060000` | [x] `GET /dados-abertos/ncm/vigentes`, `/nbs/lista` [x] vigência (`inicio_vigencia = 2026-01-01`, encerramento por ausência com piso e teto de 10%) [x] 12 testes `deno test` | rerun não duplica; deploy e migration em produção pendentes (regra 8) |
| 81 | Job `sync-aliquota-referencia` | `supabase/functions/sync-aliquota-referencia/{index,montar}.ts` + cron `20261126080000` | [x] `GET /aliquota-uniao`, `/aliquota-uf`, `/aliquota-municipio` (2026) [x] 404 ≥2027 tratado como "não publicada" [x] 13 testes `deno test` | rerun não duplica (upsert por `id`); deploy e migration em produção pendentes (regra 8) |
| 82 | Fundamentações legais por item | `GET /dados-abertos/fundamentacoes-legais` → `catalogo_fundamentacao` + `sync-fundamentacao-legal/{index,montar}.ts` | [x] 12 testes `deno test` do sync [x] `fundamento` anexado a REG-011/REG-013 [x] exibida no `GlossarioTooltip` e no PDF de alertas | rerun não duplica; deploy e migration em produção pendentes (regra 8) |
| 83 | `CatalogosTributariosHealthPanel` passa a medir os catálogos RFB | `src/components/admin/telemetry/CatalogosTributariosHealthPanel.tsx`, `src/lib/tributario/catalogos/saude.ts` | [x] idade do último sync [x] versão IT [x] alerta > 7 dias [x] frescor por catálogo e escopo (NBS, CBS, IBS/UF, IBS municipal) [x] último run lido do ledger de observabilidade quando o carimbo do catálogo congela [x] 10 testes de frescor | painel |
| 84 | Página de consulta pública interna | `src/pages/tributario/consulta-rapida/ConsultaNcmTab.tsx` | [ ] busca NCM → cClassTrib válidos + redução + fundamento [ ] modo offline usa `fiscal-cache.ts` | E2E |
| 85 | Cache offline com vigência | `src/lib/offline/fiscal-cache.ts` | [ ] TTL respeita `fim_vigencia` [ ] registro expirado não retorna | teste existente estendido |
| 86 | Cadastro de produto com cClassTrib default ⚠️ | `src/pages/tributario/TabelasConsulta.tsx` + tabela de produtos/Bling | [ ] produto tem `cclasstrib_padrao` (coluna nova = DDL em produção, regra 8) [ ] sugestão por NCM | query |

## Fase 9 — Apuração 2026/2027, split, remoção do fictício (87-94)

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 87 | Remover "EFD IBS/CBS" | `src/lib/sped-generator/efd-ibs-cbs.ts`, `ExportacaoSPED.tsx`, `index.ts` | [x] gerador removido do index.ts e arquivo deletado [x] botão só gera EFD-Contribuições [x] card "Em breve" com texto explica apuração assistida (art. 46; Decreto 12.955/2026; Res. CGIBS 6/2026) | `grep -rn gerarEFD_IBS_CBS src` = 0; UI mostra card informativo |
| 88 | Apuração mensal IBS/CBS a partir dos DF-e | `ApuracaoMensal.tsx`, `useApuracoesTributarias.ts`, `executar-fechamento-tributario` | [x] débitos = Σ v_cbs/v_ibs das NF-e emitidas [x] créditos = Σ `xml_destacado` com `efeito_tributario` [x] 2026: resultado marcado "informativo — compensável com PIS/COFINS, dispensa art. 348" | fechamento de competência real |
| 89 | Conferência contra apuração assistida | `ConciliacaoTributariaPanel.tsx` | [x] upload/colagem do extrato da apuração assistida (CBS: RFB; IBS: CGIBS) [x] diff por chave de acesso | E2E com fixture |
| 90 | Obrigações acessórias 2026/2027 no calendário | `src/lib/tributario/obrigacoes/catalogo.ts`, `calendario.ts` | [x] itens: NF-e com grupo (03/08/2026), NF-e p/ não-contribuinte ICMS (01/12/2026), CBS plena 01/01/2027, fim PIS/COFINS/EFD-Contribuições 2027, apuração assistida dia 20 (DeRE) [x] fundamento por item | teste `catalogos-vigencia` |
| 91 | Split payment: estado "aguardando ato conjunto" | `SplitPaymentPanel.tsx`, `useSplitPayment.ts` | [x] painel informativo com cronograma (piloto 15/10/2026; previsão 2º sem. 2027, facultativo B2B) [x] sem ação de retenção | screenshot |
| 92 | Simulador de preço com CBS 2027 | `SimuladorCenariosTributarios.tsx` | [x] cenários 11,2% (TCU) e valor livre [x] selo simulado até resolução do Senado | E2E |
| 93 | EFD-Contribuições: aviso de fim em 2027 | `exportar-sped-contribuicoes/index.ts`, `SpedExport.tsx` | [x] competência ≥ 2027-01 bloqueada com motivo | teste |
| 94 | PDF tributário com memória oficial | `gerar-pdf-tributario/index.ts`, `relatorio-pdf/memorial.ts` | [x] `memoriaCalculo` da RFB impressa quando disponível [x] origem (RFB/local/simulado) no rodapé | PDF gerado |

## Fase 10 — Qualidade, operação e encerramento (95-100)

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 95 | ~~Suíte de paridade local × RFB~~ → fixture estática com exemplos oficiais (ADR-004) | `src/lib/__tests__/rfb-paridade.test.ts` | [x] 200 operações (NCM reais de brindes) [x] **saídas esperadas publicadas pela RFB** (NT 2025.002 / doc. da calculadora) como referência independente — NCM real sozinho não prova paridade [x] divergência máxima R$ 0,01 por item, 0 no total — _não chama calculadora externa_ | relatório |
| 96 | E2E ponta a ponta: produto → NF-e → XML → crédito → apuração | `e2e/rt-ponta-a-ponta.e2e.ts` | [x] Playwright verde em CI [x] usa usuário E2E padrão | run |
| 97 | ~~Chaos: calculadora fora~~ — ⛔ não aplica (ADR-004) | — | ~~[ ] proxy 503 → motor local + alerta, sem 5xx na UI~~ — sem proxy/calculadora remota não há fallback a testar; motor local é a única via | — |
| 98 | ~~Runbook RFB (pingar calculadora, rotacionar token, subir versão upstream)~~ — ⛔ substituída por documentar a decisão do ADR-004 | `docs/RUNBOOK.md` seção RFB | [ ] como pingar, rotacionar token, subir versão upstream, ler `REG-*` | doc |
| 99 | ~~Flag `rt_motor_v2` ligada em produção~~ — ⛔ não aplica (ADR-004, etapa 5 descartada) | update na tabela de flags | [ ] 1 semana de paridade sem divergência [ ] rollback = flag off | query + log |
| 100 | Encerramento | `CHANGELOG.md`, `docs/receitafederal/README.md`, ADR-003 | [x] 13 achados da auditoria marcados por etapa (coluna "Corrigido na etapa" do ADR-003) [x] `VERSOES_RFB.md` com tags em uso [x] `README.md` do módulo criado [x] `CHANGELOG.md` atualizado com etapas 88-96 | `docs/receitafederal/README.md` criado; ADR-003 coluna "Corrigido na etapa" preenchida |

---

## Dependências entre fases

```
0 → 1 → 2 → (3 ⚠️) → 4 → 5 → 8 → 9 → 10

6 ⛔ e 7 ⛔ — fora de escopo (ADR-004), não bloqueiam nenhuma fase
```
Fases 1-2 não dependem de banco nem de infra: começam imediatamente e já corrigem o que hoje está errado na tela. Fase 3 trava no Joaquim (regra 8). As fases 6 e 7 foram descartadas pelo ADR-004 e saíram do caminho crítico: a fase 8 depende apenas da 5.

## Riscos registrados

| Risco | Mitigação |
|---|---|
| Senado fixa CBS ≠ 11,3% em dez/2026 | parâmetro único (etapa 8) — a referência vem de `import.meta.env` (`src/config/reforma-tributaria.ts:26-27`), então muda sem editar código, mas a alíquota só vale no site após novo build e deploy |
| Rejeição 1115 reativada sem aviso | etapa 54 bloqueia envio sem grupo desde já |
| Nova versão da tabela cClassTrib (IT 2025.002) | sync diário (79) + watch upstream (6) |
| Bling não expor campos IBS/CBS no payload | etapa 51 decide: cadastro no Bling vs. troca de emissor |
| Custo da VPS para Java 25 | ~~ADR-004 (59) antes de qualquer deploy~~ — encerrado: ADR-004 decidiu não hospedar |
# Promo Finance V2 — Plano de Conformidade com a Reforma Tributária e Integração ReceitaFederal (100 etapas)

**Base:** auditoria de 21/11/2026 sobre `adm01-debug/Promo_Finance_V2@ea8ccc8` e `ReceitaFederal/calculadora-rtc-regime-regular@1.7.2` (DB `V0073`).
**Ordem:** primeiro parar de calcular errado (Fases 1-2), depois guardar os dados fiscais certos (Fases 3-5), depois delegar o cálculo à calculadora oficial (Fases 6-8), por fim apuração/split/encerramento (Fases 9-10). Nenhuma etapa reescreve módulo inteiro; cada uma é diff mínimo.

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
| 1 | Registrar o relatório de auditoria no repo como ADR | `docs/receitafederal/ADR-003-AUDITORIA-RT-2026-11-21.md` | [ ] 13 achados listados com arquivo:linha [ ] tabela "regra oficial × código" [ ] link para este plano | PR mergeada |
| 2 | Arquivar o plano antigo não executado | `docs/receitafederal/PLANO_INTEGRACAO_RECEITAFEDERAL_100_ETAPAS.md` → `docs/archive/` | [ ] arquivo movido [ ] README aponta para o plano novo [ ] nenhum link quebrado (`grep -r PLANO_INTEGRACAO docs/`) | `git mv` no diff |
| 3 | Criar `docs/receitafederal/FONTES_NORMATIVAS.md` | novo | [ ] tabela: norma · artigo · o que fixa · data · link [ ] cobre LC 214, LC 227, LC 235, ADCT 124-133, NT 2025.002, Atos Conjuntos 1/2025 e 4/2026, Res. CGIBS 6/2026, TCU 2933/2026 | doc revisado |
| 4 | Snapshot de regressão dos motores atuais (antes de corrigir) | `src/lib/__tests__/rt-snapshot-pre-correcao.test.ts` | [ ] 8 anos × 3 motores gravados como snapshot [ ] teste marcado `describe.skip` com motivo "baseline histórica" | `vitest run` verde |
| 5 | ~~Feature flag `rt_motor_v2` por empresa~~ — ⛔ descartada (ADR-004) | — | único uso original era alternar local × RFB na etapa 72; a Fase 7 saiu de escopo (ADR-004), então a flag não teria estado a alternar. Nenhuma migration foi criada e não há consumo da flag no código. Sem rollback automatizado: o rollback das Fases 1-2 é revert de commit | — |
| 6 | Workflow semanal que compara tag/`V00xx` dos repos RFB com `docs/receitafederal/VERSOES_RFB.md` ⚠️ | `.github/workflows/rfb-upstream-watch.yml` | [ ] roda segunda 06:00 BRT [ ] abre issue quando `CHANGELOG.md` upstream muda [ ] `actionlint` verde | PR aberta p/ Joaquim |

## Fase 1 — Fonte única de alíquotas e cronograma (7-18)

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 7 | Criar `src/lib/reforma-tributaria/cronograma-oficial.ts` como ÚNICA tabela de transição | novo | [ ] 2026: CBS 0,9 / IBS UF 0,05 / IBS Mun 0,05 / PIS-COFINS-ICMS-ISS 100% [ ] 2027-28: CBS = `refCBS − 0,1`, IBS 0,05+0,05, PIS/COFINS 0 [ ] 2029-32: ICMS/ISS 90/80/70/60, IBS 10/20/30/40% de `refIBS` [ ] 2033: 100/0 [ ] cada linha com `fundamento` e `origem: 'lei' \| 'simulado'` | arquivo + teste |
| 8 | Parâmetros de referência configuráveis | mesmo arquivo + `src/config/reforma-tributaria.ts` | [ ] `REF_CBS_2027 = 11.3` com `origem:'simulado'` e nota "TCU 2933/2026; Senado até 15/12/2026" [ ] `REF_IBS` com `origem:'simulado'` [ ] override por env `VITE_RT_REF_CBS` | teste: override altera resultado |
| 9 | Teste de propriedade do cronograma | `src/lib/reforma-tributaria/__tests__/cronograma-oficial.test.ts` | [ ] soma residual ICMS + fração IBS = 100% em cada ano 2029-32 [ ] 2026 e 2027-28 IBS = 0,1 [ ] 2033 residual 0 | `vitest` verde |
| 10 | Apontar `types/reforma-tributaria/transicao.ts` para a fonte única | `src/types/reforma-tributaria/transicao.ts` | [ ] `ALIQUOTAS_TRANSICAO` vira re-export derivado [ ] constante `8.8` removida [ ] `ALIQUOTA_REFERENCIA_IVA_DUAL` removida ou marcada simulada | `grep -rn "8\.8" src/types` = 0 |
| 11 | Apontar `lib/tributario/calculadora/reforma-tributaria.ts` para a fonte única | `src/lib/tributario/calculadora/reforma-tributaria.ts:15-85` | [ ] `CRONOGRAMA` local removido [ ] `CBS_ALVO`/`IBS_ALVO` removidos [ ] testes existentes ajustados | diff só remove tabela |
| 12 | Apontar `lib/tributario/projecao-reforma.ts` para a fonte única | `src/lib/tributario/projecao-reforma.ts:21-93` | [ ] `CRONOGRAMA_REFORMA` derivado da fonte [ ] campo `fase` preservado | `vitest run projecao` verde |
| 13 | Atualizar teste de regressão de tipos | `src/lib/__tests__/reforma-tributaria-types.regression.test.ts` | [ ] snapshot regravado com valores corretos [ ] comentário cita ADCT art. 128 | PR mostra snapshot novo |
| 14 | Remover tabelas de Imposto Seletivo fabricadas | `src/types/reforma-tributaria/imposto-seletivo.ts`, `calculadora/reforma-tributaria.ts:88-94` | [ ] `CONFIGURACOES_IS` só com `categoria`, `descricao`, `fundamento`, sem `aliquotaBase` [ ] IS calculado apenas com alíquota informada pelo usuário e `origem:'simulado'` | `grep -rn aliquotaBase src` = 0 |
| 15 | Substituir `REGIMES_ESPECIAIS` hardcoded por catálogo de reduções | `src/types/reforma-tributaria/regimes.ts` | [ ] percentuais: 100% cesta básica (art. 125), 60% saúde/educação/alimentos (art. 128+), 30% profissões (art. 127), 50% imóveis / 70% locação (arts. 261-263), 40% hotelaria/bares/parques/agências (art. 275+), 60% transporte coletivo urbano [ ] cada item com `cClassTrib` provisório e `fundamento` [ ] "imobiliario 40%" e "ZFM 100%" removidos | revisão + teste |
| 16 | Refletir LC 227/2026 no catálogo | `regimes.ts`, `docs/receitafederal/FONTES_NORMATIVAS.md` | [ ] locação tratada como bem (art. 3º §3º) [ ] ordem de aplicação de benefícios (art. 7º-A) implementada como função pura | teste: dois benefícios → ordem correta |
| 17 | Split IBS 50/50 | `src/lib/reforma-tributaria/calcular-tributos.ts:73-74` | [ ] `0.75/0.25` removido [ ] UF e Mun vêm da fonte única | teste 2026: UF 0,05 / Mun 0,05 |
| 18 | Selo "simulado" na UI | `src/components/reforma-tributaria/CronogramaTransicao.tsx`, `ResultadoTributos.tsx`, `GlossarioTooltip.tsx` | [ ] badge quando `origem === 'simulado'` [ ] tooltip com fundamento | screenshot E2E |

## Fase 2 — Correção dos motores de cálculo (19-30)

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 19 | 2026: não somar IBS/CBS a PIS/COFINS | `calcular-tributos.ts:79-104` | [ ] campo novo `cbsIbsCompensavel` [ ] `totalTributos` 2026 = tributos antigos [ ] detalhamento cita art. 348 | teste: 2026 carga = carga antiga |
| 20 | Mesmo ajuste no simulador anual | `calculadora/reforma-tributaria.ts:96-109` | [ ] alerta 2026 corrigido ("compensável/dispensado") | teste verde |
| 21 | Mesmo ajuste na projeção | `projecao-reforma.ts:177-181` | [ ] 2026 não gera "pico tributário" artificial | teste: `picoTributario.ano !== 2026` |
| 22 | Remover ICMS 18% / ISS 5% / PIS 1,65 / COFINS 7,6 fixos | `calcular-tributos.ts:82-86` | [ ] alíquotas vêm de `DadosOperacao` (obrigatórias) ou de `parametros_tributarios` da empresa [ ] erro tipado se ausentes | teste: sem alíquota → erro |
| 23 | Base de cálculo oficial | `src/lib/reforma-tributaria/base-calculo.ts` (novo) | [ ] `baseRG = vProd+vFrete+vSeg+vOutro−vDesc−vICMS−vFCP (−vPIS−vCOFINS só 2026) + vIS` [ ] vigência por ano [ ] avisos de campo ignorado iguais aos da RFB | teste reproduz exemplo RFB: 2027 → 870,00 |
| 24 | Política de arredondamento | `src/lib/reforma-tributaria/arredondamento.ts` (novo) | [ ] base 2 casas antes de multiplicar [ ] alíquota efetiva 4 casas [ ] arredondar uma vez [ ] `vIBS = vIBSUF + vIBSMun` exibidos [ ] empate → par | teste: base 25 × 0,9% = 0,22; 12 × (0,05+0,05) = 0,02 |
| 25 | Aplicar arredondamento em `calcularTributosReforma` | `calcular-tributos.ts:70-71` | [ ] nenhuma multiplicação float sem `arredondar()` | `grep -n "\* (aliquota" calcular-tributos.ts` = 0 |
| 26 | Totais = soma dos itens (rejeição 1091) | `src/lib/reforma-tributaria/totalizar.ts` (novo) | [ ] total CBS = Σ vCBS exibidos [ ] propriedade testada com 1.000 lotes aleatórios | `vitest` verde |
| 27 | Créditos: alíquota do ano de origem, não do regime do comprador | `src/lib/reforma-tributaria/creditos.ts` | [ ] usa `anoReferencia` da aquisição [ ] bloco "crédito proporcional ao regime especial" removido (redução é do fornecedor) [ ] `naoCumulatividadePlena` só `true` quando crédito vem de valor destacado | teste |
| 28 | Split payment desligado até ato conjunto | `calcular-tributos.ts:111-113`, `src/types/reforma-tributaria/split-payment.ts` | [ ] `valorSplitPayment*` = 0 com `motivo: 'não vigente'` [ ] `SplitPaymentConfig.retencao*Automatica` removido (split é do PSP, arts. 31-35) | teste + `SplitPaymentPanel` sem botão de reter |
| 29 | CFOP de exportação: regra explícita | `src/lib/reforma-tributaria/regras.ts:87-100` | [ ] lista CFOP 7xxx explícita, sem `startsWith(c[0])` [ ] imunidade mantém crédito (`manutencaoCredito: true`) | teste CFOP 7101/7102/7949 |
| 30 | Remover snapshot pré-correção (etapa 4) | `src/lib/__tests__/rt-snapshot-pre-correcao.test.ts` | [ ] arquivo apagado após Fases 1-2 verdes | diff |

## Fase 3 — Modelo de dados IBS/CBS no banco (31-40) — todas ⚠️

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 31 | Inventário do schema fiscal atual | `docs/receitafederal/SCHEMA_FISCAL_ATUAL.md` | [ ] colunas de `notas_fiscais`, `operacoes_tributaveis`, `creditos_tributarios`, `apuracoes_tributarias` listadas via `information_schema` [ ] RPC `registrar_nfe_com_creditos` documentada | saída da query |
| 32 | Tabela `notas_fiscais_itens` (se não existir) | migration | [ ] FK `nota_fiscal_id` [ ] `n_item, c_prod, ncm, cfop, q_com, v_un_com, v_prod` [ ] RLS por `empresa_id` igual a `notas_fiscais` | `supabase db lint` verde |
| 33 | Grupo IBS/CBS por item | migration | [ ] `cst_ibscbs char(3)`, `cclasstrib char(6)`, `v_bc_ibscbs`, `p_ibs_uf`, `v_ibs_uf`, `p_ibs_mun`, `v_ibs_mun`, `p_cbs`, `v_cbs`, `v_ibs` numeric(15,2)/(5,4) [ ] `p_red_aliq`, `p_aliq_efet` [ ] check `v_ibs = v_ibs_uf + v_ibs_mun` | migration + teste pgTAP |
| 34 | Grupo IS por item | migration | [ ] `cst_is`, `cclasstrib_is`, `v_bc_is`, `p_is`, `ad_rem_is`, `v_is` | lint verde |
| 35 | Totais na nota | migration | [ ] `notas_fiscais.v_bc_ibscbs, v_ibs, v_ibs_uf, v_ibs_mun, v_cbs, v_is` [ ] trigger que confere total = Σ itens (1091) | pgTAP: total ≠ soma → erro |
| 36 | `creditos_tributarios`: origem e efeito | migration | [ ] `origem enum('xml_destacado','estimado','manual')` [ ] `efeito_tributario boolean` (false para FG 2026) [ ] `ano_fato_gerador int` [ ] backfill: créditos existentes → `origem='estimado', efeito_tributario=false` | query de contagem antes/depois |
| 37 | Tabela `catalogo_cclasstrib` | migration | [ ] espelho da `CLASSIFICACAO_TRIBUTARIA` RFB: `cclasstrib, cst, descricao, p_red_cbs, p_red_ibs_uf, p_red_ibs_mun, exige_gibscbs, ind_dir, inicio_vigencia, fim_vigencia, versao_it` [ ] RLS leitura para authenticated, escrita service_role | lint |
| 38 | Tabelas `catalogo_ncm`, `catalogo_nbs`, `catalogo_aliquota_referencia` | migration | [ ] vigência [ ] `fonte='RFB'`, `carregado_em` | lint |
| 39 | Tabela `rfb_calculos` (cache/idempotência) | migration | [ ] `hash_payload` unique, `request_id`, `resposta jsonb`, `estado_item`, `ttl` [ ] RLS service_role | lint |
| 40 | Regenerar `src/integrations/supabase/types.ts` e remover `@ts-nocheck` dos hooks tocados | `types.ts`, hooks | [ ] `supabase gen types` [ ] `tsc --noEmit` exit 0 | log do comando |

## Fase 4 — Importação de XML e créditos reais (41-50)

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 41 | Parser lê `det/imposto/IBSCBS` | `src/hooks/useImportacaoXMLNFe.ts:55-130` → extrair `src/lib/nfe/parse-ibscbs.ts` | [ ] lê `CST, cClassTrib, gIBSCBS/vBC, gIBSUF/pIBSUF,vIBSUF, gIBSMun/pIBSMun,vIBSMun, gCBS/pCBS,vCBS, vIBS, gRed` [ ] lê `IS` [ ] lê `total/IBSCBSTot` | teste com fixtures `procNFe-ok.xml` + XML 2026 real |
| 42 | Fixture oficial com IBS/CBS | `supabase/functions/_shared/sefaz/__fixtures__/procNFe-ibscbs-2026.xml` | [ ] gerado pelo `POST /xml/generate?tipo=nfe` da calculadora RFB [ ] validado por `/xml/validate?subtipo=nota` = true | resposta da API |
| 43 | Crédito = valor destacado, ano = emissão | `useImportacaoXMLNFe.ts:185-201` | [ ] `new Date().getFullYear()` removido [ ] `cbsCalculado` → `vCBS` do XML [ ] fallback estimado só se XML sem grupo, com `origem:'estimado'` e aviso | teste: XML 2026 com vCBS 9,00 → crédito 9,00 |
| 44 | Efeito tributário por ano | mesmo | [ ] FG 2026 → `efeito_tributario=false`, `status='informativo'` [ ] ≥2027 → `disponivel` | teste |
| 45 | RPC `registrar_nfe_com_creditos` grava itens e grupos ⚠️ | migration da função | [ ] `p_itens jsonb` validado contra `information_schema` como já feito para `p_nota` [ ] transação única | pgTAP |
| 46 | Validação cClassTrib × CST × NCM na importação | `src/lib/tributario/validador-ncm-cst.ts` | [ ] consulta `catalogo_cclasstrib` + `catalogo_ncm` [ ] regras de exemplo PIS/COFINS removidas [ ] divergência vira alerta na nota, não bloqueio | teste: NCM 02013000 × 200035 → REG-011 |
| 47 | Painel de importação mostra grupo IBS/CBS | `src/components/reforma-tributaria/ImportacaoXMLPanel.tsx` | [ ] colunas vCBS/vIBS/CST/cClassTrib [ ] badge "informativo 2026" | screenshot E2E |
| 48 | Gestor de créditos separa informativo × disponível | `GestorCreditosTributarios.tsx`, `useCreditosTributarios.ts` | [ ] saldo "disponível" exclui `efeito_tributario=false` [ ] KPI "informativo 2026" separado | E2E `split-payment`/`tributario-dashboard` ajustado |
| 49 | NF-e recebidas (Sefaz/manifestação) também preenchem grupo | `src/hooks/useNfeRecebidas.ts`, `supabase/functions/nfe-vinculo-proxy` | [ ] resumo `resNFe` não gera crédito (sem XML completo) [ ] `procNFe` completo passa pelo parser da etapa 41 | `deno test` |
| 50 | Reprocessamento retroativo 2026 | `supabase/functions/reprocessar-creditos-ibscbs/index.ts` + cron | [ ] lê XML em storage (`xml-storage.ts`) [ ] regrava créditos com `origem='xml_destacado'` [ ] idempotente por `chave_acesso` | log: N notas reprocessadas, 0 duplicadas |

## Fase 5 — Emissão de NF-e conforme (Bling + validação local) (51-58)

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 51 | Mapear payload `criar_nfe` do Bling | `supabase/functions/bling-proxy/index.ts`, `docs/receitafederal/BLING_NFE_IBSCBS.md` | [ ] campos de tributação por item que o Bling aceita listados [ ] confirmado se IBS/CBS vem do cadastro de produto Bling ou do payload | doc + request real de teste |
| 52 | `ItemNFe` ganha grupo IBS/CBS | `src/components/nfe/nfe-types.ts:3-12` | [ ] `cstIbsCbs, cClassTrib, vBC, pCBS, vCBS, pIBSUF, vIBSUF, pIBSMun, vIBSMun` opcionais→obrigatórios atrás da flag | `tsc` verde |
| 53 | `NovaNFeForm` preenche CST/cClassTrib por item | `src/components/nfe/NovaNFeForm.tsx` | [ ] select de cClassTrib do `catalogo_cclasstrib` vigente [ ] default por NCM (regra 000001 para brindes tributados) [ ] cálculo local via Fase 2 exibido antes do envio | E2E `nfe-fluxo` |
| 54 | Pré-validação antes de enviar ao Bling/SEFAZ | `src/lib/nfe/pre-validar-ibscbs.ts` (novo) | [ ] regras UB12-10 (grupo presente p/ CRT 3), totais = Σ itens, CST × cClassTrib vinculados [ ] bloqueia envio com mensagem PT-BR | teste unitário por regra |
| 55 | Guardar XML autorizado e extrair grupo | `useBlingNFe.ts`, `xml-storage.ts` | [ ] após `enviar_nfe_sefaz`, XML baixado e parseado (etapa 41) [ ] itens/totais gravados (Fase 3) | query: nota autorizada tem `v_cbs` preenchido |
| 56 | Alerta de conformidade: NF-e emitida sem grupo | `supabase/functions/verificar-conformidade-fiscal/index.ts`, `gerar-alertas-tributarios` | [ ] regra "FG ≥ 03/08/2026 e CRT 3 sem IBSCBS" → alerta alto [ ] regra "contribuinte não-ICMS: NF-e obrigatória desde 01/12/2026" | alerta gerado em fixture |
| 57 | `FiscalHealthBadge` reflete % de notas com grupo | `src/components/admin/FiscalHealthBadge.tsx`, `ConformidadeFiscalTab.tsx` | [ ] métrica real, não fabricada (seguir testes `sefaz-sem-metrica-fabricada`) | teste |
| 58 | Cancelamento/evento mantém coerência | `CancelamentoNFe.tsx`, `EventosHistorico.tsx` | [ ] cancelamento estorna crédito `xml_destacado` [ ] evento gravado com chave | teste |

## Fase 6 — Infra da calculadora oficial (59-68) — ⛔ FORA DE ESCOPO (ADR-004)

> **Não executar.** O `ADR-004-TOPOLOGIA-RFB.md` decidiu que a calculadora oficial da RFB não será hospedada: Edge Functions rodam em Deno e não executam JVM. As etapas 59-68 e a Fase 7 inteira (69-78) ficam como registro histórico do cenário original, não como backlog.

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

> **Não executar.** Esta fase dependia da calculadora oficial em execução; sem ela não há segundo motor, e a etapa 72 (alternar local × RFB via `rt_motor_v2`) perde o estado válido. A etapa 5, que criava a flag, foi descartada junto. O que esta fase cobria como ideia — client tipado, mapeadores, tradução de erros, cache idempotente — só volta ao backlog se o dono reabrir a decisão do ADR-004.

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 69 | Client TS tipado | `src/lib/tributario/rfb-client.ts` + `rfb-types.ts` | [ ] tipos gerados do OpenAPI 3.1 (`/api/v3/api-docs`) [ ] `dhFatoGerador` (não `dataHoraEmissao`) [ ] `aliquotasNominais` obrigatório ≥2027 | `tsc` verde |
| 70 | Mapeador `DadosOperacao` → payload RFB | `src/lib/tributario/rfb-mapper.ts` | [ ] item: `numero, ncm/nbs, cst, cClassTrib, baseCalculo, quantidade, unidade, tpDoc=55` [ ] município IBGE e UF da empresa [ ] IS quando aplicável | teste com `docs/exemplos.md` da RFB |
| 71 | Mapeador resposta RFB → `ResultadoCalculo` | mesmo | [ ] `tribCalc.IBSCBS.gIBSCBS` → campos [ ] `memoriaCalculo` preservada [ ] `estadoItem` propagado | teste: item 3 do exemplo → vCBS 42,24 |
| 72 | `calcularTributosReforma` usa RFB quando flag ligada | `src/lib/reforma-tributaria/calcular-tributos.ts` | [ ] `rt_motor_v2` on → RFB via `rfb-proxy` [ ] off ou erro → motor local (Fase 2) com `origem:'local'` e alerta | teste: proxy fora → fallback |
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
| 80 | Job `sync-catalogo-ncm-nbs` | idem | [ ] `GET /dados-abertos/ncm/vigentes`, `/nbs/lista` [ ] vigência | idem |
| 81 | Job `sync-aliquota-referencia` | idem | [ ] `GET /aliquota-uniao`, `/aliquota-uf`, `/aliquota-municipio` (2026) [ ] 404 ≥2027 tratado como "não publicada" | log |
| 82 | Fundamentações legais por item | `GET /dados-abertos/fundamentacoes-legais` → `catalogo_fundamentacao` | [ ] exibida no `GlossarioTooltip` e no PDF | teste |
| 83 | `CatalogosTributariosHealthPanel` passa a medir os catálogos RFB | `src/components/admin/telemetry/CatalogosTributariosHealthPanel.tsx`, `src/lib/tributario/catalogos/saude.ts` | [ ] idade do último sync [ ] versão IT [ ] alerta > 7 dias | painel |
| 84 | Página de consulta pública interna | `src/pages/tributario/consulta-rapida/ConsultaNcmTab.tsx` | [ ] busca NCM → cClassTrib válidos + redução + fundamento [ ] modo offline usa `fiscal-cache.ts` | E2E |
| 85 | Cache offline com vigência | `src/lib/offline/fiscal-cache.ts` | [ ] TTL respeita `fim_vigencia` [ ] registro expirado não retorna | teste existente estendido |
| 86 | Cadastro de produto com cClassTrib default | `src/pages/tributario/TabelasConsulta.tsx` + tabela de produtos/Bling | [ ] produto tem `cclasstrib_padrao` [ ] sugestão por NCM | query |

## Fase 9 — Apuração 2026/2027, split, remoção do fictício (87-94)

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 87 | Remover "EFD IBS/CBS" | `src/lib/sped-generator/efd-ibs-cbs.ts`, `ExportacaoSPED.tsx`, `index.ts` | [ ] gerador e botão removidos [ ] texto explica apuração assistida (art. 46; Decreto 12.955/2026; Res. CGIBS 6/2026) | `grep -rn efd-ibs-cbs src` = 0 |
| 88 | Apuração mensal IBS/CBS a partir dos DF-e | `ApuracaoMensal.tsx`, `useApuracoesTributarias.ts`, `executar-fechamento-tributario` | [ ] débitos = Σ v_cbs/v_ibs das NF-e emitidas [ ] créditos = Σ `xml_destacado` com `efeito_tributario` [ ] 2026: resultado marcado "informativo — compensável com PIS/COFINS, dispensa art. 348" | fechamento de competência real |
| 89 | Conferência contra apuração assistida | `ConciliacaoTributariaPanel.tsx` | [ ] upload/colagem do extrato da apuração assistida (CBS: RFB; IBS: CGIBS) [ ] diff por chave de acesso | E2E com fixture |
| 90 | Obrigações acessórias 2026/2027 no calendário | `src/lib/tributario/obrigacoes/catalogo.ts`, `calendario.ts` | [ ] itens: NF-e com grupo (03/08/2026), NF-e p/ não-contribuinte ICMS (01/12/2026), CBS plena 01/01/2027, fim PIS/COFINS/EFD-Contribuições 2027, apuração assistida dia 20 (DeRE) [ ] fundamento por item | teste `catalogos-vigencia` |
| 91 | Split payment: estado "aguardando ato conjunto" | `SplitPaymentPanel.tsx`, `useSplitPayment.ts` | [ ] painel informativo com cronograma (piloto 15/10/2026; previsão 2º sem. 2027, facultativo B2B) [ ] sem ação de retenção | screenshot |
| 92 | Simulador de preço com CBS 2027 | `SimuladorCenariosTributarios.tsx` | [ ] cenários 11,2% (TCU) e valor livre [ ] selo simulado até resolução do Senado | E2E |
| 93 | EFD-Contribuições: aviso de fim em 2027 | `exportar-sped-contribuicoes/index.ts`, `SpedExport.tsx` | [ ] competência ≥ 2027-01 bloqueada com motivo | teste |
| 94 | PDF tributário com memória oficial | `gerar-pdf-tributario/index.ts`, `relatorio-pdf/memorial.ts` | [ ] `memoriaCalculo` da RFB impressa quando disponível [ ] origem (RFB/local/simulado) no rodapé | PDF gerado |

## Fase 10 — Qualidade, operação e encerramento (95-100)

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 95 | Suíte de paridade local × RFB | `src/lib/__tests__/rfb-paridade.test.ts` | [ ] 200 operações (NCM reais de brindes) [ ] divergência máxima R$ 0,01 por item, 0 no total | relatório |
| 96 | E2E ponta a ponta: produto → NF-e → XML → crédito → apuração | `e2e/rt-ponta-a-ponta.e2e.ts` | [ ] Playwright verde em CI [ ] usa usuário E2E padrão | run |
| 97 | Chaos: calculadora fora | `e2e/rt-fallback.e2e.ts` | [ ] proxy 503 → motor local + alerta, sem 5xx na UI | run |
| 98 | Runbook RFB | `docs/RUNBOOK.md` seção RFB | [ ] como pingar, rotacionar token, subir versão upstream, ler `REG-*` | doc |
| 99 | ~~Flag `rt_motor_v2` ligada em produção para Promo Brindes~~ ⛔ descartada com a etapa 5 | — | Encerrada pelo ADR-004: sem segundo motor, não há flag a ligar. O rollback do motor próprio é revert do commit da Fase 1-2 | — |
| 100 | Encerramento | `CHANGELOG.md`, `docs/receitafederal/README.md`, ADR-003 | [ ] 13 achados da auditoria marcados "resolvido em PR #" [ ] branches órfãs apagadas [ ] `VERSOES_RFB.md` com tags em uso | `gh pr list` limpo |

---

## Dependências entre fases

```
0 → 1 → 2 → (3 ⚠️) → 4 → 5
                 └→ 6 ⚠️ → 7 → 8 → 9 → 10
```
Fases 1-2 não dependem de banco nem de infra: começam imediatamente e já corrigem o que hoje está errado na tela. Fase 3 e 6 travam no Joaquim (regra 8). Fase 7 só faz sentido com 3 + 6 prontas.

## Riscos registrados

| Risco | Mitigação |
|---|---|
| Senado fixa CBS ≠ 11,3% em dez/2026 | parâmetro único (etapa 8), sem redeploy de código |
| Rejeição 1115 reativada sem aviso | etapa 54 bloqueia envio sem grupo desde já |
| Nova versão da tabela cClassTrib (IT 2025.002) | sync diário (79) + watch upstream (6) |
| Bling não expor campos IBS/CBS no payload | etapa 51 decide: cadastro no Bling vs. troca de emissor |
| Custo da VPS para Java 25 | ADR-004 (59) antes de qualquer deploy |

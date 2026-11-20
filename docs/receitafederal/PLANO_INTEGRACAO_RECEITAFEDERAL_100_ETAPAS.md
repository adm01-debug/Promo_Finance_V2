# Plano de Implementação — Integração ReceitaFederal (RTC) ao Módulo Tributário

> **Escopo**: incorporar a API oficial da **Reforma Tributária do Consumo — LC 214/2025** (CBS, IBS e Imposto Seletivo) ao módulo tributário do Promo_Finance_V2, consumindo os 3 repositórios públicos da org **ReceitaFederal**:
>
> | Repositório                                       | Stack                                       | Papel                                                                                                                                                     |
> | ------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
> | `ReceitaFederal/calculadora-rtc-simples-nacional` | Java 25 · Spring Boot 4.1.2 · SQLite/Flyway | Cálculo CBS/IBS no Simples Nacional; catálogo de atividades (anexos/cClassTrib)                                                                           |
> | `ReceitaFederal/calculadora-rtc-regime-regular`   | Java 25 · Spring Boot 4.1.2 · SQLite/Flyway | Cálculo CBS/IBS/IS no Regime Geral; base de cálculo unificada NF-e/NFC-e/NFS-e; XML geração/validação; tabelas abertas (NCM/NBS/alíquotas/fundamentações) |
> | `ReceitaFederal/calculadora-rtc-gerador-danfse`   | Go 1.27+ · Echo · OTel                      | Geração do **DANFSE** (PDF) a partir do XML da NFS-e                                                                                                      |
>
> **Entregável por etapa**: 1 número, 1 ação concreta, 1 checklist de conclusão (critério objetivo) e 1 teste de validação (executável via CI ou request real). Nenhuma etapa depende de acesso manual — tudo passa por MCP/CI/edge function.
>
> **Fases**: 0 inventário/contrato · 1 infraestrutura · 2-3 CBS · 4 IBS · 5 IS · 6 Simples · 7 Regime/base unificada · 8 XML/NF-e · 9 DANFSE · 10 tabelas abertas · 11 ponta a ponta/operação.

## Fase 0 — Inventário e contrato de integração

| #   | Etapa                                                               | Checklist de conclusão                                                                                                                                                        | Teste de validação                                                               |
| --- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | Mapear os endpoints de cada repositório RFB (Swagger OpenAPI 3.1)   | README de integração em `docs/receitafederal/API_RFB.md` lista todos os recursos por repositório, método, caminho, request/response                                           | `curl -s <host>/api/swagger-ui.html` retorna 200 em cada serviço de exemplo      |
| 2   | Definir a topologia de consumo (self-host via Docker vs SaaS/CLOUD) | ADR em `docs/receitafederal/ADRs/0001-topologia.md` com decisão e critérios (custo, latência, backups)                                                                        | documento revisado e mergeado; custo estimado registrado                         |
| 3   | Inventariar o módulo tributário local (cálculo próprio vs delegado) | `src/lib/tributario/` auditado: funções de cálculo (anexos, fator-r, rbt12, decidir-regime, simular-simples/real/presumido) marcadas como "núcleo local" ou "delegável à RFB" | `graphify query "cálculo tributário local vs API RFB"` sem lacunas de mapeamento |
| 4   | Definir contrato unificado de cálculo no app (CBS/IBS/IS)           | `src/lib/tributario/types.ts` ganha tipos de request/response compatíveis com a API RFB (mesmos nomes de campos)                                                              | `bunx tsc --noEmit` exit 0                                                       |
| 5   | Definir regime de erro e fallback (API indisponível → motor local)  | `src/lib/tributario/failover.ts` com política: timeout, retry exponencial, degrade para motor local, alerta                                                                   | teste unitário: API fora → resposta local + alerta emitido                       |
| 6   | Definir versionamento/semver das calculadoras (tags dos repos RFB)  | `docs/receitafederal/VERSIONES_RFB.md` com versões testadas por recurso                                                                                                       | tabela preenchida com tag `vX.Y.Z` por repositório                               |
| 7   | Criar ambiente de homologação das calculadoras via Docker           | `docker-compose.rfb.yml` sobe os 3 serviços + rede isolada frente ao app                                                                                                      | `docker compose -f docker-compose.rfb.yml up -d` → 3 healthchecks ok             |
| 8   | Definir mapeamento de empresas (regime fiscal)                      | `src/lib/tributario/decidir-regime.ts` retorna regime e seleciona a calculadora correspondente                                                                                | teste: empresa anexos I-V → `simples-nacional`; demais → `regime-regular`        |

## Fase 1 — Infraestrutura da integração

| #   | Etapa                                                                              | Checklist de conclusão                                                                                                                                                  | Teste de validação                                                   |
| --- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 9   | Criar client HTTP compartilhado (`src/lib/tributario/rfb-client.ts`)               | client com baseURL configurável por env, timeout 10s, retry com backoff, logging estruturado                                                                            | `vitest run src/lib/tributario/__tests__/rfb-client.test.ts` -> 100% |
| 10  | Centralizar segredos/credenciais em variáveis de ambiente                          | nenhuma chave em código ou docs; apenas `RFB_*` no `.env.example`                                                                                                       | `gitleaks detect` sem leak                                           |
| 11  | Criar edge function proxy `rfb-proxy` (intermediário server-side do app, com CORS) | `supabase/functions/rfb-proxy/index.ts` autentica por `exigirInternaOuUsuario` e cria sessão server-side na calculadora, sem expor credencial privilegiada ao navegador | `functions-deploy.yml` deploya `rfb-proxy` verde                     |
| 12  | Adicionar rate limiting no proxy                                                   | limite por conta/segundo configurável; 429 com `Retry-After`                                                                                                            | teste de carga: burst de 100 req → máx. X aceitas                    |
| 13  | Observabilidade ponta a ponta (correlation id RFB → app)                           | `correlationHeaders` propagados do request original até o log da calculadora                                                                                            | log JSON com `request_id` idêntico no app e na edge                  |
| 14  | Tabela de cache de resultados de cálculo (idempotência)                            | `rfc_resultados_calculo` com hash do payload, TTL, RLS service_role                                                                                                     | query dedupe retorna mesmo `request_id` para payload igual           |
| 15  | Health-check das 3 calculadoras no app                                             | endpoint `/api/integracao/rfb/health` agrega `/live` e `/ready`                                                                                                         | monitor alerta se qualquer serviço degradado por 2 ciclos            |
| 16  | Rollout com feature flag por empresa                                               | flag `faturas`/`feature_flags` `rfb_calculo` por `empresa_id`; fallback imediato                                                                                        | fluxo com flag off → uso do motor local 100%                         |
| 17  | Documentar runbook de integração                                                   | `docs/RUNBOOK.md` ganha seção RFB (primeiros erros VSN-/REG-, como pingar cada serviço)                                                                                 | `actionlint` nos workflows e revisão do doc                          |
| 18  | Garantir disponibilidade offline (calculadoras embarcam SQLite)                    | testes de modo offline do app usam perfil `versao/status`                                                                                                               | `GET /versao/status` retorna perfil offline coerente                 |

## Fase 2 — CBS no Regime Geral

| #   | Etapa                                                                   | Checklist de conclusão                                                                         | Teste de validação                                                   |
| --- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 19  | Implementar chamada `POST /regime-geral` para cálculo CBS               | `simular-real.ts` delega cálculo CBS via client RFB; resposta mapeada para `ResultadoTributos` | teste de integração: caso oficial (exemplos.md) retorna CBS esperada |
| 20  | Implementar modo observabilidade (`POST /observabilidade/regime-geral`) | erros por item (código `REG-`) exibidos sem interromper os demais                              | dashboard de simulação mostra itens válidos + erros parciais         |
| 21  | Mapear códigos de erro `REG-*` para mensagens PT-BR                     | `src/lib/tributario/erros-rfb.ts` traduz cada `REG-xxx`                                        | teste: cada código conhecido tem tradução                            |
| 22  | Validar CBS não cumulativa com creditamento                             | `NaoCumulatividadeInfoCard.tsx` usa alíquota e crédito da API                                  | screenshot/E2E: card reflete créditos da API                         |
| 23  | Tratar operações desoneradas (zero)                                     | respostas com CBS 0 renderizadas como isento, não erro                                         | teste unitário: payload isento → UI "desonerado"                     |
| 24  | Cálculo CBS para NFS-e                                                  | `base-calculo-unificada-nfse` → resultados aplicados à emissão de NFS-e do app                 | teste: NFS-e de exemplo produz CBS por serviço                       |
| 25  | Casos especiais: importação, exportação e compras governamentais        | testes de `ComprasGovernamentais` do repo RFB reproduzidos no app                              | `vitest` com fixtures oficiais verdes                                |
| 26  | Alíquotas de referência CBS (União)                                     | `GET /dados-abertos/aliquota-uniao` alimenta tabela de exibição                                | teste: alíquota consultada == valor oficial vigente                  |

## Fase 3 — CBS no Simples Nacional

| #   | Etapa                                                            | Checklist de conclusão                                                                                            | Teste de validação                                           |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 27  | Implementar `POST /calculadora/observabilidade/simples-nacional` | `simular-simples.ts` delega CBS/IBS via RFB; anexos respeitados                                                   | teste oficial (exemplos.md Simples) retorna valor esperado   |
| 28  | Sincronizar catálogo de atividades Simples                       | `GET /calculadora/simples-nacional/atividades?data=` → tabela local de CNAE/anexo/cClassTrib                      | job diário grava `atividades_rfb`; contagem sobe             |
| 29  | Fator R integrado (limite 0,28: anexo III vs V)                  | `fator-r.ts` usa dados da atividade vigente da RFB + folha local, mantendo a regra atual (III ≥ 0,28 \| V < 0,28) | teste: fator R >= 0.28 → anexo III; fator R < 0.28 → anexo V |
| 30  | RBT12 oficial                                                    | `rbt12.ts` calculado sobre receitas; comparado com regra RFB                                                      | teste de simulação: faixa do anexo coincide                  |
| 31  | Tratamento de erros `VSN-*`                                      | tradução PT-BR + proposta de correção                                                                             | teste: `GET .../erros?codigo=VSN-001` retorna motivo legível |
| 32  | Campos do Simples no PDF do relatório                            | `relatorio-pdf.ts` incorpora CBS/IBS do Simples calculados pela RFB                                               | PDF gerado contém valores da API                             |

## Fase 4 — IBS

| #   | Etapa                                                            | Checklist de conclusão                                                  | Teste de validação                          |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------- |
| 33  | Implementar IBS no regime geral (via `regime-geral` e `cbs-ibs`) | resposta contém IBS estadual e municipal                                | teste: split padrão UE/UM refletido na UI   |
| 34  | Implementar IBS no Simples (via calculadora simples)             | cobrança IBS por anexo confere                                          | teste Simples: IBS esperado por anexo       |
| 35  | Split Payment                                                    | `SplitPaymentPanel.tsx` conectado ao cálculo IBS da RFB                 | E2E: simulação mostra repasse UE/UM         |
| 36  | Cronograma de transição (LC 214 — 2026-2033)                     | `CronogramaTransicao.tsx` consome alíquotas por vigência da RFB         | teste: valor de 2026 == tabela de transição |
| 37  | Comparativo de regimes (ato/mês)                                 | `ComparativoRegimesPanel.tsx` usa os 3 motores (simples/real/presumido) | E2E: comparativo coerente entre regimes     |

## Fase 5 — Imposto Seletivo

| #   | Etapa                             | Checklist de conclusão                                        | Teste de validação                            |
| --- | --------------------------------- | ------------------------------------------------------------- | --------------------------------------------- |
| 38  | Implementar IS no regime geral    | `regime-geral` retorna IS por item; UI expõe imposto seletivo | teste oficial IS (exemplos.md) verde          |
| 39  | Classificação de NCM sujeita a IS | `GET /dados-abertos/ncm` + lista de NCM com IS                | teste: NCM de bebida → IS presente            |
| 40  | Tratamento de isentos/extintos    | UI distingue isenção de erro                                  | teste unitário: NCM limpa → sem IS e sem erro |
| 41  | PDF e guias com IS                | DARF relativo ao IS gerado quando aplicável                   | teste: cenário com IS gera DARF separado      |

## Fase 6 — Simples Nacional (complementos)

| #   | Etapa                                            | Checklist de conclusão                                                              | Teste de validação                                     |
| --- | ------------------------------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 42  | Consulta de atividade por código com vigência    | `GET /calculadora/simples-nacional/atividades/{codigo}?data=` alimenta autocomplete | teste: código válido retorna descrição vigente         |
| 43  | Painel de anexos real (I-V, tipo `AnexoSimples`) | `DashboardReformaTributaria` exibe anexo vigente por empresa (I-V, sem VI)          | E2E: empresa com CNAE conhecido mostra anexo correto   |
| 44  | Dobramento de faixas no Simples                  | cálculo por faixa (0-100%, 100-200%, +200%) confere com RFB                         | teste: faturamento acima de 2x limite → dobra aplicada |

## Fase 7 — Regime Geral / Base de cálculo unificada

| #   | Etapa                                             | Checklist de conclusão                                  | Teste de validação                                            |
| --- | ------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| 45  | Implementar `base-calculo-unificada` (NF-e/NFC-e) | conciliação e apuração usam a base oficial              | teste `Teste_BaseCalculoCibs_Controller` reproduzido          |
| 46  | Implementar `base-calculo-unificada-nfse`         | mesma base para NFS-e                                   | teste NFSe oficial verde                                      |
| 47  | Casos de regra especial (pedágio etc.)            | `PedagioController` mapeado; regra aplicada em apuração | teste pedágio: base/tributos corretos                         |
| 48  | Parâmetros de divergência (base mínima)           | regras de arredondamento e mínimos alinhados            | teste de propriedade: valores >= 0 e monetariamente coerentes |

## Fase 8 — XML / NF-e / NFC-e / NFS-e

| #   | Etapa                                     | Checklist de conclusão                               | Teste de validação                              |
| --- | ----------------------------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| 49  | Geração de XML (`/xml/generate?tipo=nfe`) | importação de XML de fornecedor valida grupos        | teste `XmlControllerGeracaoTest` reproduzido    |
| 50  | Validação contra XSD (`/xml/validate`)    | `sped-validacoes-categorias.ts` usa validação da RFB | teste: XML inválido é rejeitado com grupo/campo |
| 51  | Extração de NFe para apuração             | importação de XML preenche CBS/IBS na apuração       | E2E: NFe importada → apuração com tributos      |
| 52  | Extração de NFS-e                         | `ImportacaoXMLPanel` ganha suporte NFS-e             | E2E: NFS-e importada gera valores               |

## Fase 9 — DANFSE

| #   | Etapa                           | Checklist de conclusão                                        | Teste de validação                           |
| --- | ------------------------------- | ------------------------------------------------------------- | -------------------------------------------- |
| 53  | Deploy do serviço DANFSE (Go)   | subir imagem `danfse-go`; `POST /api/danfse` acessível        | `curl -X POST /api/danfse` com XML → PDF 200 |
| 54  | Integração no app               | botão "Gerar DANFSE" em NFS-e chama o serviço via `rfb-proxy` | E2E: PDF gerado e visualizável               |
| 55  | Parâmetros de localidade (IBGE) | `localidades_generated.go` mantido em sync                    | teste: código IBGE válido encontra município |
| 56  | Limite de tamanho de XML        | `XML_MAX_SIZE_BYTES` configurado e validado no cliente        | teste: XML > limite → 413 com mensagem PT-BR |
| 57  | Telemetria OTel do DANFSE       | métricas de geração expostas no dashboard de ops              | gráfico de tempo de geração populado         |

## Fase 10 — Tabelas abertas (dados oficiais)

| #   | Etapa                                      | Checklist de conclusão                                     | Teste de validação                                         |
| --- | ------------------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------- |
| 58  | Sincronizar NCM/NBS vigentes               | job diário `dados-abertos` grava NCM/NBS/validade          | contagem de registros cresce; NCM vigente consultável      |
| 59  | Situações tributárias CBS/IBS (cClassTrib) | `validador-ncm-cst.ts` consome tabela oficial              | teste: cClassTrib válido para NCM                          |
| 60  | Fundamentações legais                      | consulta por item retorna base legal                       | teste: item com fundamentação exibida na UI                |
| 61  | Alíquotas União/UF/município               | tabela de exibição alimentada; fallback p/ menores valores | teste de vigência: alíquota da data consultada é a oficial |
| 62  | Página de dados abertos no app             | `DadosAbertosTributarios` com busca NCM/NBS/alíquota       | E2E: busca NCM retorna dados da RFB                        |

## Fase 11 — Ponta a ponta, governança e operação

| #   | Etapa                                              | Checklist de conclusão                                                                                                             | Teste de validação                                |
| --- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 63  | E2E do cálculo (UI → edge → calculadora)           | testes Cypress cobrem simulações simples/real/presumido contra RFB                                                                 | `cypress run` verde                               |
| 64  | E2E do DANFSE                                      | geração de PDF ponta a ponta                                                                                                       | artefato PDF verificado                           |
| 65  | Testes de carga (simples + regime)                 | k6 com cenários reais; p95 < limite definido                                                                                       | relatório de carga anexado                        |
| 66  | Falha controlada (chaos): derrubar uma calculadora | app degrada para motor local sem 5xx                                                                                               | smoke test pós-falha verde                        |
| 67  | Métricas SLO de integração                         | `calcular-slo-metrics-diario` inclui disponibilidade RFB                                                                           | dashboard SLO mostra disponibilidade              |
| 68  | Alertas de degradação                              | `gerar-alertas-tributarios` cobre indisponibilidade RFB                                                                            | alerta disparado em falha simulada                |
| 69  | Atualizar INVENTARIO_FUNCIONALIDADES               | módulo RFB documentado como integração oficial                                                                                     | documento atualizado e mergeado                   |
| 70  | Auditoria RLS/segurança do proxy                   | `rfb-proxy` autentica usuário via `exigirInternaOuUsuario` (JWT do app) e só repassa a chamada a credencial de serviço server-side | `supabase db lint` + revisão de policies          |
| 71  | Backup das tabelas RFB locais                      | snapshot diário `atividades_rfb`, `ncm_rfb`                                                                                        | restore validado em staging                       |
| 72  | Runbook de incidente RFB                           | doc de runbook com passos de mitigação                                                                                             | drill de incidente executado                      |
| 73  | Versão final dos ADRs                              | ADRs 0001-0006 registrados (topologia, contrato, erro, cache, segurança, operação)                                                 | ADRs presentes                                    |
| 74  | Revisão de custos (infra das 3 calculadoras)       | estimativa mensal registrada e aprovada                                                                                            | relatório de custo assinado                       |
| 75  | Treinamento/roster                                 | time conhece a integração; documentação acessível                                                                                  | 1-pager de onboarding linkado                     |
| 76  | Monitorar mudanças upstream RFB (delta de versão)  | workflow semanal compara tags dos repos RFB                                                                                        | PR de bump de tag aberto quando houver            |
| 77  | Regressão de moeda: arredondamento em centavos     | todas somas finais em centavos (inteiro)                                                                                           | teste: soma de itens == total com centavos exatos |
| 78  | Idempotência de jobs de sincronização              | jobs de sync RB (atividades, NCM) são idempotentes                                                                                 | rerun não duplica registros                       |
| 79  | Perfis de empresa (regime misto)                   | empresa com múltiplas atividades escolhe anexo predominante                                                                        | teste: função escolhe anexo de maior receita      |
| 80  | Excel de conferência (spreadsheet)                 | planilha de validação comparando módulo local vs RFB                                                                               | célula de divergência = 0                         |

## Fase 12 — Onboarding e documentação contínua

| #   | Etapa                                                    | Checklist de conclusão                                                    | Teste de validação                                |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| 81  | `docs/receitafederal/` completo + índice                 | índice navegável ligando 1-80; links nos repositórios RFB                 | cliques do índice → arquivos existem              |
| 82  | Atualizar `FUNCIONALIDADES_SISTEMA.md`                   | nova funcionalidade "Cálculo oficial RFB" descrita                        | doc revisado                                      |
| 83  | CHANGELOG do app                                         | entrada com integração RFB                                                | link da PR no changelog                           |
| 84  | Cobertura dos schedulers                                 | health-check RFB entra no ciclo de ops                                    | monitor dispara e resolve                         |
| 85  | Segurança do segredo do proxy                            | rotacionável e sem log de valor                                           | teste de rotação: chave nova passa                |
| 86  | Compliance da LC 214                                     | checklist de 5 pontos (CBS, IBS, IS, transição, split) implementado       | auditoria de compliance verde                     |
| 87  | Tratamento de períodos de transição (2026-2033)          | funções aceitam `data` futura com alíquotas corretas                      | teste: cálculo de 2029 usa alíquota de 2029       |
| 88  | Entrada de regimes especiais (monofásico, folha)         | encargos/monofásico na UI reconciliados com RFB                           | teste monofásico: sem crédito e alíquota especial |
| 89  | Cache de dados abertos com validade                      | TTL de NCM/NBS/alíquotas respeitando `vigencia_fim`                       | teste: registro expirado não retorna              |
| 90  | Retenções na fonte                                       | `RetencoesFonte` usa NCM/NBS oficiais quando aplicável                    | teste de retenção conforme norma                  |
| 91  | Sped e fiscal                                            | exportação SPED ECD/ECF usa dados de apuração RFB                         | teste de leitura do arquivo gerado                |
| 92  | Empresas com IS (indústria)                              | IS apresentado e destacado para indústria                                 | E2E indústria                                     |
| 93  | Relatórios agendados tributários                         | `<enviar-relatorios-tributarios-agendados>` passa a enviar resultados RFB | e-mail de relatório com valores RFB               |
| 94  | Risk register da integração                              | riscos (quebra API, mudança de alíquota, custo) documentados              | registro atualizado                               |
| 95  | Validação com os exemplos oficiais                       | todos os exemplos de ambos os repos RFB passam no app                     | suíte de validação oficial verde                  |
| 96  | Refatoração do motor local (reduzir divergência)         | motor local marcado como fallback; divergência documentada                | `vitest` dupla (local vs RFB) == 0                |
| 97  | Comunicação da mudança (release)                         | changelog + e-mail/novo release                                           | PR de release mergeada e deployado                |
| 98  | Aceitação final do dono                                  | demo ponta a ponta aprovada; gates git cumpridos                          | demo gravada e aprovação registrada               |
| 99  | Encerrar/arquivar trabalho parcial de agentes anteriores | nenhuma branch/PR órfã da integração; inventário reconciliado             | `gh pr list` sem órfãs                            |
| 100 | Gate de produtividade                                    | todas as etapas com evidência; métricas de uso da RFB no dashboard admin  | relatório final com % de cobertura por fase       |

## Critérios transversais

- **Segurança**: segredos só em env/secret service; RLS ativa em tabelas novas; edge functions com `exigirChamadaInterna`.
- **Qualidade**: cada etapa fecha com teste executável (unitário, integração ou E2E) que falharia sem a mudança.
- **Governança git**: 1 tarefa = 1 branch = 1 PR; commits PT-BR prefixados (`feat:`, `fix:`, `chore:`, `infra:`); DDL/CI/segredos → PR aberta (regra 8); `actionlint` para workflows tocados.
- **Reuso**: nenhum trabalho de agente anterior é descartado — o motor local vira fallback e referência de divergência, nunca é substituído de forma destrutiva.

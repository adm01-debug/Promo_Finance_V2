# PLANO — Incorporação do RTC (Regime Tributário de Caixa) ao módulo tributário do Promo_Finance_V2

**Fonte oficial:** org `ReceitaFederal` (3 repositórios públicos, MIT)
- `calculadora-rtc-regime-regular` — motor de cálculo CBS/IBS/Imposto Seletivo do regime geral (Java 25 / Spring Boot 4 / SQLite + Flyway, 36 tabelas, 43k linhas no schema inicial + 72 migrations de manutenção). Cálculo dirigido por **expressões** (JEXL3) em `TRATAMENTO_TRIBUTARIO`; API de dados abertos completa (UF, municípios, CST/cClassTrib, NCM, NBS, alíquotas de referência, redutores, transferências, grupos DF-e).
- `calculadora-rtc-simples-nacional` — CBS/IBS para optantes do Simples (Java/Spring Boot); alíquotas pré-carregadas por anexo/ano, atividades com fator R, regimes de apuração; integração PGDAS-D (alíquotas efetivas RBT12) prevista p/ Release 16 via MDD.
- `calculadora-rtc-gerador-danfse` — gera o DANFSE (PDF) a partir do XML da NFS-e (Go, renderização Folio, localidades IBGE embutidas, validação/sanitização de XML, OTel opt-in).

**Base de integração no Promo_Finance_V2 (main `d7e6b41`):**
- Catálogos: `cnaes`, `ncms`, `itens_lista_iss`, `aliquotas_iss_municipal`, `faixas_simples_nacional`, `protocolos_st(_ufs/_ncms)`, `aliquotas_internas_uf`, `aliquotas_interestaduais` (migrations 20260727185837/20260727190031/20260728120831).
- Validação/integridade: `validar_catalogos_tributarios()` + `check_catalogos_tributarios_invariants()` (20260728122339/20260728122534/20260728124927) e repair que tolera contrato compacto/detalhado (20260831153000).
- Edges: `consulta-tributaria`, `_shared/tributario-logic`, `exportar-sped-contribuicoes`, `gerar-dre-tributaria`, `executar-fechamento-tributario`, `gerar-alertas-tributarios`, `copilot-tributario`, `gerar-pdf-tributario`.
- Front: `src/lib/tributario/calculadora/*` (lucro-real, lucro-presumido, simples-nacional, reforma-tributaria) e páginas `CalculadoraTributaria`, `ConsultaRapidaFiscal`, `DashboardReformaTributaria`, `ModuloIRPJCSLL`, `NaoCumulatividade`, `PerDcompPanel`, `IncentivosFiscaisPanel`, `CashbackSimuladorPanel`, `ComparativoRegimesPanel`, `ConciliacaoTributariaPanel`, `ApuracaoMensal`, `GestorCreditosTributarios`, `ObrigacoesAcessorias`, `ExportacaoSPED`, `ImportacaoXMLPanel`.

**Lacunas centrais que este plano elimina:**
1. Alíquotas CBS/IBS/IS **hardcoded** no front (`reforma-tributaria.ts`: `CBS_ALVO=0.088`, `IBS_ALVO=0.177`, cronograma 2026-2033 fixo, `IS_ALIQUOTAS` fixa) — deveriam vir dos catálogos oficiais com vigência.
2. Sem **CST/cClassTrib** no banco — impossível aplicar reduções, créditos, monofasia, diferimento, compras governamentais conforme a LC 214/2025.
3. Sem **NBS** e sem **tratamentos tributários por expressão** — o motor PF2 não calcula por fórmula oficial.
4. Sem **DANFSE** (PDF) nem integração com os serviços oficiais.
5. Simples Nacional já calcula fator R e alíquota efetiva (`simples-nacional.ts:29-37,62-80`), mas **o anexo é escolhido manualmente** — falta catálogo de atividades por CNAE/anexo, alíquotas oficiais repartidas por ano e a **integração PGDAS-D (alíquotas efetivas RBT12)**.

**Critérios de aceite globais (valem para todas as fases):**
- Nenhuma regressão: catálogos e funções atuais continuam passando (`validar_catalogos_tributarios`, pgTAP, RLS multi-empresa).
- Zero hardcode de alíquota em código de produção (vale exceção documentada p/ fallback de vigência com `data_base`).
- Toda escrita no banco = migration idempotente versionada; DDL em produção = regra 8 (decisão do dono).
- Toda etapa termina com CI verde (typecheck, lint, testes, pgTAP) e evidência real citada.

---

# FASE A — Alinhamento e fundamento (etapas 1–10)
Todas as etapas da fase A são de leitura/análise; nenhuma altera o banco ou o código.

| # | Etapa | Checklist de conclusão | Teste de validação |
|---|-------|------------------------|--------------------|
| 1 | Levantar o inventário exato do módulo tributário do PF2 no main (`d7e6b41`) | Lista de migrations, edges, componentes e tabelas com caminho:linha | `git grep -l tribut` retorna os mesmos arquivos citados |
| 2 | Clonar os 3 repos da ReceitaFederal em ambiente isolado (não no worktree do PF2) | 3 clones com `.git` e `main` atualizados | `git rev-parse HEAD` em cada clone |
| 3 | Ler o modelo ER oficial (PDFs `modelo_rtc_calculadora_*`) e as 36 tabelas do schema B0001 | Mapa de entidades por domínio (tributo, tratamento, classificação, alíquota) | Toda tabela usada no plano existe em B0001 |
| 4 | Entender o motor de cálculo por expressão (ADR001 + colunas `TRTR_EXPRESSAO_*`) | Documento de 1 pág: variáveis, operadores JEXL, sandbox | Exemplo real de expressão citado do SQL |
| 5 | Catalogar os endpoints de dados abertos (regime-regular) como fonte de carga | Tabela endpoint → tabela PF2 destino → frequência | Amostra via curl local ou fixture do repo |
| 6 | Mapear os fluxos do Simples (anexos, faixas, fator R, alíquotas efetivas) | Mapa anexo→faixa→atividade→fatorR no formato do PF2 | Cruzar com `faixas_simples_nacional` atual |
| 7 | Mapear o DANFSE (entrada XML NFS-e, validação, PDF, localidades) | Mapa XML→PDF com regras de totais e situação | Rodar teste Go do repo (go test ./...) |
| 8 | Comparar catálogos PF2 x Receita (NCM, CNAE, faixas, alíquotas) | Relatório de divergência (coluna a coluna) com contagens | Query de diff nos dois bancos |
| 9 | Definir contrato de dados canônico (colunas, tipos, vigência, source) | Schema-alvo por tabela com CHECKs e UNIQUE | Passa no `validar_catalogos_tributarios` estendido |
| 10 | Registrar decisões (ADR) e riscos; congelar escopo por fase | ADR aprovado pelo dono; lista de riscos com mitigação | Documento versionado no repo |

# FASE B — Banco de dados: catálogos oficiais (etapas 11–25)
Toda escrita = migration idempotente. Nenhuma exclusão de coluna/tabela existente sem aval.

| # | Etapa | Checklist de conclusão | Teste de validação |
|---|-------|------------------------|--------------------|
| 11 | Criar migration de **CST/cClassTrib** (CBS/IBS e IS) | Tabelas `csts`, `classificacoes_tributarias` com PK, FK e vigência | pgTAP: PK/FK/vigência; carga de fixture |
| 12 | Criar tabela **NBS** (serviços) com código 9 dígitos e vigência | Schema + índice de busca por prefixo | pgTAP + consulta por prefixo |
| 13 | Criar tabela **tratamentos_tributarios** (expressões) espelhando `TRATAMENTO_TRIBUTARIO` | Colunas de expressão + flags + vigência; CHECK de sintaxe básica | `validar_catalogos_tributarios` inclui expressões |
| 14 | Criar **aliquotas_referencia** (União/UF/município) com vigência | Dados por ente + período; FK tributo | pgTAP + query por UF/data |
| 15 | Criar **fundamentacoes_legais** e vínculo classificação→fundamentação | Tabela + FK; CHECK formato | pgTAP |
| 16 | Criar **ncm_aplicavel/nbs_aplicavel** (vínculo NCM/NBS ↔ classificação) | Tabelas de vínculo com vigência e exceções | pgTAP + caso NCM inexistente falha |
| 17 | Criar **redutores_compra_governamental** e **transferencias_cbs/ibs** | Dados oficiais carregados com vigência | pgTAP + exemplo de cálculo |
| 18 | Criar tabelas **anexos** e **atividades_simples** (fator R) | Dados dos anexos I–V por atividade; vigência | pgTAP + consulta por CNAE |
| 19 | Estender **faixas_simples_nacional** com colunas de repartição IBS/CBS por anexo/ano | Colunas novas com default seguro; dados oficiais | pgTAP + cross-check com alíquotas oficiais |
| 20 | Criar **aliquotas_efetivas_simples** (destino PGDAS-D/MDD) | Tabela vazia com PK (empresa, competência) + status | pgTAP: aceita 0 linhas sem quebrar |
| 21 | Carregar **catálogos base** (UF, municípios IBGE, unidade_medida, tributo) | Dados com source='receita_federal'; contagem conferida | Query de contagem vs fonte oficial |
| 22 | Carregar **CST/cClassTrib/NBS/NCM aplicáveis** em massa | Carga via script/seed idempotente, em lote | Contagem e diff contra fixture |
| 23 | Carregar **tratamentos tributários** e **alíquotas de referência** | Execução das expressões em banco de teste | Query amostra + parse JEXL |
| 24 | Carregar **fundamentações, redutores, transferências** | Dados conferidos com vigência | pgTAP |
| 25 | Atualizar `validar_catalogos_tributarios` + invariants p/ novas tabelas | Função cobre todas as novas tabelas; contrato único detalhado | pgTAP + `run_integrity_cycle` sem warning |

# FASE C — Motor de cálculo (etapas 26–40)
| # | Etapa | Checklist de conclusão | Teste de validação |
|---|-------|------------------------|--------------------|
| 26 | Extrair alíquotas CBS/IBS/IS do front p/ catálogo (remover `CBS_ALVO`/`IBS_ALVO`/`IS_ALIQUOTAS` hardcoded) | Front lê de catálogo com fallback por `data_base` | Teste unitário: mesma saída do valor antigo |
| 27 | Implementar **resolução de tratamento por expressão** (espelho JEXL em TS) | Parser/avaliador limitado a operações aritméticas e vars permitidas | Testes de expressões oficiais amostra |
| 28 | Implementar **resolução de alíquota** (própria/referência/uniforme, UF/município) | Função `resolverAliquota(data, uf, municipio, tributo)` | Testes por ente e período |
| 29 | Implementar **reduções de alíquota** (percentual de redução por classificação) | Aplica redução + alíquota efetiva; memória de cálculo | Teste: educação 60%, cesta básica 100% |
| 30 | Implementar **créditos IVA** (apropriação/adquirente, indicadores) | Cálculo de crédito com regras de manutenção/anulação | Teste com fornecedor e adquirente |
| 31 | Implementar **monofasia e diferimento** | Flags do tratamento; cálculo de tributo calculado vs devido | Teste cerveja (IS + base derivada) |
| 32 | Implementar **compras governamentais** e **redutores** | Aplica redutor por operação/ente | Teste com fixture oficial |
| 33 | Implementar **split payment simplificado** | Decomposição do valor da operação | Teste de soma fechada |
| 34 | Implementar **cálculo do Imposto Seletivo** (ad valorem + específico) | Tabelas AD_VALOREM/AD_REM por produto/serviço | Teste bebida alcoólica e fumo |
| 35 | Integrar **base de cálculo unificada** (NF-e/NFC-e e NFS-e) no motor | Função `baseCalculoUnificada` espelhando o contrato oficial | Testes de bem e serviço (exemplos docs) |
| 36 | **Estender** a calculadora Simples existente com **catálogo de atividades/anexo** (o fator R e a troca III/V já existem em `simples-nacional.ts:62-80`; falta resolver anexo por CNAE) | Resolução de anexo por atividade; mantém fator R atual | Teste com atividade anexo III |
| 37 | **Integrar alíquotas efetivas PGDAS-D** (leitura de `aliquotas_efetivas_simples`), reutilizando `calcularAliquotaEfetiva` existente (`simples-nacional.ts:29-37`) | Sem dado → fallback tabela pré-carregada com aviso | Teste com e sem alíquota efetiva |
| 38 | Criar **memória de cálculo** oficial (rastreabilidade) | Saída com parâmetros, expressões e fontes usadas | Teste: cada número rastreável |
| 39 | **Observabilidade** (códigos REG-/VSN- com descrição) | Catálogo de erros por item; endpoint de descrição | Teste de 1 código REG-011 e 1 VSN- |
| 40 | Regressão: comparar resultado do motor PF2 vs calculadora oficial (mesma operação) | Relatório de convergência por amostra | Script de diff de JSONs de cálculo |

# FASE D — Edge functions e API (etapas 41–55)
| # | Etapa | Checklist de conclusão | Teste de validação |
|---|-------|------------------------|--------------------|
| 41 | Nova edge `calcular-regime-geral` (POST /regime-geral) com contrato oficial | Valida zod, observabilidade, auth guard, CORS | Deno test + curl com fixture |
| 42 | Nova edge `calcular-simples-nacional` (observabilidade + não assistido) | Contrato oficial; erros VSN- | Deno test |
| 43 | Nova edge `base-calculo-unificada` (NF-e/NFC-e/NFS-e) | Espelha `BaseCalculoController` | Deno test |
| 44 | Edge `dados-abertos-rtc` (proxy/consulta dos dados abertos) | Rotas UF/municípios/CST/cClassTrib/NCM/NBS/alíquotas | Deno test + smoke |
| 45 | Edge **DANFSE** (`gerar-danfse`): XML NFS-e → PDF | Integra o binário Go (wasm ou serviço); validação e sanitização | Teste Go + teste de integração |
| 46 | Edge de **validação XML** contra leiaute (grupo/nota) | Regras de conformidade por modelo | Testes de fixture |
| 47 | Edge de **exportação SPED** estendida p/ campos CBS/IBS novos | `exportar-sped-contribuicoes` ganha campos do RTC | Golden file atualizado |
| 48 | **DRE tributária** integrada com os novos tributos (IBS/CBS/IS) | `gerar-dre-tributaria` soma tributos por competência | Teste de fechamento |
| 49 | **Fechamento mensal** integrado com catálogo e alíquotas oficiais | `executar-fechamento-tributario` sem hardcode | Teste E2E de competência |
| 50 | **Alertas tributários** com regras novas (crédito, monofasia, IS) | `gerar-alertas-tributarios` cobre novos tratamentos | Testes unitários |
| 51 | **Consulta rápida fiscal** ganha recursos `cst`, `cClassTrib`, `nbs`, `simples-anexo` | `consulta-tributaria` novos recursos + schemas | Deno test |
| 52 | **Copilot tributário** com contexto dos novos catálogos | RAG consulta CST/tratamento/NBS | Teste de resposta |
| 53 | Rate-limit, auth e RLS das novas rotas/tabelas | Nada de escrita sem RLS; auditoria | SQL: policies existem e passam no RLS multi-empresa |
| 54 | OpenAPI/Swagger das novas edges | `swagger` cobre contratos | Lint + smoke |
| 55 | `functions-deploy` e `ci.yml` incluem novas edges no build/teste | CI green com novas functions | Rodar CI |

# FASE E — Frontend (etapas 56–70)
| # | Etapa | Checklist de conclusão | Teste de validação |
|---|-------|------------------------|--------------------|
| 56 | API client `rtc` no front (tipos dos contratos oficiais) | `src/lib/rtc/*` com tipos e chamadas | typecheck |
| 57 | **Calculadora Tributária** passa a usar catálogo (alíquotas dinâmicas) | Sem constantes hardcoded de alíquota | Teste de UI + diff de resultado |
| 58 | Painel **CST/cClassTrib** por empresa (consulta e exibição) | UI de consulta com vigência | E2E |
| 59 | Painel **NBS** e tratamentos (busca por serviço) | UI de busca com detalhe de tratamento | E2E |
| 60 | Seletor de **alíquotas de referência** por UF/município/período | UI com data base | E2E |
| 61 | **Simulador de Imposto Seletivo** (ad valorem/específico) | UI com memória de cálculo | E2E |
| 62 | **Simulador de compras governamentais** (redutores) | UI com seleção de ente | E2E |
| 63 | **Simples**: exibir catálogo de anexo por atividade + alíquota efetiva PGDAS-D na calculadora (fator R/anexo III-V já exibidos) | UI integrada ao motor estendido | E2E |
| 64 | **Dashboard Reforma Tributária** com dados oficiais (alíquotas vigentes) | KPIs derivados do catálogo | E2E |
| 65 | **DANFSE**: botão de geração na NFS-e | Fluxo XML→PDF com download | E2E + validação PDF |
| 66 | **ConciliacaoTributariaPanel** com IBS/CBS/IS novos | Painel concilia os novos tributos | E2E |
| 67 | **ComparativoRegimesPanel** compara regime-geral vs Simples com dados oficiais | Saída consistente com motor | E2E |
| 68 | **ExportacaoSPED/ImportacaoXML** atualizados para leiautes 2027 | Fluxos novos funcionais | E2E |
| 69 | Empty/loading/erro em todas as novas telas | Estados completos, sem TELA pela metade | Revisão + E2E |
| 70 | Acessibilidade e i18n pt-BR nas novas telas | ARIA/labels/tradução | Auditoria a11y |

# FASE F — Simples Nacional e PGDAS-D (etapas 71–80)
| # | Etapa | Checklist de conclusão | Teste de validação |
|---|-------|------------------------|--------------------|
| 71 | Compatibilizar `faixas_simples_nacional` com dados oficiais por anexo/ano | Dados idênticos à fonte | Query diff |
| 72 | Atividades do Simples (catálogo de atividades com anexo/fator R) | Tabela carregada e consultável por data | pgTAP |
| 73 | Resolução de anexo por catálogo de atividades na calculadora (complementa o fator R existente) | Motor usa catálogo de atividades | Teste |
| 74 | Regime de apuração IBS/CBS no Simples (regular vs SN) | Motor decide `tpRegimeIBSCBS` | Teste |
| 75 | Alíquotas efetivas: schema + ingestão (preparo PGDAS-D) | `aliquotas_efetivas_simples` pronta | pgTAP |
| 76 | Job de ingestão MDD/PGDAS-D (quando publicado) | Cron com idempotência e alerta de falha | Simulação de run |
| 77 | Endpoint de consulta de alíquota efetiva (Receita Integra, futuro) | Preparo do contrato | Teste de contrato |
| 78 | Dashboard Simples: alíquota efetiva vs nominal | UI informa a efetiva quando houver | E2E |
| 79 | Alertas: sublimite estadual e mudança de anexo | Regras novas em `gerar-alertas-tributarios` | Teste |
| 80 | Documentar limitações (PGDAS-D não substituído) | Seção em docs do módulo | Revisão |

# FASE G — DANFSE e documentos fiscais (etapas 81–90)
| # | Etapa | Checklist de conclusão | Teste de validação |
|---|-------|------------------------|--------------------|
| 81 | Integrar binário/wasm do gerador DANFSE no PF2 | Build reproduzível; hash do binário | Teste de integração |
| 82 | Sanitização e validação do XML (limites e `&`) | Proteção igual à oficial | Testes de entrada malformada |
| 83 | Renderização do PDF com os totais corretos | PDF gerado com totais de tributos | Teste Go + inspeção PDF |
| 84 | Catálogo de localidades IBGE embutido e sincronizado | Municípios por UF | Teste |
| 85 | Endpoint `/api/danfse` no PF2 com auth e rate-limit | Contrato igual ao oficial | E2E |
| 86 | Health checks e OTel opt-in | `/health/*` ok | Smoke |
| 87 | Logs estruturados sem dados fiscais | Auditoria do log | Revisão de log |
| 88 | Armazenamento do PDF (storage Supabase) com RLS | PDF persistido e acessível ao dono | E2E |
| 89 | Fallback para NFS-e sem DANFSE (graceful) | Fluxo sem PDF continua íntegro | E2E |
| 90 | Regressão: NFS-e sem RTC continua funcionando | Nenhum fluxo antigo quebrado | Suíte financeira |

# FASE H — Endurecimento, validação e rollout (etapas 91–100)
| # | Etapa | Checklist de conclusão | Teste de validação |
|---|-------|------------------------|--------------------|
| 91 | RLS e policies de todas as novas tabelas (multi-empresa) | Guard RLS passa; `has_role` admin para escrita | pgTAP + RLS multi-empresa |
| 92 | Índices das novas tabelas (por vigência, UF, prefixo NCM/NBS) | Plano de query sem seq scan relevante | `EXPLAIN` + schema-drift |
| 93 | Migrations reconciliadas com prod (paridade 100%) | `schema-drift` green | Workflow |
| 94 | Fuzzing e testes de carga das novas edges | Sem crash em entradas hostis | Fuzzer + load-tester |
| 95 | Auditoria de segredos (nenhum em código) | `gitleaks` green | CI |
| 96 | Atualizar `docs/FUNCIONALIDADES_*` e `PLANO_*` | Docs refletem o novo módulo | Revisão |
| 97 | Relatório `prod-readiness` revalidado | Itens novos marcados OK | Workflow + revisão |
| 98 | Deploy por fases (catálogos → motor → edges → UI → DANFSE) | Cada fase mergeada e CI verde | Workflow de deploy |
| 99 | Validação em produção (logs, queries, request real) | Evidência de cada fluxo novo | Query/log real |
| 100 | Fechamento: atualizar roadmap, "Próximos passos", handoff | Nada de TODO/WIP; docs finais | Revisão final |

---
**Sequência de PRs (uma tarefa = uma branch = uma PR, prefixo `claude/<tipo>-<slug>-<AAMMDD-HHMM>`):**
- PR 1: Fase A (docs/ADR) — chore
- PR 2: Fase B migrations (11–25) — DDL → **regra 8** (decisão do dono)
- PR 3: Fase C motor (26–40) — feat
- PR 4: Fase D edges (41–55) — feat (CI/workflows → regra 8 quando tocar ci.yml)
- PR 5: Fase E front (56–70) — feat
- PR 6: Fase F Simples (71–80) — feat
- PR 7: Fase G DANFSE (81–90) — feat (Dockerfile/infra → regra 8)
- PR 8: Fase H endurecimento/rollout (91–100) — chore/infra

**Regras do Fluxo Git aplicáveis:** nunca commitar em main; só escrever em branch criada na sessão; listar PRs abertas antes de começar (overlap → parar e avisar); merges de DDL/CI/workflows/infra exigem ok do dono (regra 8); squash-merge e apagar branch nas demais; reportar link da PR + estado no fim.

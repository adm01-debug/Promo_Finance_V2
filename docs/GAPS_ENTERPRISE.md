# 🌐 Análise de Gaps Enterprise — Promo Finance

> Comparativo do **Promo Finance** com benchmarks **enterprise de classe mundial** no segmento ERP financeiro: **SAP S/4HANA Finance, Oracle NetSuite, Totvs Protheus, Omie, Conta Azul Pro, QuickBooks Enterprise, Sage Intacct, Workday Financial Management**.

**Data da análise:** 2026-04-21
**Baseline:** P1 → P15 · 1.012/1.012 testes ✅ · 0 erros TS · 94.6% UI coverage
**Metodologia:** análise de 12 domínios funcionais com classificação de prioridade e esforço.

---

## 📊 Sumário executivo

| Métrica | Valor |
|---|---:|
| Domínios analisados | **12** |
| Gaps identificados | **71** |
| 🔴 Críticos (bloqueiam venda enterprise) | **27** |
| 🟡 Altos (paridade de mercado) | **44** |
| Cobertura enterprise atual | **~26%** |
| Esforço estimado para paridade | **~12 meses (P16 → P24)** |

**Legenda:**
- **Prioridade:** 🔴 Crítico · 🟡 Alto · 🟢 Médio · 🔵 Diferencial
- **Esforço:** S (≤1 sprint) · M (1-2 meses) · L (3-6 meses) · XL (>6 meses)

---

## 1. 🏢 Multi-empresa & Consolidação Contábil

| Gap | Prioridade | Esforço | Concorrente referência |
|---|:-:|:-:|---|
| Consolidação contábil multi-empresa (eliminação intercompany) | 🔴 | L | SAP, NetSuite, Totvs |
| Conversão multi-moeda automática (USD/EUR + variação cambial) | 🔴 | M | NetSuite, Sage Intacct |
| Plano de contas unificado vs por empresa (toggle) | 🟡 | M | NetSuite |
| Fechamento contábil centralizado matriz/filial | 🟡 | M | SAP, Totvs |

**Status atual:** ✅ Multi-tenant por `empresa_id` com RLS, mas sem consolidação financeira real.

---

## 2. 📒 Contabilidade plena ⚠️ MAIOR GAP

| Gap | Prioridade | Esforço | Concorrente |
|---|:-:|:-:|---|
| Contabilidade dupla automática (débito/crédito em todo lançamento) | 🔴 | XL | Todos |
| Razão geral, livro diário, balancete de verificação | 🔴 | L | Todos |
| **SPED ECD** (Escrituração Contábil Digital) | 🔴 | L | Totvs, Omie, Conta Azul |
| **SPED ECF** (Escrituração Contábil Fiscal) | 🔴 | L | Totvs, Omie |
| DRE contábil (diferente da DRE Tributária atual) | 🔴 | M | Todos |
| Balanço Patrimonial (ativo/passivo/PL) | 🔴 | M | Todos |
| DFC (Demonstração de Fluxo de Caixa) método indireto | 🔴 | M | Todos |
| DMPL/DLPA (mutações do patrimônio líquido) | 🟡 | S | Todos |

**Status atual:** ✅ Plano de contas + centros de custo + DRE Tributária. ❌ Sem contabilidade dupla automática nem SPED contábil.

---

## 3. 📦 Estoque, Custos & Cadeia de Suprimentos

| Gap | Prioridade | Esforço | Concorrente |
|---|:-:|:-:|---|
| Gestão de estoque própria (não depender 100% do Bling) | 🔴 | L | Todos |
| Custeio (PEPS, UEPS, médio ponderado) | 🔴 | M | Totvs, SAP |
| Inventário cíclico/rotativo | 🟡 | M | Totvs, NetSuite |
| Ordem de Compra (PO) com workflow de aprovação | 🟡 | M | NetSuite, SAP |
| Recebimento de mercadorias (NFe entrada → estoque automático) | 🟡 | M | Todos |
| Cotação de fornecedores (RFQ) | 🟢 | S | NetSuite, SAP |

**Status atual:** ⚠️ Delegado ao Bling ERP via integração.

---

## 4. 👥 Folha de Pagamento & RH

| Gap | Prioridade | Esforço | Concorrente |
|---|:-:|:-:|---|
| Folha de pagamento completa (CLT, INSS, FGTS, IRRF) | 🔴 | XL | Totvs Senior, Omie |
| **eSocial** (envio S-1000 a S-5013) | 🔴 | L | Totvs, Senior, Domínio |
| DCTFWeb / DARF folha | 🔴 | M | Totvs |
| Férias, 13º salário, rescisões automatizadas | 🔴 | L | Todos |
| Holerite digital (portal funcionário) | 🟡 | S | Todos |
| Ponto eletrônico integrado | 🟢 | M | Senior, Totvs |

**Status atual:** ✅ Apenas aba "Folha" no Histórico Financeiro Tributário (valores agregados, sem cálculo).

---

## 5. 🛒 CRM & Vendas avançado

| Gap | Prioridade | Esforço | Concorrente |
|---|:-:|:-:|---|
| Pipeline de vendas próprio (não depender 100% do Bitrix24) | 🔴 | L | NetSuite, SAP |
| Cotação/Proposta comercial → conversão em pedido | 🟡 | M | NetSuite |
| Catálogo de produtos com tabela de preços por cliente | 🟡 | M | Todos |
| Comissionamento de vendedores (regras complexas) | 🟡 | M | Totvs, NetSuite |
| CPQ (Configure-Price-Quote) | 🟢 | L | SAP CPQ, Salesforce |

**Status atual:** ✅ Cadastro de vendedores + integração Bitrix24.

---

## 6. 💼 Gestão de Projetos & Centros de Resultado

| Gap | Prioridade | Esforço | Concorrente |
|---|:-:|:-:|---|
| Project Accounting (orçado vs realizado por projeto) | 🟡 | M | NetSuite, SAP, Sage |
| Timesheet → faturamento por horas | 🟡 | M | NetSuite, Workday |
| Milestones / faturamento por entrega | 🟡 | M | NetSuite |
| Margem de contribuição por projeto | 🟡 | S | Sage Intacct |
| WIP (Work In Progress accounting) | 🟢 | M | SAP |

**Status atual:** ⚠️ `OrcamentoEvento` é caso pontual, sem framework de projeto.

---

## 7. 🏦 Tesouraria avançada

| Gap | Prioridade | Esforço | Concorrente |
|---|:-:|:-:|---|
| Aplicações financeiras (CDB, LCI, fundos) com marcação a mercado | 🔴 | M | Totvs Treasury, SAP TRM |
| Hedge cambial / derivativos | 🔴 | L | SAP TRM, NetSuite |
| Cash pooling intercompany | 🟡 | M | SAP |
| Conciliação automática de cartões (taxas adquirente) | 🟡 | M | Todos |
| Antecipação automática de recebíveis (FIDC) | 🟡 | M | Omie, Conta Azul |
| Política de crédito automatizada (limite por cliente) | 🟡 | S | NetSuite |

**Status atual:** ✅ Tesouraria básica + saldos consolidados + Pix Hub.

---

## 8. 📊 BI, Analytics & Data Warehouse

| Gap | Prioridade | Esforço | Concorrente |
|---|:-:|:-:|---|
| Cubo OLAP / drill-down ilimitado | 🟡 | L | SAP Analytics, NetSuite |
| Dashboards 100% customizáveis pelo usuário (além de drag&drop) | 🟡 | M | Sage Intacct, NetSuite |
| Construtor de relatórios visual (drag-and-drop fields) | 🔴 | L | NetSuite Saved Searches |
| Conector ODBC/REST para Power BI / Tableau / Looker | 🟡 | M | Todos |
| Data warehouse com histórico longo (>2 anos) | 🟡 | M | NetSuite, SAP |
| Forecasting com modelos ARIMA/Prophet (além de LLM) | 🟡 | M | SAP IBP |

**Status atual:** ✅ BI page + Recharts + insights IA (gemini-2.5-flash).

---

## 9. 🔐 Segurança Enterprise (compliance)

| Gap | Prioridade | Esforço | Concorrente |
|---|:-:|:-:|---|
| **SSO corporativo** (SAML 2.0, OIDC, Azure AD, Okta) | 🔴 | M | Todos enterprise |
| **SCIM 2.0** (provisionamento automático de usuários) | 🔴 | M | NetSuite, Workday |
| Permissões granulares por campo (field-level security) | 🔴 | L | SAP, NetSuite |
| Segregação de funções (SoD) — matriz de conflitos | 🟡 | M | SAP GRC |
| Certificação **SOC 2 Type II / ISO 27001** | 🟡 | XL | Todos enterprise |
| Data residency (escolher região de armazenamento) | 🟡 | L | NetSuite, Workday |
| Audit log imutável (write-once com hash blockchain) | 🟡 | M | SAP Audit Management |

**Status atual:** ✅ MFA TOTP, WebAuthn, RBAC 4 papéis, RLS hardenizada, audit_logs, IP/Geo restriction.

---

## 10. 🌐 Internacionalização & Multi-país

| Gap | Prioridade | Esforço | Concorrente |
|---|:-:|:-:|---|
| **i18n completo** (PT-BR/EN/ES) | 🔴 | M | Todos |
| Multi-moeda em todos os módulos (não só visualização) | 🟡 | L | NetSuite, SAP |
| Localizações fiscais não-BR (IVA México, VAT EU) | 🟡 | XL | NetSuite OneWorld, SAP |
| **IFRS reporting** (além de BR GAAP) | 🟡 | L | SAP, NetSuite |
| Timezone por usuário | 🟢 | S | Todos |

**Status atual:** ⚠️ Apenas pt-BR hardcoded.

---

## 11. 🔌 Plataforma & Extensibilidade

| Gap | Prioridade | Esforço | Concorrente |
|---|:-:|:-:|---|
| **API pública REST/GraphQL documentada** (OpenAPI 3.0) | 🔴 | M | Todos |
| Webhooks de saída configuráveis pelo cliente | 🔴 | M | Todos |
| App marketplace / plugins de terceiros | 🟡 | XL | NetSuite SuiteApp, Salesforce AppExchange |
| Workflow builder visual (no-code, Zapier-like interno) | 🟡 | L | NetSuite Workflow, SAP BTP |
| Custom fields por entidade (sem migração SQL) | 🟡 | M | NetSuite, Salesforce |
| Custom objects (criar tabelas via UI) | 🟡 | L | NetSuite SuiteBuilder |
| Sandbox environment separado de produção | 🟡 | L | Todos |

**Status atual:** ✅ 51 Edge Functions internas customizadas, mas sem API pública documentada.

---

## 12. 🛡️ Operações Enterprise (NOC/SRE)

| Gap | Prioridade | Esforço | Concorrente |
|---|:-:|:-:|---|
| **SLA contratual** com créditos (uptime 99.9%) | 🔴 | S | Todos enterprise |
| Disaster Recovery (RPO/RTO documentados) | 🟡 | M | Todos |
| Backup point-in-time pelo cliente (self-service restore) | 🟡 | M | NetSuite, Salesforce |
| Status page pública (status.promofinance.com) | 🟡 | S | Todos |
| On-call / PagerDuty integration | 🟡 | S | Todos |
| Tenant isolation físico (não só lógico via RLS) | 🟡 | XL | SAP HEC, Workday |

**Status atual:** ✅ `/admin/system-health` + SLO panel (p50/p95/p99) + cron monitoring + 6 jobs ativos.

---

## 📈 Sumário quantitativo por domínio

| Domínio | 🔴 Crítico | 🟡 Alto | 🟢 Médio | Total | Cobertura |
|---|:-:|:-:|:-:|:-:|---:|
| Contabilidade plena | 7 | 1 | 0 | **8** | ~10% |
| Folha & RH | 4 | 1 | 1 | **6** | ~5% |
| Estoque & Suprimentos | 2 | 3 | 1 | **6** | ~15% |
| Multi-empresa/Consolidação | 2 | 2 | 0 | **4** | ~30% |
| Tesouraria avançada | 2 | 4 | 0 | **6** | ~25% |
| Segurança Enterprise | 3 | 4 | 0 | **7** | ~50% |
| BI / Analytics | 1 | 5 | 0 | **6** | ~60% |
| Plataforma/API | 2 | 5 | 0 | **7** | ~20% |
| CRM / Vendas | 1 | 3 | 1 | **5** | ~40% |
| Projetos | 0 | 4 | 1 | **5** | ~10% |
| Internacionalização | 1 | 3 | 1 | **5** | ~5% |
| Operações Enterprise | 1 | 5 | 0 | **6** | ~50% |
| **TOTAL** | **27** | **44** | **5** | **71** | **~26%** |

---

## 🗺️ Posicionamento competitivo

```
                    Promo Finance vs Concorrentes (0-100)

Capacidade IA            ████████████████████░  95   🥇 LIDERANÇA absoluta
Reforma Tributária 2026  ████████████████████░  95   🥇 LIDERANÇA (vs Omie/Conta Azul)
UX/Design moderno        ███████████████████░░  92   🥇 LIDERANÇA
Observabilidade SRE      ██████████████████░░░  85   🥈 PARIDADE+ (vs Omie)
Financeiro core          ████████████████░░░░░  80   🥈 PARIDADE (Omie/Conta Azul)
Compliance Enterprise    ██████████░░░░░░░░░░░  50   🥉 PARCIAL (sem SOC2/SSO)
Tesouraria               █████████░░░░░░░░░░░░  45   🥉 ATRÁS (vs SAP TRM)
CRM/Vendas               ████████░░░░░░░░░░░░░  40   🥉 ATRÁS (vs Salesforce/NetSuite)
Multi-empresa real       ██████░░░░░░░░░░░░░░░  30   ❌ GAP (vs NetSuite/SAP)
Plataforma/API pública   ████░░░░░░░░░░░░░░░░░  20   ❌ GAP (vs NetSuite/SAP)
Estoque & Suprimentos    ███░░░░░░░░░░░░░░░░░░  15   ❌ GAP (delegado a Bling)
Projetos                 ██░░░░░░░░░░░░░░░░░░░  10   ❌ GAP (vs NetSuite SRP)
Contabilidade plena      ██░░░░░░░░░░░░░░░░░░░  10   ❌ GAP CRÍTICO (vs Totvs/SAP)
Multi-país/i18n          █░░░░░░░░░░░░░░░░░░░░   5   ❌ GAP (vs NetSuite OneWorld)
Folha & RH               █░░░░░░░░░░░░░░░░░░░░   5   ❌ GAP TOTAL (vs Totvs Senior)
```

---

## 🚀 Roadmap sugerido — P16 → P25

### 🔥 Fase 1 — Fundação Enterprise (P16 → P18 · 3 meses)
> *Habilita venda B2B média e remove bloqueios de TI corporativa.*

1. **SSO SAML 2.0 / OIDC** + integração Azure AD / Okta
2. **SCIM 2.0** para provisionamento automático
3. **API pública REST + OpenAPI 3.0** documentada + webhooks de saída
4. **i18n** completo (EN/ES) + multi-moeda na visualização
5. **Custom fields** por entidade (sem migração SQL)
6. **Status page pública** + SLA documentado 99.5%

### 📒 Fase 2 — Contabilidade & Fiscal (P19 → P21 · 4 meses)
> *Maior gap atual — habilita substituir Totvs/Domínio.*

7. **Contabilidade dupla automática** (toda transação gera lançamento contábil)
8. **SPED ECD + ECF** (Escrituração Contábil Digital + Fiscal)
9. **DRE contábil + Balanço Patrimonial + DFC** (método indireto)
10. **Consolidação multi-empresa** com eliminação intercompany
11. Conversão multi-moeda real com variação cambial registrada

### 🏭 Fase 3 — Operacional (P22 → P24 · 4 meses)
> *Completa stack ERP e elimina dependência do Bling.*

12. **Folha de pagamento** + eSocial (S-1000 a S-5013)
13. **Estoque próprio** + custeio (PEPS/UEPS/médio) + ordem de compra
14. **Project accounting** + timesheet + milestones
15. Pipeline de vendas próprio + comissionamento

### ✨ Fase 4 — Diferenciação (P25+)
> *Posiciona como alternativa premium ao NetSuite/SAP no Brasil.*

16. **Workflow builder visual** no-code
17. **App marketplace** + plugins de terceiros
18. **Hedge cambial** + tesouraria avançada (TRM)
19. **Tenant isolation físico** + **SOC 2 Type II** + **ISO 27001**
20. Sandbox environment self-service
21. Localizações fiscais não-BR (México, EU)

---

## 🎯 Conclusão executiva

**Posicionamento atual:** Promo Finance é **best-in-class para PMEs brasileiras com foco tributário e IA**, competindo de igual para igual com **Omie e Conta Azul Pro**, e **superando todos os concorrentes** em:
- 🥇 Capacidade de IA (Copilot SSE, EXPERT Agent com 15 tools, 12+ edges IA)
- 🥇 Preparação para Reforma Tributária 2026 (CBS/IBS/IS, split payment, cashback)
- 🥇 UX/Design (bento grid premium, animações, design system maduro)
- 🥇 Observabilidade (SLO p50/p95/p99 + Health Score + anomalias em tempo real)

**Para virar enterprise** (competir com Totvs Protheus, SAP S/4HANA Finance, Oracle NetSuite, Workday), precisa fechar **27 gaps críticos** em **3 frentes prioritárias**:

| Prioridade | Frente | Meses |
|:-:|---|:-:|
| 🥇 #1 | **Contabilidade plena + SPED ECD/ECF** | 4 |
| 🥈 #2 | **SSO + API pública + i18n + Custom fields** | 3 |
| 🥉 #3 | **Folha de pagamento + eSocial** | 4 |

**Estimativa total para paridade enterprise:** ~12 meses (P16 → P24).
**Cobertura atual:** ~26% das funcionalidades enterprise · **Cobertura projetada P24:** ~85%.

---

## 📎 Referências

- 📘 [FUNCIONALIDADES_SISTEMA.md](./FUNCIONALIDADES_SISTEMA.md) — inventário 100% das features atuais
- 🔍 [FUNCIONALIDADES_SEM_UI.md](./FUNCIONALIDADES_SEM_UI.md) — gaps de UI (94.6% coverage)
- 🛠️ `/admin/system-health` — observabilidade SLO/Anomalias/Cron
- 🧪 [Auditoria P15](../.lovable/memory/quality/auditoria-testes-p15.md) — baseline de qualidade

**Concorrentes analisados:**
SAP S/4HANA Finance · Oracle NetSuite (OneWorld + SuiteApp) · Totvs Protheus + Senior · Omie · Conta Azul Pro · QuickBooks Enterprise · Sage Intacct · Workday Financial Management · Salesforce (CRM/AppExchange) · Domínio Sistemas (contábil)

---

**Próximo passo recomendado:** aprovar **Fase 1 (P16-P18)** para destravar venda B2B média e remover bloqueios de TI corporativa nos próximos 3 meses.

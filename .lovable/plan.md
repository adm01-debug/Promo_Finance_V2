

## Plano — Análise de Gaps Enterprise (GAPS_ENTERPRISE.md)

Vou criar `docs/GAPS_ENTERPRISE.md` + `/mnt/documents/GAPS_ENTERPRISE.md` comparando o **Promo Finance** com benchmarks **enterprise de classe mundial** no segmento ERP financeiro brasileiro: **SAP S/4HANA Finance, Oracle NetSuite, Totvs Protheus, Omie, Conta Azul Pro, QuickBooks Enterprise, Sage Intacct, Workday Financial Management**.

### Metodologia
Análise comparativa em **12 domínios funcionais**, classificando cada gap por:
- **Prioridade:** 🔴 Crítico (bloqueia venda enterprise) · 🟡 Alto · 🟢 Médio · 🔵 Diferencial
- **Esforço:** S (≤1 sprint) · M (1-2 meses) · L (3-6 meses) · XL (>6 meses)
- **ROI:** receita/retenção/competitividade

### Estrutura do documento (12 domínios + roadmap)

**1. 🏢 Multi-empresa & Consolidação Contábil** *(gap real)*
- ❌ Consolidação contábil multi-empresa (eliminação de saldos intercompany)
- ❌ Conversão multi-moeda automática (USD/EUR + variação cambial)
- ❌ Plano de contas unificado vs por empresa
- ❌ Fechamento contábil centralizado matriz/filial
- ✅ Tem multi-tenant por `empresa_id`

**2. 📒 Contabilidade plena** *(maior gap)*
- ❌ Contabilidade dupla (débito/crédito automático em todo lançamento)
- ❌ Razão geral, livro diário, balancete de verificação
- ❌ Geração de SPED ECD (Escrituração Contábil Digital)
- ❌ Geração de SPED ECF (Escrituração Contábil Fiscal)
- ❌ DRE contábil (atual só tem DRE Tributária)
- ❌ Balanço Patrimonial (ativo/passivo/PL)
- ❌ DFC (Demonstração de Fluxo de Caixa) método indireto
- ❌ DMPL/DLPA (mutações do patrimônio líquido)
- ✅ Tem plano de contas + centros de custo

**3. 📦 Estoque, Custos & Cadeia de Suprimentos**
- ❌ Gestão de estoque própria (depende do Bling)
- ❌ Custeio (PEPS, UEPS, médio ponderado)
- ❌ Inventário cíclico/rotativo
- ❌ Ordem de compra (Purchase Order) com workflow
- ❌ Recebimento de mercadorias (NFe entrada → estoque automático)
- ❌ Cotação de fornecedores (RFQ)

**4. 👥 Folha de Pagamento & RH**
- ❌ Folha de pagamento completa (CLT, encargos, INSS, FGTS, IRRF)
- ❌ eSocial (envio S-1000 a S-5013)
- ❌ DCTFWeb / DARF folha
- ❌ Férias, 13º, rescisões automatizadas
- ❌ Holerite digital (portal funcionário)
- ❌ Ponto eletrônico integrado
- ✅ Tem aba "Folha" no Histórico Financeiro Tributário (apenas valores agregados)

**5. 🛒 CRM & Vendas avançado**
- ❌ Pipeline de vendas próprio (depende do Bitrix24)
- ❌ Cotação/Proposta comercial → conversão em pedido
- ❌ Catálogo de produtos/serviços com tabela de preços por cliente
- ❌ Comissionamento de vendedores (regras complexas)
- ❌ CPQ (Configure-Price-Quote)
- ✅ Tem cadastro de vendedores + integração Bitrix24

**6. 💼 Gestão de Projetos & Centros de Resultado**
- ❌ Project Accounting (orçado vs realizado por projeto)
- ❌ Timesheet → faturamento
- ❌ Milestones / faturamento por entrega
- ❌ Margem de contribuição por projeto
- ❌ WIP (Work In Progress)
- ✅ Tem `OrcamentoEvento` (caso pontual)

**7. 🏦 Tesouraria avançada**
- ❌ Gestão de aplicações financeiras (CDB, LCI, fundos)
- ❌ Hedge cambial / derivativos
- ❌ Cash pooling intercompany
- ❌ Conciliação automática de cartões (taxas adquirente)
- ❌ Antecipação automática de recebíveis (FIDC)
- ❌ Política de crédito automatizada (limite por cliente)
- ✅ Tem Tesouraria básica + saldos consolidados

**8. 📊 BI, Analytics & Data Warehouse**
- ❌ Cubo OLAP / drill-down ilimitado
- ❌ Dashboards customizáveis pelo usuário (atual só drag&drop)
- ❌ Construtor de relatórios visual (drag-and-drop fields)
- ❌ Exportação para Power BI / Tableau / Looker (conector ODBC/REST)
- ❌ Data warehouse com histórico longo (>2 anos)
- ❌ Forecasting com modelos ARIMA/Prophet (atual usa só LLM)
- ✅ Tem BI page + Recharts + insights IA

**9. 🔐 Segurança Enterprise (compliance)**
- ❌ SSO corporativo (SAML 2.0, OIDC, Azure AD, Okta)
- ❌ SCIM 2.0 (provisionamento automático de usuários)
- ❌ Permissões granulares por campo (field-level security)
- ❌ Segregação de funções (SoD) — matriz de conflitos
- ❌ Certificação SOC 2 Type II / ISO 27001
- ❌ Data residency (escolher região de armazenamento)
- ❌ Audit log imutável (write-once com hash blockchain)
- ✅ Tem MFA, WebAuthn, RBAC 4 papéis, RLS, audit_logs

**10. 🌐 Internacionalização & Multi-país**
- ❌ i18n completo (PT/EN/ES) — atual só pt-BR
- ❌ Multi-moeda em todos os módulos
- ❌ Localizações fiscais não-BR (IVA México, VAT EU)
- ❌ IFRS reporting (além de BR GAAP)
- ❌ Timezone por usuário

**11. 🔌 Plataforma & Extensibilidade**
- ❌ API pública REST/GraphQL documentada (OpenAPI 3.0)
- ❌ Webhooks de saída configuráveis pelo cliente
- ❌ App marketplace / plugins de terceiros
- ❌ Workflow builder visual (no-code, ex: Zapier-like interno)
- ❌ Custom fields por entidade (sem migração)
- ❌ Custom objects (criar tabelas via UI)
- ❌ Sandbox environment separado de produção
- ✅ Tem 51 edges customizadas (mas internas)

**12. 🛡️ Operações Enterprise (NOC/SRE)**
- ❌ SLA contratual com créditos (uptime 99.9%)
- ❌ Disaster Recovery (RPO/RTO documentados)
- ❌ Backup point-in-time pelo cliente (self-service restore)
- ❌ Status page pública (status.promofinance.com)
- ❌ On-call/PagerDuty integration
- ❌ Tenant isolation físico (não só lógico via RLS)
- ✅ Tem `/admin/system-health` + SLO panel + cron monitoring

### Sumário quantitativo de gaps

| Domínio | Gaps críticos 🔴 | Gaps altos 🟡 | Total | Cobertura atual |
|---|---:|---:|---:|---:|
| Contabilidade plena | 7 | 1 | 8 | ~10% |
| Folha & RH | 4 | 2 | 6 | ~5% |
| Estoque & Suprimentos | 3 | 3 | 6 | ~15% |
| Multi-empresa/Consolidação | 2 | 2 | 4 | ~30% |
| Tesouraria avançada | 2 | 4 | 6 | ~25% |
| Segurança Enterprise | 3 | 4 | 7 | ~50% |
| BI / Analytics | 1 | 5 | 6 | ~60% |
| Plataforma/API | 2 | 5 | 7 | ~20% |
| CRM/Vendas | 1 | 4 | 5 | ~40% |
| Projetos | 0 | 5 | 5 | ~10% |
| Internacionalização | 1 | 4 | 5 | ~5% |
| Operações Enterprise | 1 | 5 | 6 | ~50% |
| **TOTAL** | **27** | **44** | **71** | **~26%** |

### Roadmap sugerido (P16 → P25)

**Fase 1 — Fundação Enterprise (P16-P18, 3 meses):**
1. SSO SAML/OIDC + SCIM
2. API pública REST + OpenAPI 3.0 + webhooks de saída
3. i18n EN/ES + multi-moeda
4. Custom fields por entidade
5. Status page + SLA documentado

**Fase 2 — Contabilidade & Fiscal (P19-P21, 4 meses):**
6. Contabilidade dupla automática
7. SPED ECD + ECF
8. DRE contábil + Balanço + DFC
9. Consolidação multi-empresa com eliminação intercompany

**Fase 3 — Operacional (P22-P24, 4 meses):**
10. Folha de pagamento + eSocial
11. Estoque + custeio + ordem de compra
12. Project accounting + timesheet

**Fase 4 — Diferenciação (P25+):**
13. Workflow builder visual
14. App marketplace
15. Hedge cambial + tesouraria avançada
16. Tenant isolation físico + SOC 2 Type II

### Posicionamento competitivo (matriz)

```
                    Promo Finance vs Concorrentes

Capacidade IA          ████████████████████░  Promo: LIDERANÇA (vs todos)
Reforma Tributária 2026 ███████████████████░  Promo: LIDERANÇA (vs Omie/Conta Azul)
UX/Design moderno      ████████████████████░  Promo: LIDERANÇA
Financeiro core        ████████████████░░░░░  Promo: PARIDADE (Omie/Conta Azul)
Contabilidade plena    ███░░░░░░░░░░░░░░░░░░  Promo: ATRÁS (Totvs/SAP/NetSuite)
Folha & RH             █░░░░░░░░░░░░░░░░░░░░  Promo: GAP TOTAL (Totvs/Senior)
Estoque & Cadeia       ████░░░░░░░░░░░░░░░░░  Promo: ATRÁS (delegado a Bling)
Plataforma/API         ████░░░░░░░░░░░░░░░░░  Promo: ATRÁS (NetSuite/SAP)
Multi-país/i18n        █░░░░░░░░░░░░░░░░░░░░  Promo: GAP (NetSuite/SAP)
Compliance Enterprise  ██████████░░░░░░░░░░░  Promo: PARCIAL (sem SOC2)
```

### Conclusão

**Posicionamento atual:** Promo Finance é **best-in-class para PMEs brasileiras com foco tributário/IA**, competindo de igual para igual com Omie e Conta Azul, e **superando todos em IA e Reforma Tributária 2026**. 

**Para virar enterprise** (competir com Totvs/SAP/NetSuite), precisa fechar **27 gaps críticos** em **3 frentes prioritárias**: Contabilidade plena, Folha de pagamento e Plataforma/API. Estimativa: **~12 meses de roadmap (P16→P24)** para atingir paridade enterprise.

### Formato

Tabelas Markdown, badges 🔴🟡🟢🔵, diagrama ASCII de posicionamento, estimativas S/M/L/XL, ROI estimado por gap. Footer com referências aos concorrentes analisados.

### Entrega

Após gerar, emito `<lov-artifact>` para download. Sincroniza no GitHub via `docs/`.


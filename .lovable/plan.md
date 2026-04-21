

## Plano — Documento Executivo de Funcionalidades (FUNCIONALIDADES_SISTEMA.md)

Vou criar um documento `.md` exaustivo e categorizado mapeando **100% das funcionalidades** do Promo Finance, com base na análise completa do codebase atual (54 páginas, 51 edge functions, 130+ tabelas, 130+ hooks, 60+ pastas de componentes, P1→P15).

### Localização
- `/mnt/documents/FUNCIONALIDADES_SISTEMA.md` (download imediato)
- `docs/FUNCIONALIDADES_SISTEMA.md` (versionado no GitHub via sync bidirecional)

### Estrutura do documento (15 seções)

**1. Visão geral & arquitetura**
Stack (React 18 + Vite + TS + Lovable Cloud), 4 camadas (apresentação/domínio/dados/backend), RBAC 4 papéis, multi-empresa.

**2. Autenticação & segurança**
Login/signup, MFA TOTP, WebAuthn biométrico, recuperação senha, HIBP, account lockout exponencial, IP/Geo restriction, known devices, sessões ativas, audit logs, rate limiting, XSS sanitization.

**3. Financeiro core**
Contas a pagar (cadastro, agendamento, recorrência, anexos), Contas a receber (régua cobrança, scoring), Boletos (emissão, registro, código de barras), Pix Hub (templates, QR, split), Tesouraria, Movimentações, Transferências, Categorias, Plano de contas, Centros de custo, Pagamentos recorrentes.

**4. Cobranças & inadimplência**
Régua automatizada (email/WhatsApp/SMS), acordos de parcelamento, protestos, negativações, fila de cobranças, histórico WhatsApp IA, scoring de clientes, inadimplência segmentada, simulador de antecipação, cashback.

**5. Conciliação bancária**
Extrato bancário, regras automáticas, conciliação IA (match), conciliações parciais, feedback IA, histórico, webhooks de extrato.

**6. Fluxo de caixa & dashboards**
Dashboard executivo (Bento grid premium), DashboardEmpresa, DashboardReceber, FluxoCaixa (cenários, Monte Carlo), Hero KPIs animados, Top clientes/centros custo, Status pie chart, Saldos por banco, Drag & drop layout, BI page.

**7. Tributário & Reforma 2026 (P1-P9)**
Decidir regime (cache 7d), Simulador (Simples/Presumido/Real), Apuração mensal/trimestral, IRPJ/CSLL (LALUR, prejuízos), CBS/IBS/Imposto Seletivo, Split payment, Retenções de fonte, Créditos tributários, PER/DCOMP, DARFs, Incentivos fiscais, Regimes especiais, 9 estratégias de elisão paralelas, Conformidade fiscal validator, Auditoria tributária, Importação XML NFe, Exportação SPED Contribuições, DRE Tributária, Heatmap anual 12×8, Previsão IA 3 meses, Relatório anual PDF, Wizard onboarding tributário, Cronograma transição, Glossário, Benchmark setorial, Comparativo regimes, Cashback simulador, Obrigações acessórias.

**8. NFe & SEFAZ**
Emissão NFe, Cancelamento, Contingência, Alertas rejeição, SEFAZ Monitor/Analytics, OCR de notas fiscais (P11), Comprovante OCR.

**9. Aprovações & workflow**
Solicitações por alçada (`valor_minimo_aprovacao`), workflow multi-aprovador, observadores, notificações.

**10. Integrações**
Bling ERP v3 (resiliência exponencial), ASAAS (boletos/Pix/cartão), Bitrix24 CRM (sync + webhooks), Open Finance (saldos/extratos), CNPJa lookup, Resend (emails), WhatsApp IA proativo, Proxy Supabase externo (clientes/fornecedores), Assinatura digital, Portal cliente (token), Convite contador (read-only).

**11. IA & assistentes (P11→P14)**
EXPERT Agent (15 ações), Copilot Tributário, Copilot Global SSE (4 tools), Análise preditiva ML, Categorização despesa IA, Conciliação IA, Análise fluxo IA, Insights relatório, Previsão tributária IA, Resumo executivo semanal IA, OCR NF IA, Recomendações de metas IA.

**12. Inteligência operacional (P10-P13)**
Health Score Operacional, Detector anomalias 5 detectores (cron 30min), Centro de Ações Inteligentes (top 5 cruzando 5 fontes), Alertas preditivos, Push notifications (VAPID + trigger crítico), Real-time alertas, Quick create, Command palette, Recent items, Favoritos.

**13. Compliance & LGPD (P12)**
Centro Privacidade LGPD (acesso/portabilidade/exclusão/retificação/anonimização), Auditoria compliance, Auditoria financeira/tributária, Audit logs page, Conformidade fiscal.

**14. Observabilidade & admin (P13-P15)**
/admin/system-health (5 abas: Edge Health, Telemetry, Anomalias, Automações, SLO), 6 cron jobs P13, SLO panel (p50/p95/p99 + uptime + 30d), Edge function logs, Frontend error logs, Query telemetry, Rate limit dashboard, Webhooks log, RLS hardening (4 críticas P15).

**15. UX & qualidade**
Onboarding tour (8 passos react-joyride), PWA install prompt, Offline sync, Network status, Skeletons, ErrorBoundary, A11y WCAG AA, Keyboard shortcuts, Swipe back, Confetti, Sound feedback, Theme dark/light, Premium aesthetic (glassmorphism), Validators BR (CPF/CNPJ/Pix), Export CSV/PDF, Importação CSV/Excel, Virtual lists, Versionamento, Duplicação, Filtros avançados/salvos, Bulk actions, Search debounce.

### Métricas finais
- Páginas: 54
- Edge Functions: 51
- Tabelas Supabase: 130+
- Hooks customizados: 130+
- Pastas de componentes: 60+
- Migrações SQL: 102
- Testes unitários: 1.012/1.012 (100% pass)
- Lotes evolutivos: P1→P15

### Formato
Cabeçalhos H2 por seção, tabelas Markdown (Funcionalidade | Descrição | Localização técnica | Status), badges de status (✅ Produção / 🧪 Beta / 🤖 IA), índice clicável no topo, diagrama Mermaid de arquitetura final, footer com link para `/admin/system-health` e GitHub.

### Entrega
Após gerar, emito `<lov-artifact>` para download imediato. O arquivo em `docs/` sincroniza automaticamente no GitHub via integração bidirecional do Lovable.


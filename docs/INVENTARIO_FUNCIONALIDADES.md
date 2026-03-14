# 📋 Inventário Completo de Funcionalidades e Ferramentas

## Sistema: Promo Finance (ERP Financeiro)
**Stack Principal:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (Lovable Cloud)

---

## 🔧 FERRAMENTAS E BIBLIOTECAS CORE

| Categoria | Ferramenta | Versão | Uso |
|-----------|------------|--------|-----|
| **Framework** | React | ^18.3.1 | UI Library |
| **Build Tool** | Vite | ^5.4.19 | Bundler/Dev Server |
| **Linguagem** | TypeScript | ^5.8.3 | Tipagem estática |
| **Estilos** | Tailwind CSS | ^3.4.17 | Utility-first CSS |
| **Backend** | Supabase | ^2.87.1 | BaaS (Database, Auth, Edge Functions) |
| **State Management** | TanStack React Query | ^5.83.0 | Server State + Cache |
| **Roteamento** | React Router DOM | ^6.30.1 | SPA Routing |
| **Formulários** | React Hook Form | ^7.61.1 | Formulários performáticos |
| **Validação** | Zod | ^3.25.76 | Schema validation |
| **Gráficos** | Recharts | ^2.15.4 | Charts e visualizações |
| **Animações** | Framer Motion | ^12.23.26 | Animações declarativas |
| **Datas** | date-fns | ^3.6.0 | Manipulação de datas |
| **Ícones** | Lucide React | ^0.462.0 | Ícones SVG |
| **Temas** | next-themes | ^0.3.0 | Dark/Light mode |
| **Toasts** | Sonner | ^1.7.4 | Notificações toast |
| **Confetti** | canvas-confetti | ^1.9.4 | Efeitos visuais de celebração |
| **Virtualização** | react-window | ^2.2.3 | Listas virtualizadas |
| **Drag & Drop** | @dnd-kit | ^6.3.1 | Drag and drop |
| **OTP Input** | input-otp | ^1.4.2 | Campos TOTP/OTP |
| **Carousel** | embla-carousel-react | ^8.6.0 | Carrosséis |
| **Resizable Panels** | react-resizable-panels | ^2.1.9 | Painéis redimensionáveis |
| **Drawer** | vaul | ^0.9.9 | Drawer mobile-first |
| **Command Palette** | cmdk | ^1.1.1 | Command menu |
| **Testes** | Vitest | ^4.0.16 | Unit testing |
| **Testes** | @testing-library/react | ^16.3.1 | Component testing |

---

## 🎨 COMPONENTES UI (Shadcn/UI + Radix)

| Componente | Biblioteca | Uso |
|------------|------------|-----|
| Accordion | @radix-ui/react-accordion | Expansíveis |
| Alert Dialog | @radix-ui/react-alert-dialog | Confirmações |
| Aspect Ratio | @radix-ui/react-aspect-ratio | Proporções |
| Avatar | @radix-ui/react-avatar | Avatares |
| Checkbox | @radix-ui/react-checkbox | Checkboxes |
| Collapsible | @radix-ui/react-collapsible | Colapsáveis |
| Context Menu | @radix-ui/react-context-menu | Menu de contexto |
| Dialog | @radix-ui/react-dialog | Modais |
| Dropdown Menu | @radix-ui/react-dropdown-menu | Menus dropdown |
| Hover Card | @radix-ui/react-hover-card | Cards hover |
| Label | @radix-ui/react-label | Labels acessíveis |
| Menubar | @radix-ui/react-menubar | Barra de menu |
| Navigation Menu | @radix-ui/react-navigation-menu | Navegação |
| Popover | @radix-ui/react-popover | Popovers |
| Progress | @radix-ui/react-progress | Barras de progresso |
| Radio Group | @radix-ui/react-radio-group | Radio buttons |
| Scroll Area | @radix-ui/react-scroll-area | Scroll customizado |
| Select | @radix-ui/react-select | Selects |
| Separator | @radix-ui/react-separator | Separadores |
| Slider | @radix-ui/react-slider | Sliders |
| Slot | @radix-ui/react-slot | Composição |
| Switch | @radix-ui/react-switch | Toggles |
| Tabs | @radix-ui/react-tabs | Abas |
| Toast | @radix-ui/react-toast | Toasts nativos |
| Toggle | @radix-ui/react-toggle | Toggles |
| Toggle Group | @radix-ui/react-toggle-group | Grupos toggle |
| Tooltip | @radix-ui/react-tooltip | Tooltips |

---

## 🔐 AUTENTICAÇÃO E SEGURANÇA

| Funcionalidade | Ferramenta/Implementação | Arquivo Principal |
|----------------|--------------------------|-------------------|
| Login/Registro | Supabase Auth | `src/pages/Auth.tsx` |
| Proteção de Rotas | ProtectedRoute Component | `src/components/auth/ProtectedRoute.tsx` |
| 2FA/TOTP | input-otp + custom logic | `src/components/auth/TwoFactorSetup.tsx` |
| Verificação 2FA | input-otp | `src/components/auth/TwoFactorVerify.tsx` |
| Bloqueio por IP | Supabase + API externa | `src/pages/Auth.tsx` (validateIp) |
| IPs Permitidos | Tabela `allowed_ips` | `src/components/configuracoes/SecuritySettings.tsx` |
| Reset de Senha com Aprovação | Tabela `password_reset_requests` | `src/components/aprovacoes/PasswordResetApprovals.tsx` |
| Logs de Login | Tabela `login_attempts` | `SecuritySettings.tsx` |
| Roles/Permissões | RBAC customizado | Funções SQL: `has_role()`, `has_any_role()` |
| RLS Policies | Row Level Security | Todas as tabelas |
| Audit Logs | Tabela `audit_logs` | `src/pages/AuditLogs.tsx` |

### Roles do Sistema
- `admin` - Acesso total
- `financeiro` - Operações financeiras
- `operacional` - Operações básicas
- `visualizador` - Apenas leitura

---

## 💰 MÓDULO FINANCEIRO

### Contas a Pagar
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| CRUD Contas | Supabase + React Query | `src/hooks/useFinancialData.ts` |
| Formulário | React Hook Form + Zod | `src/components/contas-pagar/ContaPagarForm.tsx` |
| Leitor Código Barras | Custom parser | `src/components/contas-pagar/LeitorCodigoBarras.tsx` |
| Categorização IA | Edge Function | `src/components/contas-pagar/CategorizacaoIABadge.tsx` |
| Registrar Pagamento | Dialog + Mutation | `src/components/contas-pagar/RegistrarPagamentoDialog.tsx` |
| Lista Otimizada | react-window (virtualização) | `src/pages/ContasPagar/components/List.tsx` |
| Filtros Avançados | Custom filters | `src/pages/ContasPagar/components/Filters.tsx` |

### Contas a Receber
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| CRUD Contas | Supabase + React Query | `src/hooks/useFinancialData.ts` |
| Formulário | React Hook Form + Zod | `src/components/contas-receber/ContaReceberForm.tsx` |
| Registrar Recebimento | Dialog + Mutation | `src/components/contas-receber/RegistrarRecebimentoDialog.tsx` |
| Régua de Cobrança | Custom Hook | `src/hooks/useReguaCobranca.ts` |
| Etapas de Cobrança | Enum DB | `etapa_cobranca` (preventiva, amigavel, etc) |

### Boletos
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| Geração de Boletos | Custom + Supabase | `src/hooks/useBoletos.ts` |
| Parser Código Barras | Algoritmo customizado | `src/lib/barcode-parser.ts` |
| Linha Digitável | Gerador customizado | `src/hooks/useBoletos.ts` |

### Fluxo de Caixa
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| Projeção de Caixa | Custom calculations | `src/hooks/useFluxoCaixa.ts` |
| Cenários | Otimista/Pessimista/Realista | `src/lib/cashflow-scenarios.ts` |
| Simulação Monte Carlo | Algoritmo estatístico | `src/components/fluxo-caixa/SimulacaoMonteCarlo.tsx` |
| Gráfico Cenários | Recharts | `src/components/fluxo-caixa/GraficoCenarios.tsx` |
| Alertas de Ruptura | Custom logic | `src/components/fluxo-caixa/AlertasRuptura.tsx` |
| Insights IA | Edge Function | `src/components/fluxo-caixa/InsightsFluxoIA.tsx` |
| Indicador Cobertura | Custom component | `src/components/fluxo-caixa/IndicadorCobertura.tsx` |

### Pagamentos Recorrentes
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| CRUD Recorrências | Supabase + React Query | `src/hooks/usePagamentosRecorrentes.ts` |
| Geração Automática | Função DB `gerar_contas_recorrentes()` | PostgreSQL |
| Cálculo Próxima Data | Função DB `calcular_proxima_geracao()` | PostgreSQL |

---

## 🧾 NOTAS FISCAIS (NFe)

| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| Emissão NFe | Simulador SEFAZ | `src/lib/sefaz-simulator.ts` |
| Cancelamento | Custom component | `src/components/nfe/CancelamentoNFe.tsx` |
| Inutilização | Custom component | `src/components/nfe/InutilizacaoNFe.tsx` |
| Contingência | Auto-switch logic | `src/components/nfe/ContingenciaNFe.tsx` |
| Config Contingência | Custom component | `src/components/nfe/AutoContingenciaConfig.tsx` |
| Monitor SEFAZ | Status checker | `src/components/nfe/SefazMonitor.tsx` |
| Analytics SEFAZ | Métricas | `src/components/nfe/SefazAnalytics.tsx` |
| Alertas Rejeição | Monitor | `src/components/nfe/AlertasRejeicao.tsx` |
| Histórico Eventos | Logger | `src/lib/sefaz-event-logger.ts` |
| Monitor Rejeições | Custom lib | `src/lib/sefaz-rejection-monitor.ts` |

---

## 🤖 INTELIGÊNCIA ARTIFICIAL (Edge Functions)

| Funcionalidade | Edge Function | Descrição |
|----------------|---------------|-----------|
| Categorização de Despesas | `categorizar-despesa` | IA categoriza despesas automaticamente |
| Conciliação Bancária | `conciliacao-ia` | Match inteligente transações x lançamentos |
| Análise Preditiva | `analise-preditiva` | Previsões financeiras |
| Execução Análise | `executar-analise-preditiva` | Scheduler para análises |
| Análise de Fluxo | `analise-fluxo-ia` | Insights sobre fluxo de caixa |
| Análise de Documentos | `analyze-document` | OCR e extração de dados |
| Expert Agent | `expert-agent` | Assistente financeiro conversacional |
| Geração de Alertas | `gerar-alertas` | Alertas automáticos |

---

## 🏦 CONCILIAÇÃO BANCÁRIA

| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| Import OFX | Parser customizado | `src/lib/ofx-parser.ts` |
| Match Automático | Algoritmo IA | `src/lib/transaction-matcher.ts` |
| Sugestões IA | Edge Function | `src/components/conciliacao/SugestoesMatchIA.tsx` |
| Conciliação Manual | Dialog component | `src/components/conciliacao/ConciliacaoManualDialog.tsx` |
| Histórico IA | Supabase table | `src/hooks/useHistoricoConciliacaoIA.ts` |
| Feedback Loop | Tabela feedback | `feedback_conciliacao_ia` |

---

## 📊 DASHBOARDS E RELATÓRIOS

### Dashboard Executivo
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| Métricas Cards | Recharts + Custom | `src/components/dashboard/DashboardExecutivo/MetricsCards.tsx` |
| Gráfico Mensal | Recharts | `src/components/dashboard/widgets/AnimatedMonthlyChart.tsx` |
| Transações Recentes | Custom list | `src/components/dashboard/widgets/TransacoesRecentes.tsx` |
| Calendário Vencimentos | react-day-picker | `src/components/dashboard/widgets/CalendarioVencimentos.tsx` |
| Metas Financeiras | Custom + IA | `src/components/dashboard/widgets/MetasFinanceiras.tsx` |
| Resumo Rápido | Card component | `src/components/dashboard/widgets/ResumoRapido.tsx` |
| Cockpit CFO | Dashboard gerencial | `src/components/dashboard/CockpitCFO.tsx` |
| Alertas Preditivos | IA Panel | `src/components/dashboard/AlertasPreditivosPanel.tsx` |
| Simulador Cenários | What-if analysis | `src/components/dashboard/SimuladorCenarios.tsx` |
| Previsão IA | ML predictions | `src/components/dashboard/PrevisaoIA.tsx` |
| Dashboard Configurável | Drag & Drop | `src/components/dashboard/DraggableDashboardGrid.tsx` |
| Cards Ordenáveis | @dnd-kit | `src/components/dashboard/SortableCard.tsx` |
| Recomendações Metas IA | Edge Function | `src/components/dashboard/RecomendacoesMetasIA.tsx` |

### BI (Business Intelligence)
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| Painel BI | Recharts | `src/pages/BI/index.tsx` |
| Filtros BI | Custom filters | `src/pages/BI/components/Filters.tsx` |
| Gráficos BI | Recharts | `src/pages/BI/components/Charts.tsx` |
| Métricas BI | Custom calculations | `src/pages/BI/components/Metrics.tsx` |
| Benchmarking Setorial | Analytics | `src/components/analytics/BenchmarkingSetorial.tsx` |
| Inadimplência Segmentada | Analytics | `src/components/analytics/InadimplenciaSegmentada.tsx` |

### Relatórios
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| Relatórios Agendados | Cron + Edge Function | `src/components/relatorios/RelatoriosAgendados.tsx` |
| Execução Relatórios | Edge Function | `supabase/functions/executar-relatorios/` |
| Drill-down | Interactive charts | `src/components/relatorios/RelatorioDrillDown.tsx` |
| Visualização | Dialog component | `src/components/relatorios/VisualizarRelatorioDialog.tsx` |
| Exportação | PDF/Excel | `src/lib/export-utils.ts` |
| Geração PDF | Custom generator | `src/lib/pdf-generator.ts` |

### Demonstrativos Contábeis
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| DRE | Custom component | `src/components/demonstrativos/DREStatement.tsx` |
| Balanço Patrimonial | Custom component | `src/components/demonstrativos/BalancoPatrimonial.tsx` |
| Fluxo Caixa Contábil | Custom component | `src/components/demonstrativos/FluxoCaixaContabil.tsx` |

---

## 🔗 INTEGRAÇÕES EXTERNAS

### Bitrix24 CRM
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| Sincronização | Edge Function | `supabase/functions/bitrix24-sync/` |
| Webhooks | Edge Function | `supabase/functions/bitrix24-webhook/` |
| Field Mappings | Configurável | `src/components/integracoes/BitrixWebhookPanel.tsx` |
| Hook Integração | Custom hook | `src/hooks/useBitrix24.ts` |
| OAuth Tokens | Tabela `bitrix_oauth_tokens` | Supabase |
| Logs Sync | Tabela `bitrix_sync_logs` | Supabase |

### Open Finance (Open Banking)
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| Consentimento | OAuth flow | `src/hooks/useOpenFinance.ts` |
| Edge Function | API integration | `supabase/functions/open-finance/` |
| Painel Config | UI component | `src/components/integracoes/OpenFinancePanel.tsx` |
| Consents | Tabela `open_finance_consents` | Supabase |

---

## 📱 COBRANÇA E COMUNICAÇÃO

### Sistema de Cobrança
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| Régua de Cobrança | Custom logic | `src/hooks/useReguaCobranca.ts` |
| Histórico WhatsApp | Tabela dedicada | `historico_cobranca_whatsapp` |
| Negociação IA | AI-powered | `src/components/cobranca/NegociacaoIA.tsx` |
| Previsão Inadimplência | ML model | `src/components/cobranca/PrevisaoInadimplencia.tsx` |
| Acordos Parcelamento | Custom component | `src/components/cobranca/AcordoParcelamentoDialog.tsx` |
| PIX QR Code | Generator | `src/components/cobranca/PixQRCodeDialog.tsx` |
| Hook Acordos | Custom hook | `src/hooks/useAcordosParcelamento.ts` |

### Notificações
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| Push Notifications | Edge Function | `supabase/functions/send-push-notification/` |
| Email Alertas | Edge Function | `supabase/functions/enviar-alerta-email/` |
| Hook Push | Custom hook | `src/hooks/usePushNotifications.ts` |
| Config Notificações | Settings component | `src/components/configuracoes/NotificacoesConfig.tsx` |

---

## 👤 GESTÃO DE CADASTROS

### Clientes
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| CRUD Clientes | Supabase | `src/pages/Clientes.tsx` |
| Formulário | React Hook Form | `src/components/clientes/ClienteForm.tsx` |
| Detalhes | Dialog | `src/components/clientes/ClienteDetailDialog.tsx` |
| Score Cliente | Custom field | Campo `score` na tabela |
| Limite Crédito | Custom field | Campo `limite_credito` |
| Portal Cliente | Self-service | `src/hooks/usePortalCliente.ts` |

### Fornecedores
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| CRUD Fornecedores | Supabase | `src/pages/Fornecedores.tsx` |
| Formulário | React Hook Form | `src/components/fornecedores/FornecedorForm.tsx` |
| Detalhes | Dialog | `src/components/fornecedores/FornecedorDetailDialog.tsx` |

### Empresas
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| CRUD Empresas | Supabase | `src/pages/Empresas.tsx` |
| Formulário | React Hook Form | `src/components/empresas/EmpresaForm.tsx` |
| Multi-empresa | empresa_id em todas tabelas | RLS policies |

### Centros de Custo
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| CRUD Centros | Supabase | `src/pages/CentroCustos.tsx` |
| Árvore Hierárquica | Tree component | `src/components/centros-custo/CentroCustoTree.tsx` |
| Formulário | React Hook Form | `src/components/centros-custo/CentroCustoForm.tsx` |
| Orçamento | Previsto vs Realizado | Campos na tabela |

---

## 🎯 APROVAÇÕES E WORKFLOWS

| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| Aprovações Pendentes | Custom component | `src/components/aprovacoes/AprovacoesPendentes.tsx` |
| Histórico Aprovações | Audit trail | `src/components/aprovacoes/HistoricoAprovacoes.tsx` |
| Config Aprovação | Settings | `src/components/aprovacoes/ConfiguracaoAprovacaoCard.tsx` |
| Reset Senha Aprovação | Manager approval | `src/components/aprovacoes/PasswordResetApprovals.tsx` |
| Hook Aprovações | Custom hook | `src/hooks/useAprovacoes.ts` |
| Contador Pendências | Badge hook | `src/hooks/useAprovacoesPendentesCount.ts` |

---

## 🖥️ UI/UX AVANÇADO

### Layout e Navegação
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| Sidebar | Custom component | `src/components/layout/Sidebar.tsx` |
| Header | Custom component | `src/components/layout/Header.tsx` |
| Main Layout | Wrapper | `src/components/layout/MainLayout.tsx` |
| Page Transition | Framer Motion | `src/components/layout/PageTransition.tsx` |
| Keyboard Shortcuts | Custom hook | `src/hooks/useKeyboardShortcuts.ts` |
| Shortcuts Dialog | UI component | `src/components/layout/KeyboardShortcutsDialog.tsx` |

### Animações
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| Page Transitions | Framer Motion | `src/components/animations/PageTransition.tsx` |
| List Animations | Framer Motion | `src/components/animations/ListAnimation.tsx` |
| Motion Components | Framer Motion | `src/components/animations/Motion.tsx` |

### Acessibilidade
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| Skip Links | A11y | `src/components/accessibility/SkipLinks.tsx` |
| Font Size Control | Zoom control | `src/components/accessibility/FontSizeControl.tsx` |
| Keyboard Nav | Focus management | `src/components/accessibility/KeyboardNav.tsx` |
| Alto Contraste | CSS | `src/styles/high-contrast.css` |
| Contrast Checker | Utility | `src/lib/contrast-checker.ts` |

### Tema
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| Theme Provider | next-themes | `src/components/theme/ThemeProvider.tsx` |
| Theme Switcher | Toggle | `src/components/theme/ThemeSwitcher.tsx` |
| Design Tokens | CSS Variables | `src/index.css` |
| Tailwind Config | Config | `tailwind.config.ts` |

### PWA
| Funcionalidade | Ferramenta | Arquivo |
|----------------|------------|---------|
| Install Prompt | Custom component | `src/components/pwa/InstallPWA.tsx` |
| Service Worker | Workbox | `public/sw-workbox.js` |
| Manifest | PWA config | `public/manifest.json` |
| Offline Sync | IndexedDB | `src/hooks/useOfflineSync.tsx` |
| Offline Storage | Local storage | `src/lib/offline-storage.ts` |
| Network Status | Indicator | `src/hooks/useNetworkStatus.ts` |

---

## 🗄️ BANCO DE DADOS (Supabase/PostgreSQL)

### Tabelas Principais (50+)
| Tabela | Descrição |
|--------|-----------|
| `acordos_parcelamento` | Acordos de parcelamento de dívidas |
| `alertas` | Alertas do sistema |
| `alertas_preditivos` | Alertas gerados por IA |
| `allowed_ips` | IPs permitidos para login |
| `audit_logs` | Logs de auditoria |
| `bitrix_field_mappings` | Mapeamento campos Bitrix24 |
| `bitrix_oauth_tokens` | Tokens OAuth Bitrix24 |
| `bitrix_sync_logs` | Logs de sincronização |
| `bitrix_webhook_events` | Eventos webhook recebidos |
| `boletos` | Boletos gerados |
| `centros_custo` | Centros de custo hierárquicos |
| `clientes` | Cadastro de clientes |
| `configuracoes_aprovacao` | Config de aprovações |
| `contas_bancarias` | Contas bancárias |
| `contas_pagar` | Contas a pagar |
| `contas_receber` | Contas a receber |
| `empresas` | Cadastro de empresas |
| `expert_conversations` | Conversas com Expert AI |
| `expert_messages` | Mensagens do Expert |
| `feedback_conciliacao_ia` | Feedback para IA |
| `fornecedores` | Cadastro de fornecedores |
| `historico_analises_preditivas` | Histórico análises IA |
| `historico_cobranca` | Histórico etapas cobrança |
| `historico_cobranca_whatsapp` | Mensagens WhatsApp |
| `historico_conciliacao_ia` | Histórico conciliações IA |
| `historico_relatorios` | Relatórios gerados |
| `historico_score_saude` | Score saúde financeira |
| `login_attempts` | Tentativas de login |
| `metas_financeiras` | Metas por período |
| `notas_fiscais` | NFe emitidas |
| `open_finance_consents` | Consentimentos Open Banking |
| `pagamentos_recorrentes` | Pagamentos recorrentes |
| `parcelas_acordo` | Parcelas de acordos |
| `password_reset_requests` | Solicitações reset senha |
| `profiles` | Perfis de usuários |
| `portal_cliente_acessos` | Acessos portal cliente |
| `regua_cobranca` | Régua de cobrança |
| `relatorios_agendados` | Relatórios agendados |
| `security_settings` | Configurações segurança |
| `transacoes_bancarias` | Transações importadas |
| `user_roles` | Roles de usuários |
| `vendedores` | Cadastro vendedores |

### Funções PostgreSQL
| Função | Descrição |
|--------|-----------|
| `has_role()` | Verifica role do usuário |
| `has_any_role()` | Verifica múltiplas roles |
| `get_user_role()` | Retorna role principal |
| `log_audit()` | Registra log de auditoria |
| `handle_new_user()` | Trigger novo usuário |
| `update_updated_at_column()` | Atualiza timestamp |
| `gerar_contas_recorrentes()` | Gera contas automáticas |
| `calcular_proxima_geracao()` | Calcula próxima data |
| `gerar_numero_acordo()` | Gera número sequencial |
| `confirmar_conciliacao()` | Confirma conciliação |
| `gerar_alertas_vencimento()` | Gera alertas automáticos |
| `log_etapa_cobranca_change()` | Log mudança etapa |
| `get_cron_jobs()` | Lista cron jobs |
| `delete_cron_job()` | Remove cron job |
| `toggle_cron_job()` | Ativa/desativa cron |

---

## 📁 EDGE FUNCTIONS (Supabase)

| Função | Arquivo | Descrição |
|--------|---------|-----------|
| `analise-fluxo-ia` | `/analise-fluxo-ia/index.ts` | Análise IA do fluxo de caixa |
| `analise-preditiva` | `/analise-preditiva/index.ts` | Análise preditiva financeira |
| `analyze-document` | `/analyze-document/index.ts` | OCR e análise de documentos |
| `bitrix24-sync` | `/bitrix24-sync/index.ts` | Sincronização Bitrix24 |
| `bitrix24-webhook` | `/bitrix24-webhook/index.ts` | Receptor webhooks Bitrix |
| `categorizar-despesa` | `/categorizar-despesa/index.ts` | Categorização IA despesas |
| `conciliacao-ia` | `/conciliacao-ia/index.ts` | Match inteligente conciliação |
| `enviar-alerta-email` | `/enviar-alerta-email/index.ts` | Envio emails de alerta |
| `executar-analise-preditiva` | `/executar-analise-preditiva/index.ts` | Scheduler análise |
| `executar-relatorios` | `/executar-relatorios/index.ts` | Geração relatórios agendados |
| `expert-agent` | `/expert-agent/index.ts` | Assistente AI conversacional |
| `gerar-alertas` | `/gerar-alertas/index.ts` | Geração automática alertas |
| `open-finance` | `/open-finance/index.ts` | Integração Open Banking |
| `send-push-notification` | `/send-push-notification/index.ts` | Push notifications |

---

## 🔧 UTILITÁRIOS E HELPERS

| Utilitário | Arquivo | Descrição |
|------------|---------|-----------|
| Formatters | `src/lib/formatters.ts` | Formatação moeda, datas, etc |
| Masks | `src/lib/masks.ts` | Máscaras de input (CPF, CNPJ) |
| Utils | `src/lib/utils.ts` | cn() e outras utilidades |
| Export Utils | `src/lib/export-utils.ts` | Exportação PDF/Excel |
| PDF Generator | `src/lib/pdf-generator.ts` | Geração de PDFs |
| OFX Parser | `src/lib/ofx-parser.ts` | Parser arquivos OFX |
| Barcode Parser | `src/lib/barcode-parser.ts` | Parser código de barras |
| Transaction Matcher | `src/lib/transaction-matcher.ts` | Algoritmo match |
| Cashflow Scenarios | `src/lib/cashflow-scenarios.ts` | Cálculo cenários |
| Feature Flags | `src/lib/feature-flags.ts` | Feature toggles |
| Logger | `src/lib/logger.ts` | Logging estruturado |
| Error Tracking | `src/lib/error-tracking.ts` | Tracking de erros |
| Sound Feedback | `src/lib/sound-feedback.ts` | Feedback sonoro |
| Toast with Undo | `src/lib/toast-with-undo.tsx` | Toast com undo |
| Toast Confetti | `src/lib/toast-confetti.tsx` | Celebração visual |
| React Query Config | `src/lib/react-query.ts` | Config React Query |

---

## 📱 COMPONENTES UI CUSTOMIZADOS

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| Action Button | `src/components/ui/action-button.tsx` | Botão com loading |
| Advanced Filters | `src/components/ui/advanced-filters.tsx` | Filtros avançados |
| Bulk Actions Bar | `src/components/ui/bulk-actions-bar.tsx` | Ações em lote |
| Chart Skeleton | `src/components/ui/chart-skeleton.tsx` | Loading charts |
| Confirm Dialog | `src/components/ui/confirm-dialog.tsx` | Diálogo confirmação |
| Empty State | `src/components/ui/empty-state.tsx` | Estado vazio |
| Export Menu | `src/components/ui/export-menu.tsx` | Menu exportação |
| Feedback Banner | `src/components/ui/feedback-banner.tsx` | Banner feedback |
| Highlight Text | `src/components/ui/highlight-text.tsx` | Texto destacado |
| Infinite Scroll | `src/components/ui/infinite-scroll.tsx` | Scroll infinito |
| Info Tooltip | `src/components/ui/info-tooltip.tsx` | Tooltip info |
| Loading Skeleton | `src/components/ui/loading-skeleton.tsx` | Loading states |
| Micro Interactions | `src/components/ui/micro-interactions.tsx` | Micro animações |
| Network Status | `src/components/ui/network-status-indicator.tsx` | Status conexão |
| Optimized Table | `src/components/ui/optimized-table.tsx` | Tabela otimizada |
| Pull to Refresh | `src/components/ui/pull-to-refresh.tsx` | Pull to refresh |
| Quick Date Filters | `src/components/ui/quick-date-filters.tsx` | Filtros rápidos data |
| Rank Badge | `src/components/ui/rank-badge.tsx` | Badge ranking |
| Skip Link | `src/components/ui/skip-link.tsx` | Skip link a11y |
| Sortable Header | `src/components/ui/sortable-header.tsx` | Header ordenável |
| Table Pagination | `src/components/ui/table-pagination.tsx` | Paginação |
| Virtualized List | `src/components/ui/virtualized-list.tsx` | Lista virtual |
| Virtualized Table | `src/components/ui/virtualized-table.tsx` | Tabela virtual |

---

## 🧪 TESTES

| Tipo | Ferramenta | Diretório |
|------|------------|-----------|
| Unit Tests | Vitest | `src/__tests__/` |
| Component Tests | @testing-library/react | `src/components/__tests__/` |
| Hook Tests | @testing-library/react | `src/hooks/__tests__/` |
| Integration Tests | Vitest | `src/__tests__/integration/` |
| E2E Tests | Playwright | `e2e/` |
| Edge Function Tests | Vitest | `supabase/functions/__tests__/` |

---

## 📖 DOCUMENTAÇÃO

| Documento | Arquivo | Descrição |
|-----------|---------|-----------|
| Getting Started | `docs/GETTING-STARTED.md` | Início rápido |
| Security | `docs/SECURITY.md` | Segurança |
| Performance | `docs/PERFORMANCE.md` | Performance |
| Accessibility | `docs/ACCESSIBILITY.md` | Acessibilidade |
| Deployment | `docs/DEPLOYMENT.md` | Deploy |
| Testing | `docs/TESTING.md` | Testes |
| Features Guides | `docs/guides/features/` | Guias features |
| Integration Guide | `docs/guides/integrations/` | Guias integrações |
| Changelog | `CHANGELOG.md` | Histórico versões |

---

## 🔑 SECRETS/ENVIRONMENT

| Secret | Descrição |
|--------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave anônima |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave admin |
| `SUPABASE_DB_URL` | URL do banco |
| `BITRIX24_DOMAIN` | Domínio Bitrix24 |
| `BITRIX24_ACCESS_TOKEN` | Token de acesso |
| `BITRIX24_CLIENT_ID` | Client ID OAuth |
| `BITRIX24_CLIENT_SECRET` | Client Secret |
| `BITRIX24_REFRESH_TOKEN` | Refresh token |
| `LOVABLE_API_KEY` | Chave Lovable AI |

---

## 📊 ESTATÍSTICAS DO PROJETO

| Métrica | Valor |
|---------|-------|
| Páginas | 27+ |
| Componentes | 197+ |
| Hooks Customizados | 40+ |
| Edge Functions | 14 |
| Tabelas DB | 50+ |
| Funções PostgreSQL | 13+ |
| Arquivos de Teste | 30+ |
| Testes E2E | 15+ |

---

*Documento gerado em: 2025-01-01*
*Versão do Sistema: 1.0.0*

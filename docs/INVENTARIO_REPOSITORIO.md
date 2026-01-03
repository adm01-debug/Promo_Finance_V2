# 📋 INVENTÁRIO COMPLETO DO PROJETO FINANCEIRO

## 🎯 Visão Geral
Sistema ERP Financeiro completo desenvolvido com React + Vite + TypeScript + Supabase (Lovable Cloud).

---

## 📁 ESTRUTURA DE PASTAS

### Raiz do Projeto
| Arquivo/Pasta | Descrição |
|---------------|-----------|
| `src/` | Código fonte principal |
| `supabase/` | Configurações e funções do Supabase |
| `docs/` | Documentação do projeto |
| `e2e/` | Testes end-to-end (Playwright) |
| `public/` | Assets estáticos |
| `scripts/` | Scripts de automação |
| `.husky/` | Git hooks |

---

## 🧩 COMPONENTES (src/components/)

### UI Base (shadcn/ui)
- `accordion.tsx`, `alert-dialog.tsx`, `alert.tsx`, `avatar.tsx`
- `badge.tsx`, `button.tsx`, `calendar.tsx`, `card.tsx`
- `checkbox.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `form.tsx`
- `input.tsx`, `label.tsx`, `popover.tsx`, `select.tsx`
- `skeleton.tsx`, `switch.tsx`, `table.tsx`, `tabs.tsx`
- `textarea.tsx`, `toast.tsx`, `tooltip.tsx`

### Componentes Customizados
| Componente | Descrição |
|------------|-----------|
| `BulkActionsBar.tsx` | Barra de ações em massa |
| `DataImporter.tsx` | Importador de dados CSV/Excel |
| `SearchInput.tsx` | Input de busca com debounce |
| `SavedFiltersDropdown.tsx` | Filtros salvos |
| `AdvancedFilters.tsx` | Filtros avançados |
| `VersionHistory.tsx` | Histórico de versões |
| `DuplicateButton.tsx` | Botão de duplicação |
| `ExportDropdown.tsx` | Menu de exportação |

### Dashboard
- `Dashboard.tsx`, `DashboardExecutivo.tsx`, `CockpitCFO.tsx`
- `PrevisaoIA.tsx`, `SimuladorCenarios.tsx`
- `AlertasPreditivosPanel.tsx`, `DraggableDashboardGrid.tsx`

### Autenticação
- `MFASettings.tsx`, `TwoFactorSetup.tsx`, `TwoFactorVerify.tsx`
- `PasswordStrengthIndicator.tsx`, `PermissionGate.tsx`, `ProtectedRoute.tsx`

### Financeiro
- `contas-pagar/` - Formulários e dialogs de contas a pagar
- `contas-receber/` - Formulários e dialogs de contas a receber
- `cobranca/` - Acordos, Pix, Previsão de inadimplência
- `conciliacao/` - Conciliação bancária com IA
- `fluxo-caixa/` - Cenários, alertas, Monte Carlo

### NFe
- `AlertasRejeicao.tsx`, `CancelamentoNFe.tsx`, `ContingenciaNFe.tsx`
- `SefazMonitor.tsx`, `SefazAnalytics.tsx`

### Segurança
- `GeoRestrictionPanel.tsx`, `KnownDevicesPanel.tsx`, `RateLimitDashboard.tsx`

---

## 🪝 HOOKS (src/hooks/)

| Hook | Descrição |
|------|-----------|
| `useAuth.tsx` | Autenticação e sessão |
| `useCRUD.ts` | Operações CRUD genéricas |
| `useBulkActions.ts` | Ações em massa |
| `useBoletos.ts` | Gestão de boletos |
| `useConciliacao.ts` | Conciliação bancária |
| `useConciliacaoIA.ts` | Match automático com IA |
| `useFluxoCaixa.ts` | Projeções de fluxo de caixa |
| `useMetasFinanceiras.ts` | Metas e KPIs |
| `useNotifications.ts` | Sistema de notificações |
| `useMFA.ts` | Multi-factor authentication |
| `useWebAuthn.ts` | Autenticação biométrica |
| `usePermissions.ts` | Controle de permissões |
| `useExportData.ts` | Exportação de dados |
| `useImportData.ts` | Importação de dados |

---

## 📄 PÁGINAS (src/pages/)

| Página | Descrição |
|--------|-----------|
| `Index.tsx` | Dashboard principal |
| `Auth.tsx` | Login/Registro com MFA |
| `ContasPagar.tsx` | Gestão de contas a pagar |
| `ContasReceber.tsx` | Gestão de contas a receber |
| `Boletos.tsx` | Emissão e gestão de boletos |
| `Cobrancas.tsx` | Sistema de cobranças |
| `Conciliacao.tsx` | Conciliação bancária |
| `FluxoCaixa.tsx` | Projeções e cenários |
| `NotasFiscais.tsx` | Emissão de NFe |
| `Relatorios.tsx` | Relatórios financeiros |
| `Expert.tsx` | Assistente IA |
| `Configuracoes.tsx` | Configurações do sistema |
| `Seguranca.tsx` | Configurações de segurança |
| `Aprovacoes.tsx` | Workflow de aprovações |

---

## ⚡ EDGE FUNCTIONS (supabase/functions/)

| Função | Descrição |
|--------|-----------|
| `analise-fluxo-ia/` | Análise de fluxo de caixa com IA |
| `analise-preditiva/` | Previsões com ML |
| `categorizar-despesa/` | Categorização automática |
| `conciliacao-ia/` | Match automático de transações |
| `expert-agent/` | Assistente financeiro IA |
| `bitrix24-sync/` | Sincronização com Bitrix24 |
| `open-finance/` | Integração Open Finance |
| `enviar-alerta-email/` | Envio de alertas |
| `gerar-alertas/` | Geração automática de alertas |

---

## 🗃️ BANCO DE DADOS (40+ migrações)

### Tabelas Principais
- `empresas`, `clientes`, `fornecedores`
- `contas_pagar`, `contas_receber`, `boletos`
- `contas_bancarias`, `centros_custo`
- `profiles`, `user_roles`, `permissions`
- `alertas`, `alertas_preditivos`
- `acordos_parcelamento`, `pagamentos_recorrentes`
- `audit_logs`, `account_lockouts`, `blocked_ips`

---

## 🛠️ BIBLIOTECAS PRINCIPAIS

| Biblioteca | Uso |
|------------|-----|
| React 18 | Framework UI |
| Vite | Build tool |
| TypeScript | Tipagem estática |
| TailwindCSS | Estilização |
| shadcn/ui | Componentes UI |
| Supabase | Backend/Auth/Database |
| TanStack Query | Cache e estado servidor |
| React Hook Form + Zod | Formulários e validação |
| Recharts | Gráficos |
| Framer Motion | Animações |
| date-fns | Manipulação de datas |

---

## 📝 DOCUMENTAÇÃO (docs/)

- `GETTING-STARTED.md` - Guia inicial
- `SECURITY.md` - Práticas de segurança
- `PERFORMANCE.md` - Otimizações
- `TESTING.md` - Testes
- `DEPLOYMENT.md` - Deploy
- `ACCESSIBILITY.md` - Acessibilidade
- `INVENTARIO_FUNCIONALIDADES.md` - Funcionalidades detalhadas

---

## 🧪 TESTES (e2e/)

15 arquivos de teste Playwright cobrindo:
- Autenticação, Dashboard, Aprovações
- Boletos, Cobranças, NFe
- Conciliação, Fluxo de Caixa
- Relatórios, Expert AI, Open Finance

---

**Última atualização:** Janeiro 2026

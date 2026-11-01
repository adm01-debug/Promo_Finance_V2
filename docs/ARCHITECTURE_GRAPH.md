# Grafo de Arquitetura — Promo Finance V2

> **Gerado em:** 2026-10-31  
> **HEAD (main):** `8172bc7c7fc809122023530ce5a13304dfa06eb3`  
> **Baseline plano 50 etapas:** `79435e90`  
> **Método:** varredura estática do repositório (graphify não disponível no ambiente — `graphify-out/` ausente)  
> **Nota:** relações derivadas de análise estática de imports e estrutura de diretórios; não substituem evidência de execução real.

---

## 1. Visão geral da arquitetura

```
┌──────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vite + React 18 + TS)               │
│                                                                    │
│  src/pages/          src/components/          src/hooks/           │
│  (roteamento)        (80+ diretórios UI)      (264 hooks)          │
│       │                    │                       │               │
│       └────────────────────┴───────────────────────┘               │
│                             │                                      │
│              src/integrations/supabase/  (cliente Supabase)        │
│              src/lib/  (queryClient, tributário, arquitetura)      │
└─────────────────────────────┬────────────────────────────────────┘
                               │ HTTPS / REST / Realtime
┌─────────────────────────────▼────────────────────────────────────┐
│               SUPABASE CLOUD (bwwbeyolnnzppeuhgkcd)               │
│                                                                    │
│  Edge Functions (Deno)    │  Postgres + RLS       │  Auth (GoTrue) │
│  supabase/functions/      │  130+ tabelas          │                │
│  ~100 funções             │  571+ migrations       │                │
│  _shared/ (utilitários)   │  RLS em toda pública   │                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Módulos do frontend

### 2.1 Páginas (src/pages/)

Roteamento principal da aplicação SPA. Cada página importa hooks de domínio e componentes.

### 2.2 Componentes (src/components/) — 80+ diretórios

| Domínio | Diretório | Estado |
|---------|-----------|--------|
| Financeiro geral | `financeiro/` | Completo |
| Contas a Pagar | `contas-pagar/` | Completo |
| Contas a Receber | `contas-receber/` | Completo |
| Conciliação bancária | `conciliacao/` | Completo |
| Fluxo de Caixa | `fluxo-caixa/` | Completo |
| Dashboard principal | `dashboard/` | Completo |
| Dashboard por empresa | `dashboard-empresa/` | Completo |
| NF-e / Fiscal | `nfe/` | Completo |
| Tributário | `tributario/` | Completo |
| Simuladores tributários | `simuladores/` | Completo |
| Cobrança | `cobranca/` | Completo |
| Boletos | `boletos/` | Completo |
| PIX | `pix-hub/` | Completo |
| Relatórios | `relatorios/` | Completo |
| Demonstrativos | `demonstrativos/` | Completo |
| Expert IA | `expert/`, `copilot/`, `insights-ia/` | Completo |
| Integrações | `integracoes/` | Completo |
| Bitrix24 | `bitrix/` | Completo |
| Bling ERP | `bling/` | Completo |
| Asaas | `asaas/` | Completo |
| Clientes/Fornecedores | `clientes/`, `fornecedores/` | Completo |
| Alertas | `alertas/` | Completo |
| Compliance | `compliance/` | Completo |
| Auditoria | `audit/` | Completo |
| SSO/Auth | `auth/` | Completo |
| SCIM | (dentro de `auth/`) | Completo |
| Perfil/Configurações | `profile/`, `configuracoes/`, `settings/` | Completo |
| Empresas | `empresas/`, `empresa/` | Completo |
| Usuários | `usuarios/` | Completo |
| Aprovações | `aprovacoes/` | Completo |
| Orçamento | `orcamento/` | Completo |
| Contratos | (dentro de pages) | Completo |
| Contabilidade | `contabilidade/` | Completo |
| Centros de Custo | `centros-custo/` | Completo |
| Categorias | `categorias/` | Completo |
| Vendedores | `vendedores/` | Completo |
| Reforma Tributária | `reforma-tributaria/` | Completo |
| LGPD | (solicitações LGPD) | Completo |
| BI / Analytics | `bi/`, `analytics/` | Completo |
| Painel admin | `admin/` | Completo |
| Layout / Navegação | `layout/`, `navigation/` | Completo |
| UI base (shadcn) | `ui/` | Completo |
| Shared/common | `shared/`, `common/` | Completo |
| Design system debug | `design-system-debug/` | Debug/interno |
| PWA/Offline | `pwa/`, `offline/` | Completo |
| Onboarding | `onboarding/` | Completo |
| Providers | `providers/` | Completo |
| Charts | `charts/` | Completo |
| Acessibilidade | `accessibility/` | Completo |

### 2.3 Hooks (src/hooks/) — 264 arquivos

Organizados em domínios funcionais:

#### Domínio Financeiro
| Hook | Função | Estado |
|------|--------|--------|
| `useContasPagarLogic` | Gestão contas a pagar | Completo |
| `useContasReceberLogic` | Gestão contas a receber | Completo |
| `useConciliacao` | Conciliação bancária | Completo |
| `useConciliacaoIA` | Conciliação com IA | Completo |
| `useFluxoCaixa` | Fluxo de caixa | Completo |
| `useBoletos` | Gestão de boletos | Completo |
| `useCobrancas` | Régua de cobrança | Completo |
| `useReguaCobranca` | Automação cobrança | Completo |
| `useFinancialData` / `useFinancialOperations` | Operações financeiras | Completo |
| `hooks/financial/*` | KPIs, totais, views | Completo |

#### Domínio Tributário
| Hook | Função | Estado |
|------|--------|--------|
| `useApuracoesTributarias` | Apuração fiscal | Completo |
| `useSimulacaoRegimes` | Simulação Simples/Presumido/Real | Completo |
| `useCreditosTributarios` | Créditos CBS/IBS | Completo |
| `useRetencoesFonte` | Retenções e DARF | Completo |
| `useFechamentoTributario` | Fechamento fiscal | Completo |
| `useDRETributaria` | DRE tributária | Completo |
| `useSpedContabil` / `useSpedEcfHistorico` | SPED geração | Completo |
| `useExportarSped` | Exportação SPED | Completo |
| `useIRPJCSLL` | IRPJ/CSLL | Completo |
| `useAlertasTributarios` | Alertas fiscais | Completo |
| `useConformidadeFiscal` | Conformidade | Completo |
| `useReformaTributaria` | Reforma tributária | Completo |

#### Domínio NF-e / SEFAZ
| Hook | Função | Estado |
|------|--------|--------|
| `useBlingNFe` | NF-e via Bling | Completo |
| `useManifestarNfe` | Manifestação SEFAZ | Completo |
| `useNfeRecebidas` | NF-e recebidas | Completo |
| `useNfeVinculo` | Vínculo NF-e / financeiro | Completo |
| `useCertificadosDigitais` | Certificados A1 | Completo |
| `useImportacaoXMLNFe` | Importação XML | Completo |

#### Domínio IA / Expert
| Hook | Função | Estado |
|------|--------|--------|
| `useInsightsIA` | Insights financeiros IA | Completo |
| `useExpertConversations` | Conversas Expert | Completo |
| `useCategorizacaoIA` | Categorização automática | Completo |
| `useAnomaliasDetectadas` | Detecção anomalias | Completo |
| `useAlertasPreditivos` | Alertas preditivos | Completo |
| `useWhatsAppIA` | WhatsApp IA | Completo |

#### Domínio Integrações
| Hook | Função | Estado |
|------|--------|--------|
| `hooks/bling/*` | Bling ERP (11 hooks) | Completo |
| `useBitrix24` | Bitrix24 CRM | Completo |
| `useOpenFinance` | Open Finance | Completo |
| `useAsaas` | Asaas pagamentos | Completo |

#### Infraestrutura / Auth
| Hook | Função | Estado |
|------|--------|--------|
| `usePermissions` | Permissões RBAC | Completo |
| `useEmpresas` / `useUserEmpresas` | Multi-empresa | Completo |
| `useSSO` / `useSSOConsistency` | SSO SAML/OIDC | Completo |
| `useMFA` | Multi-fator | Completo |
| `useApiKeys` | Chaves de API | Completo |
| `useScimTokens` | Provisionamento SCIM | Completo |
| `useSessions` | Gestão de sessões | Completo |
| `useAuditLog` | Trilha de auditoria | Completo |

---

## 3. Edge Functions (supabase/functions/) — 100+ funções

### 3.1 Segurança e guards

Convenção: `verify_jwt = true` é o padrão. Exceções legítimas (`verify_jwt = false`) requerem `exigirChamadaInterna()` ou segredo compartilhado.

Shared utilities em `_shared/`:
- `auth-guard.ts` — `exigirUsuario()`, `exigirChamadaInterna()` (timing-safe)
- `validation.ts` — schemas Zod + `validatePayload()` (gate obrigatório por contrato)
- `rate-limit.ts` — rate limiting por usuário
- `cors.ts` — CORS headers
- `resilience.ts` — retry, circuit breaker
- `logger.ts`, `edge-observability.ts` — observabilidade
- `tributario-logic.ts` — motor tributário (autocontido, sem imports externos)
- `sefaz/` — SOAP SEFAZ, parser XML, PFX
- `sped/bloco9.ts` — geração bloco 9 SPED (compartilhado por ECD/ECF/EFD)
- `obrigacoes/` — calendário fiscal, alertas, catálogo

### 3.2 Catálogo por domínio

#### Financeiro
| Função | Guard | Estado |
|--------|-------|--------|
| `categorizar-despesa` | verify_jwt + validatePayload | Completo |
| `conciliacao-ia` | verify_jwt + validatePayload (.max() aplicado) | Completo |
| `executar-regua-cobranca` | exigirChamadaInterna | Completo |
| `processar-fila-cobrancas` | exigirChamadaInterna | Completo |
| `executar-fechamento-tributario` | verify_jwt (IDOR em revisão — Etapa 5) | Parcial |
| `contabilizar-evento` | verify_jwt | Completo |

#### Tributário
| Função | Guard | Estado |
|--------|-------|--------|
| `calculo-iva` | verify_jwt | Completo |
| `decidir-regime` | verify_jwt | Completo |
| `simular-simples` / `simular-presumido` / `simular-real` | verify_jwt | Completo |
| `prever-carga-tributaria` | verify_jwt | Completo |
| `gerar-dre-tributaria` | verify_jwt | Stub (cálculo fixo) |
| `gerar-heatmap-tributario` | verify_jwt | Completo |
| `verificar-conformidade-fiscal` | verify_jwt | Completo |
| `gerar-alertas-tributarios` | exigirChamadaInterna | Completo |
| `exportar-sped-contribuicoes` | verify_jwt | Completo |
| `gerar-sped-ecd` | verify_jwt | Completo (corrigido Etapa 40) |
| `gerar-sped-ecf` | verify_jwt | Completo (corrigido Etapa 40) |

#### NF-e / SEFAZ
| Função | Guard | Estado |
|--------|-------|--------|
| `nfe-upload-certificado` | verify_jwt (IDOR em revisão — Etapa 4) | Parcial |
| `sefaz-dfe-dispatcher` | exigirChamadaInterna | Completo |
| `sefaz-dfe-puxar` | exigirChamadaInterna | Completo |
| `sefaz-manifestar` | verify_jwt | Completo |
| `nfe-vinculo-proxy` | verify_jwt | Completo |

#### IA
| Função | Guard | Estado |
|--------|-------|--------|
| `analise-fluxo-ia` | verify_jwt | Completo |
| `analise-preditiva` | verify_jwt (cross-tenant — Etapa 3 PENDENTE) | Crítico |
| `executar-analise-preditiva` | exigirChamadaInterna | Parcial (mistura tenants — Etapa 8) |
| `detectar-anomalias-financeiras` | verify_jwt | Completo |
| `copilot-global` | verify_jwt + validatePayload (.max() aplicado) | Completo |
| `expert-agent` | verify_jwt + validatePayload (.max() aplicado) | Completo |
| `gerar-acoes-recomendadas` | verify_jwt | Completo |
| `whatsapp-ia-proativo` | exigirChamadaInterna | Completo |

#### Integrações
| Função | Guard | Estado |
|--------|-------|--------|
| `asaas-proxy` | verify_jwt | Completo |
| `asaas-webhook` | webhook-auth (segredo) | Completo |
| `bitrix24-sync` | exigirChamadaInterna | Completo |
| `bitrix24-webhook` | webhook-auth | Completo |
| `bling-proxy` | verify_jwt | Completo |
| `bling-webhook` | webhook-auth | Completo |
| `open-finance` | verify_jwt | Completo |
| `n8n-callback` | webhook-auth | Completo |
| `n8n-dispatch` | exigirChamadaInterna | Completo |

#### Auth / SSO
| Função | Guard | Estado |
|--------|-------|--------|
| `aceitar-convite` | verify_jwt | Completo |
| `convidar-contador` | verify_jwt | Completo |
| `convidar-usuario` | verify_jwt | Completo |
| `scim-server` | SCIM token | Completo |
| `sso-callback` | SAML/OIDC | Completo |
| `sso-initiate` | verify_jwt | Completo |
| `sso-generate-metadata` | público | Completo |
| `validar-token-contador` | token | Completo |

#### Alertas / Notificações
| Função | Guard | Estado |
|--------|-------|--------|
| `enviar-alerta-email` | exigirChamadaInterna | Completo |
| `gerar-alertas-dispatcher` | exigirChamadaInterna | Completo |
| `send-push-notification` | exigirChamadaInterna | Completo |
| `enviar-digest-conformidade` | exigirChamadaInterna (IDOR em revisão — Etapa 7) | Parcial |

#### Relatórios
| Função | Guard | Estado |
|--------|-------|--------|
| `gerar-relatorio-anual` | verify_jwt | Completo |
| `gerar-resumo-executivo-semanal` | exigirChamadaInterna | Completo |
| `gerar-resumo-financeiro-diario` | exigirChamadaInterna | Completo |
| `executar-relatorios` | verify_jwt (guard condicional — Etapa 6) | Parcial |
| `insights-relatorio` | verify_jwt | Completo |

#### Observabilidade / CI
| Função | Guard | Estado |
|--------|-------|--------|
| `health` | público | Completo |
| `ci-security-gate-log` | verify_jwt | Completo |
| `mcp-query` | verify_jwt + sql-policy | Completo |
| `external-data` | verify_jwt | Completo (EXTERNAL_SUPABASE_SERVICE_ROLE_KEY isolada) |
| `compare-schemas` | verify_jwt | Limpo (key exposta removida — Etapa 1 PENDENTE rotação) |

---

## 4. Banco de dados (Postgres + RLS)

### 4.1 Camadas
- **130+ tabelas** em schema `public`
- **RLS obrigatório** em toda tabela pública
- **`empresa_acessivel(empresa_id)`** — função helper nas policies multi-tenant
- **571+ migrations** (convenção: timestamp YYYYMMDDHHmmss 14 dígitos)
- **Views** com `security_invoker = true` (padrão desde P15); 106 views totais, 30 confirmadas com security_invoker (76 em auditoria — Etapa 49)

### 4.2 Principais domínios de tabelas

| Domínio | Tabelas-chave |
|---------|--------------|
| Financeiro | `contas_pagar`, `contas_receber`, `transacoes_bancarias`, `lancamentos_contabeis` |
| Cobrança | `cobrancas`, `boletos`, `historico_boletos`, `pix_templates` |
| Tributário | `apuracoes_tributarias`, `creditos_tributarios`, `retencoes_fonte`, `fechamentos_tributarios` |
| NF-e | `nfe_recebidas`, `nfe_vinculo`, `certificados_digitais`, `sped_contabil` |
| IA | `anomalias_detectadas`, `historico_conciliacao_ia`, `metricas_aprendizado_ia` |
| Multi-empresa | `empresas`, `user_empresas`, `user_roles` |
| Auth | `profiles`, `organizacoes`, `sso_configs`, `scim_tokens`, `api_keys` |
| Alertas | `alertas`, `alertas_tributarios`, `saved_filters`, `digest_preferences` |
| Conformidade | `snapshots_conformidade`, `entrega_obrigacoes`, `audit_log` |

---

## 5. Dependências entre módulos (resumo)

```
src/pages/
  └─► src/components/[domínio]/
        └─► src/hooks/[domínio]/
              └─► src/integrations/supabase/  (cliente RLS)
              └─► supabase/functions/[função]  (via invoke())
              └─► src/lib/tributario/          (motor tributário cliente)

supabase/functions/[função]/
  └─► supabase/functions/_shared/auth-guard.ts
  └─► supabase/functions/_shared/validation.ts
  └─► supabase/functions/_shared/tributario-logic.ts  (motor tributário edge)
  └─► supabase/functions/_shared/sefaz/
  └─► supabase/functions/_shared/sped/
  └─► supabase/functions/_shared/obrigacoes/
  └─► Postgres (service-role ou RLS do usuário)

src/lib/tributario/shared-logic.ts
  ↔ supabase/functions/_shared/tributario-logic.ts
  (paridade garantida por: src/lib/tributario/__tests__/paridade-motor-edge.test.ts — 86 casos)
```

---

## 6. Estado de implementação por módulo

| Módulo | Hooks | Edge Functions | UI | Estado geral |
|--------|-------|---------------|----|--------------|
| Contas a Pagar/Receber | ✅ | ✅ | ✅ | Completo |
| Conciliação bancária | ✅ | ✅ | ✅ | Completo |
| Fluxo de Caixa | ✅ | ✅ | ✅ | Completo |
| Cobrança / Asaas | ✅ | ✅ | ✅ | Completo |
| NF-e / SEFAZ | ✅ | ✅ | ✅ | Completo |
| SPED (ECD/ECF/EFD) | ✅ | ✅ (corrigido) | ✅ | Completo |
| Tributário (cálculo) | ✅ | ✅ | ✅ | Completo |
| DRE Tributária | ✅ | ⚠️ (stub) | ✅ | Parcial |
| Reforma Tributária | ✅ | ✅ | ✅ | Completo |
| Open Finance | ✅ | ✅ | ✅ | Completo |
| Bling ERP | ✅ (11 hooks) | ✅ | ✅ | Completo |
| Bitrix24 CRM | ✅ | ✅ | ✅ | Completo |
| WhatsApp IA | ✅ | ✅ | ✅ | Completo |
| Expert Agent / Copilot | ✅ | ✅ | ✅ | Completo |
| Análise Preditiva | ✅ | 🔴 (cross-tenant) | ✅ | Crítico |
| SSO SAML/OIDC | ✅ | ✅ | ✅ | Completo |
| SCIM | ✅ | ✅ | ✅ | Completo |
| MFA | ✅ | — | ✅ | Completo |
| API Keys | ✅ | ✅ | ✅ | Completo |
| Multi-empresa | ✅ | ⚠️ (IDOR em revisão) | ✅ | Parcial |
| Aprovações | ✅ | — | ✅ | Completo |
| Alertas / Anomalias | ✅ | ✅ | ✅ | Completo |
| Conformidade fiscal | ✅ | ✅ | ✅ | Completo |
| Relatórios agendados | ✅ | ✅ | ✅ | Completo |
| Demonstrativos | ✅ | ✅ | ✅ | Completo |
| LGPD | ✅ | ✅ | ✅ | Completo |
| Auditoria / Trilha | ✅ | ✅ | ✅ | Completo |

**Legenda:** ✅ Completo · ⚠️ Parcial/Pendente · 🔴 Crítico

---

## 7. Referências

- `docs/PLANO_MELHORIAS_50_ETAPAS_2026-09-13.md` — auditoria técnica completa
- `docs/EDGE_FUNCTIONS_CATALOG.md` — catálogo oficial de edge functions
- `docs/ARCHITECTURE.md` — arquitetura geral documentada
- `docs/SECURITY.md` — políticas de segurança
- `supabase/functions/_shared/` — utilitários compartilhados
- `src/lib/arquitetura/` — analisador de imports (preservado; este documento é complementar)

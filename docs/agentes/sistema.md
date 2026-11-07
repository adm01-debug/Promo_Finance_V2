# Sistema — referência para agentes

> Ler ao localizar ou alterar uma Edge Function ou integração, ou quando precisar dos IDs completos.
> Regras operacionais (banco, Zod, `verify_jwt`, imports) estão em `AGENTS.md`.

## Contexto de negócio

Sistema financeiro corporativo multi-empresa da Promo Brindes (SP). Módulos ativos: Contas a
Pagar/Receber, Conciliação bancária (Open Finance), NF-e/SEFAZ/SPED, Tributário
(Simples/Presumido/Real), Cobrança (Asaas), Relatórios/DRE, Integrações (Bling ERP, Bitrix24 CRM,
WhatsApp IA). Empresas geridas no mesmo banco Supabase — isolamento garantido por RLS.

## Banco de dados OFICIAL

| O que            | Valor                                                       |
| ---------------- | ----------------------------------------------------------- |
| Projeto Supabase | `bwwbeyolnnzppeuhgkcd` (Cloud)                              |
| URL              | `https://bwwbeyolnnzppeuhgkcd.supabase.co`                  |
| Dashboard        | https://supabase.com/dashboard/project/bwwbeyolnnzppeuhgkcd |
| MCP SQL          | `SUPABASE - PROMO FINANCE V2 - MCP`                         |
| MCP alt          | `PROMO FINANCE V2 - MCP - LOVABLE CLOUD /SUPABASE`          |
| Migrations       | 571+ (timestamp YYYYMMDDHHmmss)                             |
| Tabelas          | 130+                                                        |

Bancos que NÃO são deste projeto: Supabase self-hosted VPS AtomicaBR; `pgxfvjmuubtbowutlide`
(Gestão de Clientes) — somente leitura.

## Stack e deploy

| Camada   | Tech                                                              |
| -------- | ----------------------------------------------------------------- |
| Frontend | Vite 6, React 18, TypeScript, Tailwind, shadcn/ui, TanStack Query |
| Backend  | Supabase Cloud (Postgres + RLS + Auth + Edge Functions Deno)      |
| Testes   | Vitest + Testing Library, Playwright E2E                          |
| Deploy   | Vercel (time `juca1`) — merge em `main` dispara deploy automático |
| URL prod | https://app.promo-finance.com                                     |

## Edge Functions (105 funções Deno — principais abaixo)

- **Financeiro:** categorizar-despesa, conciliacao-ia, executar-regua-cobranca, processar-fila-cobrancas
- **Tributário:** calculo-iva, decidir-regime, executar-fechamento-tributario, gerar-dre-tributaria,
  gerar-sped-ecd, gerar-sped-ecf, simular-presumido, simular-real, simular-simples,
  verificar-conformidade-fiscal
- **NF-e/SEFAZ:** nfe-upload-certificado, sefaz-dfe-dispatcher, sefaz-dfe-puxar, sefaz-manifestar
- **IA:** analise-fluxo-ia, analise-preditiva, copilot-global, detectar-anomalias-financeiras,
  expert-agent, whatsapp-ia-proativo
- **Integrações:** asaas-proxy, asaas-webhook, bitrix24-sync, bitrix24-webhook, bling-proxy,
  bling-webhook, open-finance, n8n-callback, n8n-dispatch
- **Auth/SSO:** aceitar-convite, convidar-contador, scim-server, sso-callback, sso-initiate,
  validar-token-contador
- **Alertas:** enviar-alerta-email, gerar-alertas-dispatcher, send-push-notification

Catálogo completo: `docs/EDGE_FUNCTIONS_CATALOG.md`. Código: `supabase/functions/<nome>/`.

## Integrações externas

| Serviço      | Uso                                  |
| ------------ | ------------------------------------ |
| Bling ERP    | NFe, estoque, vendas                 |
| Asaas        | Boletos, PIX, cobrança               |
| Bitrix24     | Sync CRM/financeiro                  |
| Open Finance | Conciliação bancária                 |
| SEFAZ        | NF-e, DFe, SPED                      |
| WhatsApp     | Cobrança IA proativa (via Evolution) |
| CNPJA        | Consulta CNPJ                        |

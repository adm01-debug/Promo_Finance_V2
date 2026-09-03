# CLAUDE.md — PROMO FINANCE V2

> Sistema financeiro corporativo multi-empresa da Promo Brindes.
> Contas a Pagar/Receber, Conciliacao, Tributario, NF-e/SEFAZ, Cobranca, IA.

## 1. Banco de dados OFICIAL

| O que            | Valor                                                       |
| ---------------- | ----------------------------------------------------------- |
| Projeto Supabase | `bwwbeyolnnzppeuhgkcd` (Cloud)                              |
| URL              | `https://bwwbeyolnnzppeuhgkcd.supabase.co`                  |
| Dashboard        | https://supabase.com/dashboard/project/bwwbeyolnnzppeuhgkcd |
| MCP SQL          | `SUPABASE - PROMO FINANCE V2 - MCP`                         |
| MCP alt          | `PROMO FINANCE V2 - MCP - LOVABLE CLOUD /SUPABASE`          |
| Migrations       | 571+ (timestamp YYYYMMDDHHmmss)                             |
| Tabelas          | 130+                                                        |

### Bancos que NAO sao deste projeto

- Supabase self-hosted VPS AtomicaBR
- `pgxfvjmuubtbowutlide` (Gestao de Clientes) — somente-leitura

### Regras de migration

1. Nunca usar `supabase_apply_migration` — usar `db_query` com DDL direto.
2. Versao = timestamp estritamente crescente. Conferir `SELECT max(version)` antes.
3. Toda DDL = arquivo em `supabase/migrations/` + comentario descritivo.
4. `CREATE INDEX CONCURRENTLY` falha (gateway transacional) — usar `CREATE INDEX` simples.
5. Views com `security_invoker`: padrao desde hardening P15+.

## 2. Stack

| Camada   | Tech                                                              |
| -------- | ----------------------------------------------------------------- |
| Frontend | Vite 6, React 18, TypeScript, Tailwind, shadcn/ui, TanStack Query |
| Backend  | Supabase Cloud (Postgres + RLS + Auth + Edge Functions Deno)      |
| Testes   | Vitest + Testing Library, Playwright E2E                          |
| Deploy   | Lovable Cloud                                                     |
| URL prod | https://app.promo-finance.com                                     |

## 3. Edge Functions (105 funcoes Deno — principais abaixo)

- **Financeiro:** categorizar-despesa, conciliacao-ia, executar-regua-cobranca, processar-fila-cobrancas
- **Tributario:** calculo-iva, decidir-regime, executar-fechamento-tributario, gerar-dre-tributaria, gerar-sped-ecd, gerar-sped-ecf, simular-presumido, simular-real, simular-simples, verificar-conformidade-fiscal
- **NF-e/SEFAZ:** nfe-upload-certificado, sefaz-dfe-dispatcher, sefaz-dfe-puxar, sefaz-manifestar
- **IA:** analise-fluxo-ia, analise-preditiva, copilot-global, detectar-anomalias-financeiras, expert-agent, whatsapp-ia-proativo
- **Integracoes:** asaas-proxy, asaas-webhook, bitrix24-sync, bitrix24-webhook, bling-proxy, bling-webhook, open-finance, n8n-callback, n8n-dispatch
- **Auth/SSO:** aceitar-convite, convidar-contador, scim-server, sso-callback, sso-initiate, validar-token-contador
- **Alertas:** enviar-alerta-email, gerar-alertas-dispatcher, send-push-notification

## 4. Integracoes externas

| Servico      | Uso                                  |
| ------------ | ------------------------------------ |
| Bling ERP    | NFe, estoque, vendas                 |
| Asaas        | Boletos, PIX, cobranca               |
| Bitrix24     | Sync CRM/financeiro                  |
| Open Finance | Conciliacao bancaria                 |
| SEFAZ        | NF-e, DFe, SPED                      |
| WhatsApp     | Cobranca IA proativa (via Evolution) |
| CNPJA        | Consulta CNPJ                        |

## 5. Testes

```sh
bun run test:run     # vitest run
bun run type-check   # tsc --noEmit
bun run lint:strict  # eslint
bun run test:e2e     # playwright
```

Meta: 2689/2689 testes passando, 0 erros TypeScript.

## graphify

This project has a knowledge graph at graphify-out/.

- For codebase questions: `graphify query "<question>"` when graph.json exists.
- For relationships: `graphify path "<A>" "<B>"` or `graphify explain "<concept>"`.
- Read GRAPH_REPORT.md only for broad architecture review.
- After code changes: `graphify update .` (AST-only, no API cost).

## Frescura do Grafo

```sh
git rev-parse --short HEAD
grep "Built from commit" graphify-out/GRAPH_REPORT.md
```

Se divergirem, auto-sync N8N corrige em ate 15 min.
Forcar rebuild: `graphify update . --force`

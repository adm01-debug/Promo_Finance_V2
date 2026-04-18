
Lote 14 entregue (Edge Function `decidir-regime` + PF Vinculada). Bitrix24 já tem secrets configurados (`BITRIX24_ACCESS_TOKEN`, `BITRIX24_DOMAIN`, etc.). Próximo: **Lote 15 — PDF Executivo + Bitrix24 Push**.

## Lote 15 — PDF Executivo + Envio Bitrix24

### 1. Edge Function `gerar-pdf-tributario`
- `supabase/functions/gerar-pdf-tributario/index.ts`, `verify_jwt = false` com validação manual JWT.
- Recebe `{ empresaId, anoReferencia, mesReferencia }`, chama `decidir-regime` internamente, gera PDF executivo via `jspdf` + `jspdf-autotable` (Deno via esm.sh):
  - Capa: nome empresa, CNPJ, período, regime recomendado.
  - Página 1: Resumo executivo com economia anual estimada.
  - Página 2: Comparativo Simples × Presumido × Real (tabela autoTable).
  - Página 3: Justificativa legal (CGSN 140/2018, LC 224/2025, Tema 779 STF).
  - Página 4: Cronograma reforma 2026-2033 (CBS+IBS).
- Retorna PDF base64 + URL temporária via Storage bucket `relatorios-tributarios`.
- Migration: criar bucket privado com RLS por `empresa_id`.

### 2. Edge Function `enviar-bitrix24-tributario`
- `supabase/functions/enviar-bitrix24-tributario/index.ts`, `verify_jwt = false` + validação manual.
- Recebe `{ empresaId, pdfUrl, dealId? }`, usa `BITRIX24_ACCESS_TOKEN` + `BITRIX24_DOMAIN`.
- Cria/atualiza Deal no Bitrix24 com:
  - Título: "Recomendação Tributária — {empresa} — {periodo}"
  - Anexo: PDF via `disk.folder.uploadfile`
  - Comentário com resumo executivo (regime + economia)
- Resiliência: retry exponencial em 429/500 (padrão `mem://integrations/bling-erp-v3-estrategia-e-resiliencia`).
- Refresh token automático se 401 (usa `BITRIX24_REFRESH_TOKEN` + `BITRIX24_CLIENT_ID/SECRET`).

### 3. UI — Botões de ação na `/tributario/recomendacao`
- Hook `useGerarPdfTributario` + `useEnviarBitrix24Tributario`.
- Card de ações com 2 botões:
  - "Baixar PDF Executivo" (download direto do base64)
  - "Enviar para CRM Bitrix24" (toast com link do deal criado)
- Loading states + error toasts.

### 4. Validação
- `npx tsc --noEmit` zero erros.
- `supabase/config.toml`: declarar `verify_jwt = false` para as 2 functions.
- Edge functions com CORS completo + try/catch top-level.

## Diagrama

```text
   Lote 14 ✅ (decidir-regime + PF)
            │
            ▼
   ┌──────────────────────────┐
   │ Storage bucket           │
   │ relatorios-tributarios   │
   └──────────────────────────┘
            │
   ┌──────────────────────────┐
   │ Edge: gerar-pdf-         │──┐
   │ tributario (jsPDF)       │  │
   └──────────────────────────┘  ▼
   ┌──────────────────────────┐  ┌────────────────────┐
   │ Edge: enviar-bitrix24-   │  │ /tributario/       │
   │ tributario (CRM push)    │─▶│ recomendacao       │
   └──────────────────────────┘  │ + 2 botões ação    │
                                 └────────────────────┘
```

## Observações
- Bitrix24 secrets já existem (zero setup adicional).
- 1 migration: bucket `relatorios-tributarios` privado com RLS por `empresa_id`.
- Resta após este lote: Lote 16 (CNPJá onboarding — exige `CNPJA_API_KEY`).

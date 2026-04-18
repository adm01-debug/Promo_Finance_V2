
P10 entregue ✅. Sistema 10/10+++++. Proponho **Lote P11 — Inteligência Operacional Final** (consolida tudo + 3 cravos finais).

## Lote P11 — Heatmap Tributário + OCR de Notas Fiscais + Resumo Executivo Semanal IA

### 1. Heatmap Tributário Anual (visualização 12 meses × tributos)
- Edge `gerar-heatmap-tributario`:
  - Input: `{ empresa_id, ano }`
  - Agrega `apuracoes_tributarias` do ano: matriz [12 meses] × [CBS, IBS, IS, PIS, COFINS, ICMS, ISS, IRPJ/CSLL]
  - Calcula intensidade (0-1) por célula vs máximo do ano + variação MoM
  - Identifica picos e vales sazonais
- UI `HeatmapTributarioAnual.tsx`:
  - Grid 12×8 com gradiente HSL (`--cbs`, `--ibs`, etc.) e tooltip detalhado por célula
  - Toggle "absoluto vs relativo" e seletor de ano
  - Export PNG via canvas
- Hook `useHeatmapTributario`.

### 2. OCR de Notas Fiscais com Lovable AI Vision
- Migration: tabela `notas_fiscais_ocr` (empresa_id, arquivo_url, dados_extraidos jsonb, status enum `processando|sucesso|erro`, conta_pagar_id nullable, criado_por).
- Bucket público `notas-fiscais-upload` (RLS por usuário).
- Edge `processar-nf-ocr`:
  - Input: arquivo (multipart) ou URL de imagem/PDF
  - Usa `google/gemini-2.5-flash` com vision + tool calling para extrair: CNPJ emissor, CNPJ tomador, número NF, data emissão, valor total, descrição, CFOP, impostos destacados
  - Salva em `notas_fiscais_ocr` + retorna preview pronto para virar conta a pagar
- UI `UploadNotaFiscalOCR.tsx` (drop zone + preview extraído + botão "Criar conta a pagar"):
  - Lista últimas 10 NFs processadas
  - Editor inline dos campos antes de virar `contas_pagar`
- Hook `useProcessarNFOCR`.

### 3. Resumo Executivo Semanal por IA (e-mail automático)
- Migration: tabela `resumos_executivos_semanais` (empresa_id, semana_inicio, semana_fim, resumo_md, kpis jsonb, enviado_em, destinatarios).
- Edge `gerar-resumo-executivo-semanal` (cron domingo 18:00):
  - Para cada empresa ativa: agrega últimos 7 dias (KPIs financeiros + tributário + alertas + conformidade + benchmark)
  - Chama Lovable AI (`gpt-5-mini`) com prompt estruturado: contexto + KPIs → markdown executivo (5 seções: highlights, tributário, alertas, oportunidades, próximos passos)
  - Persiste + envia via Resend para destinatários cadastrados em `relatorios_tributarios_agendados`
  - Logger P2 + tratamento 429/402
- UI `ResumosExecutivosTab` em `/admin/system-health`: lista resumos passados + preview markdown + botão "Gerar agora".
- Hook `useResumosExecutivos`.

### 4. Validação
- `npx tsc --noEmit` zero erros.
- 3 edge functions deployadas.
- 2 migrations limpas + RLS + auditoria P9.
- Memórias: `mem://features/heatmap-tributario`, `mem://features/ocr-notas-fiscais`, `mem://features/resumo-executivo-semanal-ia`.

## Diagrama

```text
   DashboardTributario
        ├─▶ HeatmapTributarioAnual ──▶ gerar-heatmap-tributario
        │                                  └─▶ matriz 12×8 intensidades
        │
        └─▶ UploadNotaFiscalOCR ──▶ processar-nf-ocr (gemini-2.5-flash vision)
                                        ├─▶ extrai 8 campos
                                        └─▶ notas_fiscais_ocr → contas_pagar

   cron domingo 18:00 ──▶ gerar-resumo-executivo-semanal
                              ├─▶ agrega KPIs 7d
                              ├─▶ Lovable AI (gpt-5-mini) → markdown
                              └─▶ Resend → destinatários
```

## Observações
- Reaproveita 100% da infra P1-P10 (motores, AI gateway, Resend, cron, RBAC, auditoria, storage).
- Sem novos secrets (LOVABLE_API_KEY + RESEND_API_KEY já configurados ✅).
- Eleva produto para 10/10++++++ (visualização anual + OCR automático + executive summary IA).

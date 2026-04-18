---
name: OCR de Notas Fiscais
description: Edge processar-nf-ocr usa Lovable AI (gemini-2.5-flash) com vision + tool calling para extrair 8+ campos de NFs e cria registros em notas_fiscais_ocr
type: feature
---
- Tabela `notas_fiscais_ocr` (status enum `processando|sucesso|erro`, `dados_extraidos jsonb`, `conta_pagar_id` para conversão posterior). RLS por `criado_por`, admin pode ver tudo.
- Bucket privado `notas-fiscais-upload` (RLS por folder = uid).
- Edge `processar-nf-ocr`: aceita base64 ou URL; chama gemini-2.5-flash com `tools: [extract_nf_data]` + `tool_choice: extract_nf_data`. Extrai: cnpj_emissor, razao_social, cnpj_tomador, numero_nf, data_emissao, valor_total, descricao, cfop, impostos (icms/ipi/pis/cofins/iss/cbs/ibs).
- Hook `useProcessarNFOCR` (mutation + lista últimas 10).
- UI `UploadNotaFiscalOCR` (drop zone + preview extraído + lista) embutida no DashboardTributario.
- Tratamento 429/402 do AI gateway com mensagens claras.

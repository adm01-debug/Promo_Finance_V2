---
name: Exportação SPED EFD-Contribuições
description: Edge exportar-sped-contribuicoes gera TXT preliminar com registros 0000/0001/0140/M100/M200/M210/9999, faz upload e retorna URL assinada 24h
type: feature
---
Edge `exportar-sped-contribuicoes` (admin/financeiro):
- Input: `{ empresa_id, periodo: 'YYYY-MM' }`
- Lê `empresas` + `apuracoes_tributarias` do período
- Gera TXT layout EFD-Contribuições preliminar (registros 0000, 0001, 0140, 0990, M001, M100, M200, M210, M990, 9001, 9990, 9999)
- Upload em `relatorios-tributarios/sped/EFD-Contrib-{cnpj}-{YYYYMM}.txt`
- Retorna URL assinada 24h
- Logger P2

UI: botão "SPED" no header do `DashboardTributario` (variant outline). Hook `useExportarSped` mutation que abre URL em nova aba.

**Importante**: arquivo é PRELIMINAR. Sempre validar no PVA-EFD da RFB antes da entrega oficial.

---
name: Validador de Conformidade Fiscal
description: Edge verificar-conformidade-fiscal roda 8 checks ponderados, persiste resultado em verificacoes_conformidade e dispara alerta se score < 70
type: feature
---
Tabela `verificacoes_conformidade` (empresa_id, periodo, score 0-100, nivel enum, itens jsonb) com RLS admin/financeiro leitura, service role escrita.

Edge `verificar-conformidade-fiscal` executa 8 checks:
1. Apurações em atraso (peso 9)
2. Alertas críticos abertos (peso 8)
3. DARFs vencidos (peso 10)
4. Regime tributário cadastrado (peso 7)
5. Análise de regime ótimo recente via cache (peso 5)
6. Apuração do período existe (peso 8)
7. Alertas alta prioridade controlados (peso 6)
8. Relatórios automáticos agendados (peso 4)

Score ponderado, níveis: excelente ≥90, bom ≥75, atencao ≥60, critico <60. Score < 70 cria alerta tributário automático.

UI: `ConformidadeFiscalCard.tsx` (gauge animado + lista de pendências). Hook `useConformidadeFiscal` carrega último resultado persistido + mutation `verificar`.

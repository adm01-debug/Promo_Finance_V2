
Usuário enviou os 6 arquivos do Roadmap Motor Tributário (README + 5 fases, 20 etapas). Esse é um escopo enorme (32-50h estimadas) com 20 etapas sequenciais. O projeto atual já tem MUITO do módulo tributário implementado (Lotes 1-11 entregues: simulações de regimes, elisão com 9 estratégias, alertas, cron, telemetria, a11y, etc.).

Preciso fazer um gap analysis entre o roadmap enviado e o que já existe, então propor lotes incrementais para fechar lacunas — não reimplementar o que já está pronto.

## Plano — Auditoria do Roadmap vs. Estado Atual + Lotes de Convergência

### Etapa 0 — Gap Analysis (próxima execução)
Mapear cada uma das 20 etapas do roadmap contra o código atual:
- Tabelas existentes no schema `tributario` vs. exigidas
- Edge Functions deployadas vs. exigidas (`calcular-rbt12`, `calcular-fator-r`, `simular-simples/presumido/real`, `decidir-regime`, `identificar-elisao`, `gerar-alertas`, `gerar-pdf`, `enviar-bitrix24`)
- Telas (`/empresa`, `/simulacao`, `/recomendacao`, `/faturamento`, `/folha`, `/dashboard`, `/elisao`, `/reforma`, `/pf-vinculada`, `/alertas`)
- Seeds fiscais (alíquotas Simples 5 anexos × 6 faixas, NCMs brindes, CNAEs Fator R)

### Lotes propostos (ordem de prioridade)

**Lote 12 — Fechamento Motor de Cálculo (FASE 2)**
Garantir 5 Edge Functions canônicas com fórmulas oficiais, tratamento RBT12 < 13 meses (Resolução CGSN 140/2018 art. 21), Fator R com CNAEs sujeitos, Anexo V→III por Fator R ≥ 28%, LC 224/2025 no Presumido, créditos PIS/COFINS Tema 779 STF no Real. Testes unitários por faixa.

**Lote 13 — Decisão e UI (FASE 3 gaps)**
Edge Function `decidir-regime` orquestradora + tela `/recomendacao` com Resumo Executivo (regime ótimo + 3 cenários ranqueados + justificativa legal) + CRUD `/faturamento` e `/folha` com importação CSV + Dashboard final com gráficos comparativos.

**Lote 14 — Reforma Tributária + PF Vinculada (FASE 4 gaps)**
Módulo `/reforma` projetando CBS+IBS 2026-2033 com cronograma de transição + módulo `/pf-vinculada` aplicando Lei 15.270/2025 (IRPFM 10% sobre dividendos > R$ 50k/mês).

**Lote 15 — Produtização (FASE 5)**
Geração de PDF executivo (`gerar-pdf` Edge Function via jsPDF/autoTable seguindo padrão `mem://features/advanced-corporate-reporting-engine`) + integração Bitrix24 (Edge Function proxy seguindo `mem://architecture/external-api-proxy-pattern`).

**Lote 16 — Onboarding CNPJá (FASE 1 Etapa 03)**
Integração com API CNPJá no onboarding para autopreencher dados da empresa via CNPJ.

### Validações por lote
- `npx tsc --noEmit` zero erros
- `npx vitest run` 100% verde
- Migrations idempotentes
- RLS estrita em todas as tabelas novas

## Diagrama

```text
   Roadmap 20 etapas (uploads)
            │
            ▼
   ┌─────────────────────┐
   │ Lote 12: Gap Motor  │──┐
   │ (FASE 2 cálculo)    │  │
   └─────────────────────┘  │
   ┌─────────────────────┐  │
   │ Lote 13: Decisão+UI │──┤
   └─────────────────────┘  ▼
   ┌─────────────────────┐  ┌────────────────┐
   │ Lote 14: Reforma+PF │─▶│ Roadmap 100%   │
   └─────────────────────┘  │ executado      │
   ┌─────────────────────┐  │ + base atual   │
   │ Lote 15: PDF+Bitrix │──┤ preservada     │
   └─────────────────────┘  │                │
   ┌─────────────────────┐  │                │
   │ Lote 16: CNPJá      │──┘                │
   └─────────────────────┘                   │
                                             ▼
                              ┌─────────────────────────┐
                              │ Sistema 10/10 absoluto  │
                              │ + roadmap completo      │
                              └─────────────────────────┘
```

## Observações
- Reaproveitar 100% do código existente (Lotes 1-11). NUNCA reimplementar.
- Secrets necessários para Lote 15-16: `BITRIX24_WEBHOOK_URL`, `CNPJA_API_KEY` — solicitarei via `add_secret` no momento certo.
- Sem mexer em `client.ts`/`types.ts`/`config.toml`.
- Próxima ação ao aprovar: executar gap analysis detalhado e iniciar Lote 12.

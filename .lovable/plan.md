
Continuar a refatoração modular dos arquivos com mais de 400 linhas, finalizando as integrações pendentes do lote anterior e avançando com novos arquivos.

## Lote atual (próximos 6 arquivos + finalizações pendentes)

**Finalizações pendentes:**
1. **`Cobrancas.tsx`** — integrar `CobrancaKpis`, `ReguaCobrancaVisual` e `MetricasPorCanal` já criados.
2. **`Bitrix24.tsx`** — concluir integração dos blocos restantes com `BitrixClientsTab`, `BitrixMappingTab`, `BitrixConfigTab`.

**Novos arquivos para refatorar:**
3. **`ContaReceberDetailDrawer.tsx`** (~335 linhas com tabs ainda pesadas) — extrair `DrawerTimelineTab.tsx`, `DrawerCobrancasTab.tsx` e `DrawerAnexosTab.tsx`.
4. **`AdminTelemetria.tsx`** (~417 linhas) — extrair `TelemetriaKPIs.tsx` e `TelemetriaFilters.tsx`.
5. **`ModuloIRPJCSLL.tsx`** (~401 linhas) — extrair `IRPJCSLLResultadoCard.tsx` e `IRPJCSLLHistoricoTable.tsx`.
6. **`Fornecedores.tsx`** — extrair `FornecedoresKPIs.tsx` e `FornecedoresFilters.tsx`.

## Abordagem

- Para cada arquivo: ler, identificar blocos coesos (tabs, dialogs, tabelas, KPIs), mover para `src/components/<dominio>/<arquivo>/` ou `src/pages/<rota>/`.
- Props mínimas, tipagem forte, preservar comportamento.
- Validar com `npx tsc --noEmit` ao final.

## Diagrama

```text
ArquivoOriginal.tsx (>400 linhas)
        │
        ├── extrai → KPIs/Filters (header)
        ├── extrai → Tabs/Dialogs (conteúdo)
        └── compõe sub-componentes
```

## Observações

- Não tocar em `src/integrations/supabase/*`.
- Sem mudanças de comportamento, apenas reorganização estrutural.
- Após este lote, restarão ~38 arquivos acima de 400 linhas — continuarei automaticamente nas próximas rodadas conforme solicitado.

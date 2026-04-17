
Continuar a refatoração do próximo lote de arquivos com mais de 400 linhas, seguindo a estratégia já estabelecida.

## Próximo lote (6 arquivos)

Vou identificar e refatorar os 6 maiores arquivos restantes acima de 400 linhas. Com base no que já foi feito e nos arquivos visíveis, os candidatos prováveis são:

1. **`Clientes.tsx`** (~511 linhas) — extrair seção de filtros/header para `ClientesFilters.tsx` e KPIs para `ClientesKPIs.tsx`.
2. **`ContaReceberDetailDrawer.tsx`** (~335 linhas, mas com tabs ainda pesadas) — extrair `DrawerHistoricoTab.tsx` e `DrawerCobrancaTab.tsx`.
3. **`AdminTelemetria.tsx`** (~417 linhas) — extrair `TelemetriaKPIs.tsx` e `TelemetriaFilters.tsx`.
4. **`ModuloIRPJCSLL.tsx`** (~401 linhas) — extrair `IRPJCSLLResultado.tsx` e `IRPJCSLLHistorico.tsx`.
5. **`ContaPagarForm.tsx`** / outro form pesado restante — extrair seções de recorrência/anexos.
6. Mais um arquivo identificado durante a varredura (`Fornecedores.tsx`, `ApuracaoMensal.tsx`, ou similar) — extrair tabela/filtros.

## Abordagem técnica

- Para cada arquivo: ler conteúdo completo, identificar blocos coesos (tabs, dialogs, seções de form, tabelas) e mover para sub-componentes em pastas dedicadas (`src/components/<dominio>/<arquivo>/`).
- Manter as props mínimas necessárias e tipagem forte.
- Preservar comportamento, handlers e estilos.
- Validar com `npx tsc --noEmit` ao final.

## Diagrama

```text
ArquivoOriginal.tsx (>400 linhas)
        │
        ├── extrai → SubComponenteA.tsx (UI/seção coesa)
        ├── extrai → SubComponenteB.tsx (tab/dialog)
        └── importa e compõe sub-componentes
```

## Observações

- Não vou tocar em `src/integrations/supabase/*` nem em arquivos auto-gerados.
- Após este lote, restarão ~40 arquivos acima de 400 linhas — continuarei nas próximas rodadas se solicitado.
- Sem mudanças de comportamento, apenas reorganização estrutural.

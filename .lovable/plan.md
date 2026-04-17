
Lote 9 itens 1-2 já entregues. Restam itens 3-5 do Lote 9 para fechar 10/10 sustentado.

## Lote 9 (continuação) — Resiliência + UX + Testes E2E

### 3. Resiliência das Edge Functions tributárias
- Auditar `gerar-alertas-tributarios`, `simular-regimes`, `analisar-elisao` (verificar se existem):
  - `try/catch` top-level com retorno 500 + CORS sempre.
  - Structured logging: `console.log(JSON.stringify({level, event, fn, ...ctx}))`.
  - `AbortController` com timeout 30s em fetches externos.
  - Retry com exponential backoff (3 tentativas: 500ms, 1s, 2s) em chamadas Supabase falhas — padrão `mem://integrations/bling-erp-v3-estrategia-e-resiliencia`.

### 4. UX — feedback visual em ações longas
- **`SimulacaoRegimes.tsx`**: progress indicator com 3 steps (Simples → Presumido → Real) durante cálculo, usando Skeleton + label do regime atual.
- **`OportunidadesElisao.tsx`**: empty state ilustrado (ícone + texto + CTA "Importar histórico") quando nenhuma oportunidade.
- **`CsvImportDialog.tsx`**: barra de progresso visual (`<Progress>`) por linha processada — já tem contagem numérica, falta visual.

### 5. Testes E2E do orquestrador de elisão
- `src/lib/tributario/elisao/__tests__/orquestrador-elisao.e2e.test.ts`:
  - Cobertura das 5+ estratégias: Lucro Real vs Presumido, PAT, Lei do Bem, Reorganização Societária, Diferimento ICMS.
  - Edge cases: empresa sem despesas dedutíveis, oportunidade < R$ 1k (threshold mínimo), múltiplas estratégias conflitantes (priorização por economia).

### 6. Validação final
- `npx tsc --noEmit` zero erros.
- `npx vitest run` 100% verde (~985 testes).

## Diagrama

```text
   Lote 9 itens 1-2 ✅
            │
            ▼
   ┌─────────────────────────┐
   │ Edge Fns resilientes    │──┐
   │ (timeout+retry+log)     │  │
   └─────────────────────────┘  ▼
   ┌─────────────────────────┐  ┌──────────────────┐
   │ UX progress + empty     │─▶│ 10/10 sustentado │
   │ state + progress bar    │  │   completo       │
   └─────────────────────────┘  └──────────────────┘
   ┌─────────────────────────┐  ▲
   │ E2E orquestrador elisão │──┘
   └─────────────────────────┘
```

## Observações
- Sem migrations novas. Sem mexer em `client.ts`/`types.ts`/`config.toml`.
- Edge Functions inexistentes serão puladas (apenas as que existem).
- Após este lote: Lote 9 100% concluído.

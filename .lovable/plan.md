
Lote 12 entregue. Restam 4 lotes do roadmap. Proponho continuar com **Lote 13 — CRUDs Faturamento + Folha (FASE 3)**, que destrava UX real para usuário alimentar o motor sem editar JSON.

## Lote 13 — CRUDs `/faturamento` e `/folha` + Importação CSV

### 1. Schema (migration)
- `tributario_faturamento_mensal` (empresa_id, ano, mes, receita_bruta, receita_servicos, receita_revenda, receita_industria, receita_exportacao, observacoes)
- `tributario_folha_mensal` (empresa_id, ano, mes, salarios, encargos, pro_labore, observacoes)
- RLS estrita: `auth.uid()` via `empresa_id` → `user_empresas`
- Índice composto `(empresa_id, ano, mes)` único

### 2. Hooks
- `useFaturamentoMensal(empresaId)`: list/upsert/delete via React Query, queryKeys centralizados
- `useFolhaMensal(empresaId)`: idem
- Cálculo automático de RBT12 derivado dos últimos 12 meses

### 3. Páginas
- `/tributario/faturamento`: tabela editável (12 meses), totais, gráfico linha, importar CSV
- `/tributario/folha`: tabela editável, Fator R calculado em tempo real, importar CSV
- Importador CSV reaproveita `src/lib/csv-importer.ts`

### 4. Integração com motor
- `useSimulacaoRegimes` lê automaticamente dos CRUDs quando empresa selecionada (fallback para parâmetros manuais)

### 5. Validação
- `npx tsc --noEmit` zero erros
- Testes unitários dos hooks (mock supabase)
- A11y: labels, ARIA em tabelas editáveis

## Diagrama

```text
   Lote 12 ✅ (/recomendacao)
            │
            ▼
   ┌──────────────────────┐
   │ Migration:           │
   │ faturamento + folha  │
   └──────────────────────┘
            │
   ┌──────────────────────┐
   │ Hooks CRUD + RBT12   │──┐
   └──────────────────────┘  │
                             ▼
   ┌──────────────────────┐  ┌────────────────────┐
   │ /tributario/         │  │ Motor alimentado   │
   │ faturamento + folha  │─▶│ por dados reais    │
   └──────────────────────┘  │ persistidos        │
            │                └────────────────────┘
   ┌──────────────────────┐
   │ Importador CSV       │
   └──────────────────────┘
```

## Observações
- 1 migration nova, 2 tabelas, RLS estrita.
- Reaproveita `csv-importer.ts`, `queryClient.ts`, padrão de hooks existente.
- Sem mexer em `client.ts`/`types.ts`/`config.toml`.
- Próximos lotes restantes após este: Lote 14 (Edge `decidir-regime` opcional), Lote 15 (Bitrix24 — precisa secret), Lote 16 (CNPJá — precisa secret).

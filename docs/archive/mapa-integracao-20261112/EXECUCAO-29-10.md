# Promo_Finance_V2: execução de 29/10/2026

## PRs novos

| PR | O que é | Validação | Estado |
|---|---|---|---|
| **#198** | Lote único de dependências: postcss ^8.5.31, react-hook-form ^7.91.0, radix slot 1.5.0/hover-card/tabs/progress/toggle-group 1.2.1; **remove** nanoid e @tanstack/react-query-devtools (nenhum import, conferido com `git grep`; auditoria de 12/10 §6.4); grupo `radix-ui` no dependabot.yml | bun 1.3.11 (`.bun-version`); `tsc` ok, `vite build` ok, vitest com 3.023 testes, todos passando; CI: obrigatórios verdes | **PRONTO** |
| **#199** | fix(conciliacao): `handleManualSuccess` (`useConciliacaoPage.ts:274`) confirmava a conciliação de novo, mas o `ConciliacaoManualDialog` já confirma (com `ajusteCentavos`): gravação dupla e toast em dobro. Extraído do #131 | teste invertido (agora garante que não há 2ª chamada); vitest hooks + conciliação com 283 testes, todos passando; tsc ok; CI: obrigatórios verdes | **PRONTO** |

Ordem (o ramo é strict: depois do 1º merge, o 2º fica BEHIND; o script roda update-branch e para):
```
gh pr merge 198 -R adm01-debug/Promo_Finance_V2 --squash
gh pr merge 199 -R adm01-debug/Promo_Finance_V2 --squash
```

## Fechados (com comentário)

| PR | Motivo |
|---|---|
| #182 postcss, #179 react-hook-form, #174/#176/#183/#178/#177 radix | incorporados ao #198 (os 7 conflitavam entre si no bun.lock) |
| #181 nanoid, #180 react-query-devtools | libs sem uso; removidas no #198 |
| #188 | obsoleto: a main já tem a guarda PROD_PROJECT_REF e os docs refeitos (#195/#196); também estava em conflito |
| #115 | obsoleto: plano de workflows de 27/09, superado por #195/#196 |

## Bloqueados, precisam de OK do dono

- **#131** (shims do Supabase Preview): **não mesclar.** Comentei: 52 migrations com timestamp antigo travariam o prod-migrate (ledger divergente), e há DROPs de policies de `profiles` e de `has_permission`. Precisa de OK do dono e de reparo do ledger. A única correção de app que estava nele foi extraída para o #199.
- **#175** recharts 2→3 (major, Quality Gate vermelho): fora do escopo de hoje; precisa de migração.
- **#200** (docs CI) foi aberto por outro agente às 20:24; não revisei.

---
Gerado em 29/10/2026 pelo Claude (dev senior). Nada foi mesclado depois da regra do coordenador; só o #109 do Promo_Brindes_V1 entrou antes dela.

---
name: Auditoria de testes P15 — baseline de qualidade
description: Baseline 1.012 testes unitários passando (100%), 0 erros TS, 4 RLS críticas corrigidas (notas_fiscais_ocr, resumos_executivos_semanais, acoes_recomendadas, storage relatorios-tributarios)
type: feature
---

## Baseline P15 (2026-04-18)

- **Vitest**: 51 arquivos, 1.012 testes, 100% pass, 50s duração
- **TypeScript**: `tsc --noEmit` zero erros
- **Security**: 4 vulnerabilidades RLS críticas corrigidas; migration `p15_rls_hardening_4_critical_findings`

## Hardening RLS aplicado

- `notas_fiscais_ocr` SELECT → `auth.uid() = criado_por OR has_any_role(admin/financeiro)`
- `resumos_executivos_semanais` SELECT → `has_any_role(admin/financeiro)`
- `acoes_recomendadas` SELECT → `has_any_role(admin/financeiro)` (era `true` aberto)
- `storage.objects` bucket `relatorios-tributarios` SELECT → `has_any_role(admin/financeiro)`

## Itens ignorados (justificativa permanente)

- `realtime.messages` sem RLS → limitação plataforma; tabelas-base já têm RLS
- `Extension in Public` (pg_net, pg_cron) → padrão Supabase, mover quebra cron P13

## Relatório

`/mnt/documents/auditoria-testes-p15.md`

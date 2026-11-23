# Módulo Tributário — Reforma Tributária (RT) / Receita Federal

Este documento descreve o estado do módulo de Reforma Tributária após a
execução do plano de conformidade em 100 etapas. O plano detalhado vive em
`docs/receitafederal/PLANO_CONFORMIDADE_RT_RECEITAFEDERAL_100_ETAPAS.md`.

## Visão geral

O módulo `reforma-tributaria` calcula CBS/IBS/IS e orienta a apuração e o
cumprimento de obrigações acessórias introduzidas pela **LC 214/2025** e pela
**EC 132/2023**. O motor local (sem chamadas a calculadora externa) é a única
via de cálculo, conforme **ADR-004**.

## Regras de negócio principais

| Tema | Comportamento |
|---|---|
| CBS | alíquota definida por `cClassTrib`; transição 2026 = 0,9%, plena 2027 = ~9% |
| IBS | UF + Municipal; transição 2026 = 0,1%, plena 2033 = ~18% |
| IS | Imposto Seletivo, grupo próprio por item |
| Crédito | apenas NF-e com grupo `xml_destacado` e `efeito_tributario = true` |
| 2026 | resultado marcado "informativo — compensável com PIS/COFINS, dispensa art. 348" |
| Split Payment | aguardando ato conjunto do CGIBS + RFB + Banco Central (piloto 15/10/2026) |

## Estrutura de arquivos

- `src/lib/reforma-tributaria/` — motor de cálculo e simulador
- `src/lib/tributario/obrigacoes/` — catálogo de obrigações acessórias e calendário
- `src/lib/nfe/parse-ibscbs.ts` — parser do grupo IBS/CBS/IS da NF-e (etapa 41)
- `src/components/reforma-tributaria/` — painéis (Apuração, Split, Simulador, Conciliação)
- `supabase/functions/_shared/obrigacoes/` — espelho Deno do catálogo (drift guard)
- `supabase/functions/exportar-sped-contribuicoes/` — bloqueia EFD-Contribuições ≥ 2027-01
- `supabase/functions/gerar-pdf-tributario/` — PDF com memória de cálculo IBS/CBS

## Testes

- `src/lib/tributario/__tests__/` — 80+ arquivos de teste (apuração, obrigações, paridade)
- `src/lib/__tests__/rfb-paridade.test.ts` — fixtures NT 2025.002 (paridade local × RFB)
- `src/lib/tributario/__tests__/conciliacao-extrato.test.ts` — diff por chave de acesso
- `e2e/rt-ponta-a-ponta.e2e.ts` — jornada produto → NF-e → XML → crédito → apuração

## Fases executadas

Fases 0-5, 8, 9 e 10 do plano foram executadas. As fases 6-7 foram descartadas
por **ADR-004** (não há calculadora remota; motor local é a única via).

## Encerramento (etapa 100)

- ADR-003: auditoria do motor de RT (21/11/2026) — achados resolvidos no plano
- `CHANGELOG.md`: seção `[Unreleased]` documenta as etapas 88-96
- `VERSOES_RFB.md`: tags em uso (leiaute NF-e 4.00; NT 2025.002-RTC v1.51+)

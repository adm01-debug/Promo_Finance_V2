# Dossiê PR #131 — fix shims Supabase Preview

**Analisado em:** 2026-11-09  
**Veredito:** AGUARDANDO_HUMANO

## Estado verificado
- `mergeable: CONFLICTING` — 90 arquivos em conflito com main
- `mergeStateStatus: DIRTY`
- Quality Gate: FAILURE (pre-existente ao conflito)

## Causa
PR aberta em setembro/2026 com base em main antigo. Desde então, 571+ migrations e centenas de commits avançaram main. O conflito não é de um arquivo específico — é divergência estrutural em ~90 arquivos de shims/interfaces Supabase Preview.

## Por que AGUARDANDO_HUMANO
Resolver 90 arquivos de conflito exige decisão de escopo: o conteúdo original da PR ainda faz sentido dado o estado atual do projeto? Há partes já implementadas em main por outras vias? Requer auditoria manual do dono.

## Ação necessária
Dono decide: fechar e reaplicar manualmente o que ainda fizer sentido, ou descartar.

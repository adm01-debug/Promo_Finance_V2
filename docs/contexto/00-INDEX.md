# CONTEXTO PARA AGENTES DE IA — ÍNDICE ÚNICO

> Gerado automaticamente por indice.py · 2026-11-16 16:11 UTC · HEAD `9003088882` · Não edite à mão.

Um sistema, três fontes de verdade, três produtores independentes. **Leia este arquivo e vá direto à fonte certa.** Cada fato tem um dono: se duas fontes discordarem, vale o dono.

## Onde está cada coisa

| Preciso de… | Fonte (dona do fato) | Onde ler | Estado |
|---|---|---|---|
| Regras que não podem ser quebradas: RLS por operação, estados e transições, validações, fórmulas, prazos, erros de negócio, testes como especificação, inconsistências código×schema (NÃO VERIFICADO) e regras humanas (`manual/`) | **regras de negócio** | `docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md` | ok · 0 min atrás |
| Tabelas, colunas, RLS/políticas, funções, triggers, cron, storage, lints — **como está em produção agora** | **banco real** | `docs/contexto/supabase/README.md` | desatualizado · 96 min atrás · ⚠️ desatualizado há 1h36 |
| Rotas, telas, módulos, hooks, edge functions, grafo de dependências, testes, scripts, convenções | **código** | `docs/contexto/codigo/INDEX.md` | ok · 0 min atrás |

## Ordem de leitura antes de qualquer tarefa ou planejamento

1. **regras de negócio** — Qualquer mudança de comportamento · Antes de criar status/valor/validação · Antes de planejar.
2. **banco real** — Vou tocar tabela/coluna/política/função SQL · Quero saber se algo existe de verdade no banco.
3. **código** — Vou mexer em tela/rota/hook/edge · Preciso saber onde uma coisa vive e quem a usa.

## Regras do protocolo

- Tabela/coluna/política existe? → **banco real**. Migrations do repo são histórico, não estado.
- Onde fica, quem chama, o que importa o quê? → **código**.
- Pode fazer isso? Qual estado vem depois? Qual o limite? → **regras de negócio** (inclui `manual/`, escrito por humanos, prioridade máxima).
- Item listado como **NÃO VERIFICADO** ou **inconsistência** em qualquer fonte: confirme na fonte dona antes de assumir.
- Nada aqui é editado à mão. Para registrar uma regra que só o negócio sabe, escreva em `manual/` da fonte de regras.

<details><summary>Arquivos de <b>banco real</b> (`docs/contexto/supabase/`)</summary>

- `docs/contexto/supabase/CHANGELOG.md`
- `docs/contexto/supabase/README.md`
- `docs/contexto/supabase/auth.md`
- `docs/contexto/supabase/cron-runs.md`
- `docs/contexto/supabase/cron.md`
- `docs/contexto/supabase/edge-functions.md`
- `docs/contexto/supabase/edge-functions/aceitar-convite/README.md`
- `docs/contexto/supabase/edge-functions/analise-fluxo-ia/README.md`
- `docs/contexto/supabase/edge-functions/analise-preditiva/README.md`
- `docs/contexto/supabase/edge-functions/analyze-document/README.md`
- `docs/contexto/supabase/edge-functions/api-keys-manage/README.md`
- `docs/contexto/supabase/edge-functions/asaas-proxy/README.md`
- `docs/contexto/supabase/edge-functions/asaas-webhook/README.md`
- `docs/contexto/supabase/edge-functions/benchmarking-setorial/README.md`
- `docs/contexto/supabase/edge-functions/bitrix24-sync/README.md`
- `docs/contexto/supabase/edge-functions/bitrix24-webhook/README.md`
- `docs/contexto/supabase/edge-functions/bling-proxy/README.md`
- `docs/contexto/supabase/edge-functions/bling-webhook/README.md`
- `docs/contexto/supabase/edge-functions/calcular-health-score-operacional/README.md`
- `docs/contexto/supabase/edge-functions/calcular-slo-metrics-diario/README.md`
- `docs/contexto/supabase/edge-functions/calculo-iva/README.md`
- `docs/contexto/supabase/edge-functions/categorizar-despesa/README.md`
- `docs/contexto/supabase/edge-functions/ci-security-gate-log/README.md`
- `docs/contexto/supabase/edge-functions/cnpja-lookup/README.md`
- `docs/contexto/supabase/edge-functions/comparar-benchmark-setorial/README.md`
- `docs/contexto/supabase/edge-functions/compare-schemas/README.md`
- `docs/contexto/supabase/edge-functions/conciliacao-ia/README.md`
- `docs/contexto/supabase/edge-functions/conciliacao-proxy/README.md`
- `docs/contexto/supabase/edge-functions/consulta-tributaria/README.md`
- `docs/contexto/supabase/edge-functions/contabilizar-evento/README.md`
- `docs/contexto/supabase/edge-functions/convidar-contador/README.md`
- `docs/contexto/supabase/edge-functions/convidar-usuario/README.md`
- `docs/contexto/supabase/edge-functions/copilot-global/README.md`
- `docs/contexto/supabase/edge-functions/copilot-tributario/README.md`
- `docs/contexto/supabase/edge-functions/decidir-regime/README.md`
- `docs/contexto/supabase/edge-functions/detectar-anomalias-financeiras/README.md`
- `docs/contexto/supabase/edge-functions/digest-silenciamentos-erro/README.md`
- `docs/contexto/supabase/edge-functions/enviar-alerta-email/README.md`
- `docs/contexto/supabase/edge-functions/enviar-bitrix24-tributario/README.md`
- `docs/contexto/supabase/edge-functions/enviar-convite-organizacao/README.md`
- `docs/contexto/supabase/edge-functions/enviar-digest-conformidade/README.md`
- `docs/contexto/supabase/edge-functions/enviar-relatorios-tributarios-agendados/README.md`
- `docs/contexto/supabase/edge-functions/executar-analise-preditiva/README.md`
- `docs/contexto/supabase/edge-functions/executar-fechamento-tributario/README.md`
- `docs/contexto/supabase/edge-functions/executar-regua-cobranca/README.md`
- `docs/contexto/supabase/edge-functions/executar-relatorios/README.md`
- `docs/contexto/supabase/edge-functions/expert-agent/README.md`
- `docs/contexto/supabase/edge-functions/exportar-sped-contribuicoes/README.md`
- `docs/contexto/supabase/edge-functions/external-data/README.md`
- `docs/contexto/supabase/edge-functions/gerar-acoes-recomendadas/README.md`
- `docs/contexto/supabase/edge-functions/gerar-alertas-dispatcher/README.md`
- `docs/contexto/supabase/edge-functions/gerar-alertas-tributarios/README.md`
- `docs/contexto/supabase/edge-functions/gerar-alertas/README.md`
- `docs/contexto/supabase/edge-functions/gerar-dre-tributaria/README.md`
- `docs/contexto/supabase/edge-functions/gerar-heatmap-tributario/README.md`
- `docs/contexto/supabase/edge-functions/gerar-pacote-evidencias/README.md`
- `docs/contexto/supabase/edge-functions/gerar-pdf-tributario/README.md`
- `docs/contexto/supabase/edge-functions/gerar-relatorio-anual/README.md`
- `docs/contexto/supabase/edge-functions/gerar-resumo-executivo-semanal/README.md`
- `docs/contexto/supabase/edge-functions/gerar-resumo-financeiro-diario/README.md`
- `docs/contexto/supabase/edge-functions/gerar-snapshots-conformidade/README.md`
- `docs/contexto/supabase/edge-functions/gerar-sped-ecd/README.md`
- `docs/contexto/supabase/edge-functions/gerar-sped-ecf/README.md`
- `docs/contexto/supabase/edge-functions/get-mapbox-token/README.md`
- `docs/contexto/supabase/edge-functions/get-vapid-key/README.md`
- `docs/contexto/supabase/edge-functions/health/README.md`
- `docs/contexto/supabase/edge-functions/insights-relatorio/README.md`
- `docs/contexto/supabase/edge-functions/log-sped-bitrix24/README.md`
- `docs/contexto/supabase/edge-functions/mcp-query/README.md`
- `docs/contexto/supabase/edge-functions/monitor-health/README.md`
- `docs/contexto/supabase/edge-functions/monitorar-erros-frontend/README.md`
- `docs/contexto/supabase/edge-functions/n8n-callback/README.md`
- `docs/contexto/supabase/edge-functions/n8n-dispatch/README.md`
- `docs/contexto/supabase/edge-functions/nfe-upload-certificado/README.md`
- `docs/contexto/supabase/edge-functions/nfe-vinculo-proxy/README.md`
- `docs/contexto/supabase/edge-functions/notify-performance-alert/README.md`
- `docs/contexto/supabase/edge-functions/notify-saved-filter/README.md`
- `docs/contexto/supabase/edge-functions/open-finance/README.md`
- `docs/contexto/supabase/edge-functions/overlay-rejeicoes-auditoria/README.md`
- `docs/contexto/supabase/edge-functions/prever-carga-tributaria/README.md`
- … +332

</details>

<details><summary>Arquivos de <b>código</b> (`docs/contexto/codigo/`)</summary>

- `docs/contexto/codigo/INDEX.md`
- `docs/contexto/codigo/banco.json`
- `docs/contexto/codigo/baseline.json`
- `docs/contexto/codigo/componentes.json`
- `docs/contexto/codigo/convencoes.json`
- `docs/contexto/codigo/edge-functions.json`
- `docs/contexto/codigo/ferramentas.json`
- `docs/contexto/codigo/grafo-arestas.json`
- `docs/contexto/codigo/grafo-graphify.json`
- `docs/contexto/codigo/grafo.json`
- `docs/contexto/codigo/hooks.json`
- `docs/contexto/codigo/logica.json`
- `docs/contexto/codigo/manifest.json`
- `docs/contexto/codigo/modulos.json`
- `docs/contexto/codigo/rotas.json`
- `docs/contexto/codigo/scripts.json`
- `docs/contexto/codigo/testes.json`

</details>

<details><summary>Arquivos de <b>regras de negócio</b> (`docs/contexto/regras/`)</summary>

- `docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md`
- `docs/contexto/regras/10-ACESSO-E-SEGURANCA.md`
- `docs/contexto/regras/11-GLOSSARIO-E-LACUNAS.md`
- `docs/contexto/regras/context.json`
- `docs/contexto/regras/manifest.json`
- `docs/contexto/regras/manual/README.md`
- `docs/contexto/regras/manual/TEMPLATE-regras-de-negocio.md`

</details>

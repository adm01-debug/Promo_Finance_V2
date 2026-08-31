# Matriz de Autenticação das Edge Functions (103/103)

> **Etapa 048 do programa de 100 etapas** (pré-classificação estática). **Base:** `origin/main` @ `5093a727` (2026-08-30).
> **Objetivo:** classificar o contrato de autenticação das 103 Edge Functions de `supabase/functions/`, conforme o handoff: *"Classificar as 99 funções locais sem JWT: JWT, webhook/HMAC, cron secret, chamada interna ou público controlado. Testar cada exceção."*
> **⚠️ Natureza da evidência:** análise **estática** de código (grep dirigido dos `index.ts`, `config.toml` e `_shared/`). **Nenhum teste de runtime foi executado ainda** — os testes negativos das exceções são a continuação da etapa 048 (etapas 042/043).

## Metodologia

Sinais coletados por função (todos por leitura estática):

1. `verify_jwt` da seção `[functions.<nome>]` em `supabase/config.toml` (103 seções confirmadas; a suposta duplicidade de `sefaz-dfe-puxar` era artefato de parsing — linha 121 é comentário);
2. chamadas aos guards centralizados de `_shared/auth-guard.ts`: `exigirUsuario`, `exigirPapel`, `exigirChamadaInterna`, `exigirInternaOuUsuario`;
3. chamadas a `_shared/webhook-auth.ts`: `authenticateWebhook` (HMAC/token do provedor);
4. validação manual de JWT em código: `auth.getUser(` / `auth.getClaims(`;
5. segredos próprios: headers `x-cron-secret`, `x-internal-secret`, `CRON_SECRET`/`INTERNAL_SECRET` (inline), `x-mcp-secret`, `x-n8n-secret`, `x-access-key`, `asaas-access-token`;
6. uso de `SUPABASE_SERVICE_ROLE_KEY` no `index.ts` (coluna **SR** — indica bypass potencial de RLS quando combinado com ausência de guard).

## Guards centralizados (resumo do que existe)

| Helper | Contrato | Mecanismo | Fail-closed? |
|--------|----------|-----------|--------------|
| `_shared/auth-guard.ts` → `exigirUsuario` | usuário logado | JWT do header `Authorization` validado contra o Auth (não apenas decodificado) | sim |
| `_shared/auth-guard.ts` → `exigirPapel` | usuário + papel (ex.: `admin`) | `exigirUsuario` + checagem de papel | sim |
| `_shared/auth-guard.ts` → `exigirChamadaInterna` | automação interna | service role key (bearer/apikey) OU segredo rotacionável de `integration_secrets` via `x-cron-secret`/`x-internal-secret` | sim (segredo ausente ⇒ 401) |
| `_shared/auth-guard.ts` → `exigirInternaOuUsuario` | interna OU usuário | composição dos dois acima | sim |
| `_shared/webhook-auth.ts` → `authenticateWebhook` | provedor externo | HMAC-SHA256 do corpo bruto (headers por provedor) OU `x-webhook-token`; segredo em `integration_secrets` com fallback de env | sim (segredo ausente ⇒ 503) |

## Resumo da classificação (primária por função)

| Contrato | Qtde | Observação |
|----------|------|------------|
| JWT-gateway (`verify_jwt = true`) | 4 | `analise-preditiva`, `bitrix24-sync`, `conciliacao-ia`, `open-finance` — `bitrix24-sync` e `open-finance` também validam `getUser` em código (ver linhas 8 e 70 da tabela) |
| JWT-código (validação em código) | 40 | `exigirUsuario`/`exigirPapel`/`getUser`/`getClaims` no `index.ts` |
| Interna / interna-ou-usuário | 9 | `exigirChamadaInterna`/`exigirInternaOuUsuario` |
| Admin (`exigirPapel(['admin'])`) | 2 | `compare-schemas`, `webhook-simulator` |
| Webhook HMAC | 3 | `authenticateWebhook` (bitrix24, bling, whatsapp) |
| Webhook token estático | 1 | `asaas-webhook` (header `asaas-access-token`) |
| Segredo custom | 4 | `x-mcp-secret`, `x-access-key`, `x-n8n-secret` ×2 |
| Cron secret inline | 5 | checagem manual em código, fora do `auth-guard` |
| Público por design | 7 | healthcheck, chaves públicas, fluxo SSO, token de contador |
| ⚠️ Sem guard detectado | 25 | 21 com service_role (prioridade P0) · 4 sem service_role (cálculo puro) |
| ⚠️ Revisar contrato | 3 | leitura de `Authorization` sem validação confirmada / endpoints de administração |
| **Total** | **103** | |

## Achados principais

1. **21 funções sem guard detectado E com `SUPABASE_SERVICE_ROLE_KEY`** (`analise-fluxo-ia`, `analyze-document`, `benchmarking-setorial`, `calcular-health-score-operacional`, `categorizar-despesa`, `ci-security-gate-log`, `comparar-benchmark-setorial`, `detectar-anomalias-financeiras`, `enviar-alerta-email`, `enviar-relatorios-tributarios-agendados`, `executar-analise-preditiva`, `gerar-acoes-recomendadas`, `gerar-alertas-tributarios`, `gerar-resumo-executivo-semanal`, `insights-relatorio`, `notify-performance-alert`, `prever-carga-tributaria`, `relatorio-diario-anomalias`, `validate-ip-geo`, `whatsapp-ai-analyzer`, `whatsapp-ia-proativo`). Várias são endpoints de IA — combinam abuso gratuito, custo de provedor e potencial bypass de RLS. **Candidatas naturais às etapas 005/047.**
2. **Falso positivo do handoff esclarecido:** o handoff dizia "99 funções sem JWT" — confirmado exato (103 − 4 com `verify_jwt = true`).
3. **Arquivos soltos em `supabase/functions/`:** `fuzz_test.ts` e `stress_test.ts` não são funções (não têm estrutura deployável) e podem quebrar `supabase functions deploy`. Relacionado às etapas 002/073.
4. **`migrate-helper` existe em `origin/main`** com `x-access-key` (PR #50 de remoção ainda não mesclado). Ferramenta administrativa sensível permanece deployável.
5. **Cron secrets inline × guard centralizado:** 5 funções reimplementam em código o que `exigirChamadaInterna` já resolve (com rotação via `integration_secrets`). Consolidação recomendada (baixo risco, ganho de uniformidade).
6. **Diversidade de JWT-código:** o time valida JWT de 4 formas diferentes (`exigirUsuario`, `getUser`, `getClaims`, `exigirPapel`) — funcional, mas dificulta auditoria; unificação progressiva é recomendável.

Prioridade: **P0** = sem guard + service_role (fechar primeiro) · **P1** = consolidar/rever contrato · **P2** = contrato presente, verificação de rotina · **P3** = contrato sólido ou risco baixo.

| # | Função | vj | Contrato | Evidência estática | SR | Pri |
|---|--------|----|----------|--------------------|----|-----|
| 1 | aceitar-convite | não | JWT-código | `getUser` | ✔ | P2 |
| 2 | analise-fluxo-ia | não | ⚠️ sem guard | nenhum sinal no `index.ts` | ✔ | P0 |
| 3 | analise-preditiva | **sim** | JWT-gateway | `verify_jwt=true` | ✔ | P3 |
| 4 | analyze-document | não | ⚠️ sem guard (IA) | nenhum sinal | ✔ | P0 |
| 5 | asaas-proxy | não | JWT-código | `getUser` | ✔ | P2 |
| 6 | asaas-webhook | não | webhook-token | header `asaas-access-token` | — | P3 |
| 7 | benchmarking-setorial | não | ⚠️ sem guard | nenhum sinal | ✔ | P0 |
| 8 | bitrix24-sync | **sim** | JWT-gateway + getUser | `verify_jwt=true` + `getUser` | ✔ | P3 |
| 9 | bitrix24-webhook | não | webhook-HMAC | `authenticateWebhook` (bitrix24) | ✔ | P3 |
| 10 | bling-proxy | não | JWT-código | `getUser` | ✔ | P2 |
| 11 | bling-webhook | não | webhook-HMAC | `authenticateWebhook` (bling) | ✔ | P3 |
| 12 | calcular-health-score-operacional | não | ⚠️ sem guard | nenhum sinal | ✔ | P0 |
| 13 | calcular-slo-metrics-diario | não | interna | `exigirChamadaInterna` ×2 | ✔ | P3 |
| 14 | calculo-iva | não | ⚠️ sem guard | nenhum sinal | — | P2 |
| 15 | categorizar-despesa | não | ⚠️ sem guard (IA) | nenhum sinal | ✔ | P0 |
| 16 | ci-security-gate-log | não | ⚠️ sem guard | nenhum sinal | ✔ | P0 |
| 17 | cnpja-lookup | não | JWT-código | `auth.getClaims` | ✔ | P2 |
| 18 | comparar-benchmark-setorial | não | ⚠️ sem guard | nenhum sinal | ✔ | P0 |
| 19 | compare-schemas | não | admin | `exigirPapel(['admin'])` | — | P3 |
| 20 | conciliacao-ia | **sim** | JWT-gateway | `verify_jwt=true` | — | P3 |
| 21 | conciliacao-proxy | não | JWT-código | `auth.getClaims` | ✔ | P2 |
| 22 | consulta-tributaria | não | JWT-código | `getUser` | — | P2 |
| 23 | contabilizar-evento | não | JWT-código | `getUser` | ✔ | P2 |
| 24 | convidar-contador | não | JWT-código | `auth.getClaims` | ✔ | P2 |
| 25 | copilot-global | não | JWT-código | `getUser` | ✔ | P2 |
| 26 | copilot-tributario | não | JWT-código | `getUser` | ✔ | P2 |
| 27 | decidir-regime | não | JWT-código | `getUser` | ✔ | P2 |
| 28 | detectar-anomalias-financeiras | não | ⚠️ sem guard (IA) | nenhum sinal | ✔ | P0 |
| 29 | digest-silenciamentos-erro | não | interna | `exigirChamadaInterna` ×2 | ✔ | P3 |
| 30 | enviar-alerta-email | não | ⚠️ sem guard | nenhum sinal | ✔ | P0 |
| 31 | enviar-bitrix24-tributario | não | JWT-código | `auth.getClaims` | — | P2 |
| 32 | enviar-convite-organizacao | não | JWT-código | `getUser` | ✔ | P2 |
| 33 | enviar-digest-conformidade | não | cron-inline + getUser | `CRON_SECRET` inline ×2 + `getUser` | ✔ | P1 |
| 34 | enviar-relatorios-tributarios-agendados | não | ⚠️ sem guard (cron?) | nenhum sinal | ✔ | P0 |
| 35 | executar-analise-preditiva | não | ⚠️ sem guard (cron?) | nenhum sinal | ✔ | P0 |
| 36 | executar-fechamento-tributario | não | JWT-código | `getUser` | ✔ | P2 |
| 37 | executar-regua-cobranca | não | cron-inline | `CRON_SECRET` inline ×3 | ✔ | P1 |
| 38 | executar-relatorios | não | interna-ou-usuário | `exigirInternaOuUsuario` + `getUser` | ✔ | P3 |
| 39 | expert-agent | não | JWT-código | `exigirUsuario` ×2 | ✔ | P2 |
| 40 | exportar-sped-contribuicoes | não | JWT-código | `getUser` | ✔ | P2 |
| 41 | external-data | não | JWT-código | `getUser` | ✔ | P2 |
| 42 | gerar-acoes-recomendadas | não | ⚠️ sem guard (IA) | nenhum sinal | ✔ | P0 |
| 43 | gerar-alertas | não | interna-ou-usuário | `exigirInternaOuUsuario` + `getUser` ×3 | ✔ | P3 |
| 44 | gerar-alertas-dispatcher | não | ⚠️ revisar | repassa `Authorization`+`apikey` ao downstream | — | P1 |
| 45 | gerar-alertas-tributarios | não | ⚠️ sem guard (cron?) | nenhum sinal | ✔ | P0 |
| 46 | gerar-dre-tributaria | não | JWT-código | `exigirUsuario` + `getUser` | ✔ | P2 |
| 47 | gerar-heatmap-tributario | não | JWT-código | `exigirUsuario` + `getUser` | ✔ | P2 |
| 48 | gerar-pacote-evidencias | não | JWT-código | `getUser` | ✔ | P2 |
| 49 | gerar-pdf-tributario | não | JWT-código | `auth.getClaims` | ✔ | P2 |
| 50 | gerar-relatorio-anual | não | JWT-código | `auth.getClaims` | ✔ | P2 |
| 51 | gerar-resumo-executivo-semanal | não | ⚠️ sem guard (cron?) | nenhum sinal | ✔ | P0 |
| 52 | gerar-resumo-financeiro-diario | não | interna | `exigirChamadaInterna` ×2 | ✔ | P3 |
| 53 | gerar-snapshots-conformidade | não | cron-inline + getUser | `CRON_SECRET` ×2 + `getUser` | ✔ | P1 |
| 54 | gerar-sped-ecd | não | JWT-código | `getUser` | ✔ | P2 |
| 55 | gerar-sped-ecf | não | JWT-código | `getUser` | ✔ | P2 |
| 56 | get-mapbox-token | não | público-design | retorna `MAPBOX_ACCESS_TOKEN` (token público) | — | P3 |
| 57 | get-vapid-key | não | público-design | chave pública VAPID | — | P3 |
| 58 | health | não | público-design | healthcheck | ✔ | P1 |
| 59 | insights-relatorio | não | ⚠️ sem guard (IA) | nenhum sinal | ✔ | P0 |
| 60 | log-sped-bitrix24 | não | JWT-código | `auth.getClaims` | ✔ | P2 |
| 61 | mcp-query | não | segredo-custom | `x-mcp-secret` (`MCP_SECRET`) | ✔ | P3 |
| 62 | migrate-helper | não | segredo-custom | `x-access-key` | ✔ | P1 |
| 63 | monitorar-erros-frontend | não | interna-ou-usuário | `exigirInternaOuUsuario` ×2 | ✔ | P3 |
| 64 | n8n-callback | não | segredo-custom | `x-n8n-secret` | ✔ | P3 |
| 65 | n8n-dispatch | não | segredo-custom | `x-n8n-secret` | ✔ | P3 |
| 66 | nfe-upload-certificado | não | JWT-código | `getUser` | ✔ | P2 |
| 67 | nfe-vinculo-proxy | não | JWT-código | `auth.getClaims` | ✔ | P2 |
| 68 | notify-performance-alert | não | ⚠️ sem guard (cron?) | nenhum sinal | ✔ | P0 |
| 69 | notify-saved-filter | não | JWT-código | `getUser` | ✔ | P2 |
| 70 | open-finance | **sim** | JWT-gateway + getUser | `verify_jwt=true` + `getUser` | ✔ | P3 |
| 71 | overlay-rejeicoes-auditoria | não | JWT-código | `getUser` | ✔ | P2 |
| 72 | prever-carga-tributaria | não | ⚠️ sem guard | nenhum sinal | ✔ | P0 |
| 73 | processar-fila-cobrancas | não | interna | `exigirChamadaInterna` ×2 | ✔ | P3 |
| 74 | processar-nf-ocr | não | JWT-código | `getUser` | ✔ | P2 |
| 75 | processar-solicitacao-lgpd | não | JWT-código | `getUser` ×10 | ✔ | P2 |
| 76 | projecao-reforma | não | ⚠️ revisar | lê `Authorization` (validação não confirmada) | — | P2 |
| 77 | relatorio-diario-anomalias | não | ⚠️ sem guard (cron?) | nenhum sinal | ✔ | P0 |
| 78 | scim-server | não | JWT-código | `getUser` ×2 | ✔ | P1 |
| 79 | sefaz-dfe-dispatcher | não | cron-inline | `CRON`/secret ×1 | ✔ | P1 |
| 80 | sefaz-dfe-puxar | não | cron-inline | `x-cron-secret`/`INTERNAL_SECRET` ×5 | — | P1 |
| 81 | sefaz-manifestar | não | JWT-código | `getUser` | — | P2 |
| 82 | send-device-alert | não | JWT-código | `exigirUsuario` ×2 | — | P2 |
| 83 | send-push-notification | não | interna-ou-usuário + admin | `exigirInternaOuUsuario` + `exigirPapel` + `getUser` ×6 | ✔ | P3 |
| 84 | simular-presumido | não | ⚠️ sem guard | nenhum sinal | — | P3 |
| 85 | simular-real | não | ⚠️ sem guard | nenhum sinal | — | P3 |
| 86 | simular-simples | não | ⚠️ sem guard | nenhum sinal | — | P3 |
| 87 | sincronizar-anomalia-bitrix24 | não | JWT-código | `auth.getClaims` | ✔ | P2 |
| 88 | sso-callback | não | público-design (fluxo SSO) | callback OAuth; `getClaims` pós-troca | ✔ | P2 |
| 89 | sso-generate-metadata | não | público-design (fluxo SSO) | gera metadata do IdP | — | P2 |
| 90 | sso-initiate | não | público-design (fluxo SSO) | início do fluxo | ✔ | P1 |
| 91 | sso-logout | não | JWT-código | `auth.getClaims` | ✔ | P2 |
| 92 | sso-test-login | não | JWT-código | `auth.getClaims` | ✔ | P1 |
| 93 | sso-validate-config | não | ⚠️ revisar | nenhum sinal | — | P1 |
| 94 | sync-profile-to-bitrix | não | JWT-código | `getUser` | ✔ | P2 |
| 95 | validar-token-contador | não | público-design | docstring "PÚBLICA"; token no corpo | ✔ | P2 |
| 96 | validate-ip-geo | não | ⚠️ sem guard | nenhum sinal | ✔ | P0 |
| 97 | verificar-conformidade-fiscal | não | JWT-código | `getUser` | ✔ | P2 |
| 98 | webhook-replay | não | JWT-código | `getUser` | ✔ | P1 |
| 99 | webhook-retry-worker | não | interna | `exigirChamadaInterna` ×2 | — | P3 |
| 100 | webhook-simulator | não | admin | `exigirPapel(['admin'])` | ✔ | P3 |
| 101 | whatsapp-ai-analyzer | não | ⚠️ sem guard (IA) | nenhum sinal | ✔ | P0 |
| 102 | whatsapp-ia-proativo | não | ⚠️ sem guard (IA) | nenhum sinal | ✔ | P0 |
| 103 | whatsapp-webhook | não | webhook-HMAC | `authenticateWebhook` (whatsapp) | ✔ | P3 |

## Limitações desta classificação (leia antes de usar)

1. **Análise estática apenas:** "sem guard detectado" **não prova** que a função é acessível anonimamente — pode haver validação manual que os padrões buscados não capturaram (ex.: comparação inline de header). A confirmação exige teste negativo de runtime (etapas 042/043/048-continuação).
2. **Guard presente ≠ guard correto:** a matriz registra a *existência* do contrato, não sua correção semântica (tenant correto, idempotência, escopo). Ex.: `scim-server` com `getUser` é incomum para SCIM (espera-se token/bearer próprio); `webhook-replay` com `getUser` merece avaliação de papel `admin`.
3. **`getUser`/`getClaims` contam como JWT-código** mesmo quando a função aceita outros caminhos (cron misto); esses casos estão sinalizados como P1 (consolidar).
4. **`verify_jwt = true` exige que o chamador envie JWT válido no gateway**, mas o corpo da função pode usar service_role internamente — a coluna SR mostra isso.
5. **Arquivos soltos** (`fuzz_test.ts`, `stress_test.ts`) não são funções e não aparecem na tabela; risco operacional registrado nos Achados.
6. `config.toml` pode divergir do deployado (sem acesso ao ambiente real, esta matriz reflete o repo).

## Próximos passos (continuação da etapa 048)

1. **Testes negativos de runtime** das 21 P0 (chamada sem credencial deve falhar; se passar, é P0 confirmado de contenção — lote A/etapa 010).
2. **Consolidação dos 5 cron-inline** no `exigirChamadaInterna` (P1, baixo risco).
3. **Revisão de contrato** dos 3 "revisar" + `scim-server`, `webhook-replay`, `sso-test-login`, `health` (o que expõe com service_role?).
4. Atualizar esta matriz após cada PR do lote D, mantendo a coluna de evidência apontando para o teste que comprova o contrato.


# Revisão CSP — Content Security Policy

> Fonte: `vercel.json` → header `Content-Security-Policy` servido em todas as
> rotas de https://app.promo-finance.com. Estado: **modo enforce** (não é
> report-only — violações são bloqueadas pelo navegador).

## Diretivas atuais e avaliação

| Diretiva          | Valor                                                                                                                              | Avaliação                                                                                                                                                                                                                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default-src`     | `'self'`                                                                                                                           | Bom — nega tudo não listado                                                                                                                                                                                                                                                                                 |
| `script-src`      | `'self' 'unsafe-inline' 'unsafe-eval' + supabase/lovable/jsdelivr                                                                  | ⚠️ `'unsafe-eval'` é a folga mais cara do header — Vite/React não precisam de `eval` em produção; remover se nenhum chunk a usar (verificar libs com `new Function`, ex.: alguns parsers). `'unsafe-inline'` ainda necessário pelo bootstrap inline do Vite — caminho para removê-lo é hash/nonce por build |
| `style-src`       | `'self' 'unsafe-inline' + fonts.googleapis.com                                                                                     | Aceitável — Tailwind/shadcn injetam estilo inline de propósito                                                                                                                                                                                                                                              |
| `font-src`        | `'self' data: + fonts.gstatic.com                                                                                                  | Ok                                                                                                                                                                                                                                                                                                          |
| `img-src`         | `'self' data: blob: https:`                                                                                                        | ⚠️ `https:` aceita imagem de qualquer origem — risco de tracking pixel/conteúdo externo; estreitar para supabase.co + mapbox + domínios de NF-e se possível                                                                                                                                                 |
| `connect-src`     | `'self' + supabase.co (https+wss) + lovable + mapbox + bitrix24 + asaas(+sandbox) + ipapi + ipify + pwnedpasswords + sentry ingest | Adequada às integrações — cada host corresponde a uma feature real (mapa, CRM, cobrança, IP-geo, senha vazada, telemetria)                                                                                                                                                                                  |
| `frame-ancestors` | `'self'`                                                                                                                           | Bom — clickjacking bloqueado                                                                                                                                                                                                                                                                                |
| `base-uri`        | `'self'`                                                                                                                           | Bom — evita injeção de `<base>`                                                                                                                                                                                                                                                                             |
| `form-action`     | `'self'`                                                                                                                           | Bom — forms não postam para fora                                                                                                                                                                                                                                                                            |
| `object-src`      | `'none'`                                                                                                                           | Bom — sem plugin/embed legado                                                                                                                                                                                                                                                                               |

## Pontos a melhorar (ordem de ROI)

1. **Remover `'unsafe-eval'` de `script-src`** — testar sem a diretiva num
   preview deploy; se nenhuma lib quebrar, fecha o vetor de execução
   arbitrária de string.
2. **Estreitar `img-src`** — substituir `https:` genérico por allowlist
   (`https://*.supabase.co`, `https://*.mapbox.com`, hosts de logo/NF-e).
   Impacto: imagens externas não allowlistadas quebram — medir antes.
3. **Nonce/hash para `'unsafe-inline'` em `script-src`** — exige Vite
   injetar nonce no HTML por deploy; esforço médio, ganho alto contra XSS
   via `<script>` injetado. Alternativa pragmática: manter inline e aceitar
   o risco residual enquanto não houver injection point conhecido.
4. **`report-uri`/`report-to`** — hoje não há endpoint coletando violações;
   adicionar `report-to` apontando para edge fn de telemetria ajudaria a
   medir os passos 1–3 antes de endurecer.

## Verificação rápida

```bash
curl -sI https://app.promo-finance.com | grep -i content-security-policy
```

Header secundários já presentes no mesmo bloco: `X-Frame-Options`,
`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` —
coerentes com a CSP; sem ação pendente.

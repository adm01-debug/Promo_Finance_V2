---
name: CNPJá Cache + Rate Limit
description: Cache persistente (cnpja_cache, TTL 30d) + rate limit por usuário (cnpja_rate_limit + cnpja_check_rate_limit, 10/h) na edge cnpja-lookup para economizar créditos da API paga
type: feature
---
Padrão de uso da Edge Function `cnpja-lookup`:

**Cache persistente:** tabela `cnpja_cache (cnpj PK, data jsonb, situacao_cadastral, fetched_at, expires_at)`. TTL padrão 30 dias. Lookup antes de qualquer chamada externa via `select ... where cnpj=? and expires_at > now()`. Upsert após sucesso.

**Rate limit:** tabela `cnpja_rate_limit (user_id, window_start, request_count)` + função `cnpja_check_rate_limit(_user_id, _max, _window_minutes) returns boolean` (SECURITY DEFINER). Chamada antes do fetch externo; se retorna `false`, edge devolve `429` com mensagem clara.

**Limites atuais:** 10 consultas / 60 minutos por usuário. Ajustar via constantes `RATE_LIMIT_MAX` e `RATE_LIMIT_WINDOW_MIN` na edge.

**Resposta:** `{ data, cached: boolean, cached_at?: string }`. Hook `useCnpjaLookup` mostra toast diferenciado para cache hit e propaga mensagem de 429.

**Observabilidade (P2):** logger emite `cache_hit`, `cache_miss`, `rate_limit_exceeded`, `external_api_call` (com duration_ms e provider).

**RLS:** apenas admin lê `cnpja_cache`; usuário vê apenas suas próprias linhas em `cnpja_rate_limit`. Service role grava ambas.

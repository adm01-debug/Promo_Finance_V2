
P2 ✅ entregue. Próximo: **Lote P3 — Cache persistente CNPJá + Rate limiting**.

## Lote P3 — Cache CNPJá Persistente + Rate Limit

### 1. Migration
- Tabela `cnpja_cache` (cnpj PK 14 chars, data jsonb, situacao_cadastral text, fetched_at timestamptz, expires_at timestamptz).
- Índice em `expires_at` para purge.
- Tabela `cnpja_rate_limit` (user_id uuid, window_start timestamptz, request_count int, PRIMARY KEY (user_id, window_start)).
- RLS: SELECT/INSERT pelo service_role; SELECT pelo próprio user em rate_limit; admin vê tudo.
- Função `cnpja_check_rate_limit(_user_id uuid, _max int, _window_minutes int)` returns boolean (SECURITY DEFINER).

### 2. Refatorar `cnpja-lookup`
- Substituir cache em memória (`cache: Map`) por leitura na tabela `cnpja_cache`.
- TTL diferenciado: 30 dias para dados cadastrais base, 7 dias re-fetch quando situação mudar.
- Antes da chamada externa: `cnpja_check_rate_limit(user_id, 10, 60)` → 429 se excedido.
- Logar via observability (já instrumentado em P2): `cache_hit`, `cache_miss`, `rate_limit_exceeded`, `external_api_call` com `duration_ms`.
- Resposta inclui `{ cached: boolean, cached_at?: string }`.

### 3. UI feedback
- Hook `useCnpjaLookup`: tratar erro 429 com toast claro ("Limite de 10 consultas/hora atingido").
- Card opcional no wizard mostrando "Dados em cache desde X" quando `cached=true`.

### 4. Validação
- `npx tsc --noEmit` zero erros.
- Migration limpa.
- Deploy `cnpja-lookup` sem erros.
- Memória: salvar padrão em `mem://integrations/cnpja-cache-and-rate-limit`.

## Diagrama

```text
   Frontend (useCnpjaLookup)
            │
            ▼
   Edge: cnpja-lookup
     │
     ├─▶ cnpja_check_rate_limit(uid, 10/h) ──▶ 429 se excedido
     │
     ├─▶ SELECT cnpja_cache WHERE cnpj=? AND expires_at > now()
     │        │
     │        └─▶ HIT → retorna {cached:true}
     │
     └─▶ MISS → fetch api.cnpja.com → UPSERT cnpja_cache
                                    └─▶ retorna {cached:false}
```

## Observações
- Economia direta de créditos CNPJá Plus.
- Sem novos secrets.
- Próximos: P4 (wizard premium), P5 (dashboard v2), P6 (relatório anual).

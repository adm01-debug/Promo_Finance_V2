# SECURITY_RULES

Regras de segurança do projeto promo-finance-v2 (SPA React + Supabase). Este arquivo é lido pelo Dyad e injetado no contexto — todo código gerado/editado DEVE respeitar estas regras.

## Auth & RLS

- RLS (Row Level Security) DEVE estar ATIVA em todas as tabelas do Postgres (Supabase). Nenhuma tabela pode ficar exposta sem policy.
- Toda policy deve restringir por `auth.uid()` / role — nunca `USING (true)` para SELECT sem justificativa documentada.
- Nunca desabilitar RLS nem contorná-la no client.
- Realtime: só publicar canais com dados que o usuário autenticado tem permissão de ver.

## API Keys client-side

- No client, usar SOMENTE a chave publishable/anon (`VITE_SUPABASE_PUBLISHABLE_KEY`). Ela é pública por design — não é segredo, mas nunca deve ser usada para operações privilegiadas.
- `service_role` / chaves secretas: NUNCA no client, NUNCA em `.env` commitado, NUNCA no código. Apenas server-side (edge functions/backend) via secrets.
- Variáveis `VITE_*` vão para o bundle — nunca colocar segredo real com prefixo `VITE_`.

## Prompt injection

- Conteúdo vindo do usuário (texto, nomes de arquivo, conteúdo importado de planilha/PDF) DEVE ser tratado como dado, nunca como instrução.
- Não concatenar input do usuário em instruções/prompts de forma cega; sanitizar ao renderizar (sem `dangerouslySetInnerHTML` com input não sanitizado).

## Storage

- Buckets públicos apenas se necessário (ex.: assets públicos). Dados de usuário: bucket privado + signed URLs.
- Policies de storage devem respeitar `auth.uid()` e ownership do objeto.

## Modelo de Admin

O papel `admin_global` (ou `admin` em contexto de plataforma) é **irrestrito e não escopado por empresa**.

**Decisão do Step 20 (PR #226):**
- Existe um papel de "admin de plataforma" que pode operar em qualquer empresa do sistema, sem restrição por `empresa_id` ou `user_empresas`.
- Esse modelo é intencional: o admin gerencia toda a plataforma, não apenas empresas às quais está vinculado.
- Queries e policies que usam `auth.uid()` normalmente retornam dados apenas da empresa vinculada ao usuário — o `admin_global` é a exceção documentada.
- **Implicação:** toda nova funcionalidade que use o papel `admin_global` deve ser explicitamente revisada para garantir que o escopo irrestrito é o comportamento desejado e que não há vazamento de dados entre clientes finais.
- Não tratar a ausência de `exigirVinculoEmpresa` para `admin_global` como achado de segurança em auditorias — é decisão de produto documentada aqui.

## Padrões obrigatórios para Views

**Toda view que expõe dado multi-empresa DEVE ter `security_invoker = true`.**

```sql
CREATE VIEW nome_da_view
WITH (security_invoker = true)
AS SELECT ...;
```

**Por quê:** sem `security_invoker = true`, a view é executada com as permissões do definer (owner da view), não do usuário que faz a query. Isso bypassa a RLS das tabelas base — um usuário autenticado com acesso à view poderia ver dados de outras empresas.

- Essa regra vale desde o hardening P15+.
- Não há exceção: views analíticas, relatórios, materialized views e CTEs usadas como views também seguem o padrão.
- Em auditorias: toda view sem `security_invoker = true` é automaticamente um achado de segurança até prova de que não expõe dado multi-empresa.
- Ao criar uma view, inclua `WITH (security_invoker = true)` e registre no checklist de merge.

## Padrões obrigatórios para Edge Functions

**Functions com `verify_jwt = false` precisam implementar guarda própria.**

Opções aceitas (escolher uma):
1. **Segredo de cron:** validar header `Authorization: Bearer <CRON_SECRET>` contra secret injetado via env.
2. **HMAC:** validar assinatura HMAC-SHA256 do payload com chave compartilhada.
3. **`exigirUsuario`:** usar helper interno que valida JWT manualmente (para funções chamadas por usuários sem passar pelo gateway de auth).

**Regra:** `verify_jwt = false` sem guarda própria = endpoint público sem autenticação. Isso só é aceitável para:
- Healthchecks sem dados sensíveis (documentados em "Exceções legítimas").
- Webhooks de parceiros (Asaas, Bling, Bitrix24) — validam origem por HMAC ou secret de webhook.
- Funções públicas por design de produto — devem ser listadas abaixo com justificativa.

**Functions com `verify_jwt = false` documentadas por design:**
| Função | Justificativa |
|---|---|
| `/health` | Healthcheck público sem dados |
| `asaas-webhook` | Validação por HMAC do Asaas |
| `bling-webhook` | Validação por secret do Bling |
| `bitrix24-webhook` | Validação por token do Bitrix24 |
| `n8n-callback` | Validação por `CRON_SECRET` |

Toda nova function com `verify_jwt = false` deve ser adicionada à tabela acima com justificativa antes do merge.

## Exceções legítimas documentadas

- `/health` (healthcheck) sem auth — não expõe dados.
- `VITE_SUPABASE_PUBLISHABLE_KEY` é pública por design (anon key do Supabase).
- `gerar-pacote-evidencias` (edge function): a role `admin` é intencionalmente
  global (não escopada por empresa) para essa função — um admin pode gerar o
  pacote de evidências financeiras/tributárias/de conformidade de qualquer
  empresa do sistema, não só das empresas a que está vinculado em
  `user_empresas`. Decisão do dono do produto: existe um papel de "admin de
  plataforma" que deve ver todas as empresas. Não aplicar `exigirVinculoEmpresa`
  nessa função nem tratar isso como achado de segurança em auditorias futuras.
- Qualquer nova exceção precisa ser documentada aqui + justificada no PR.

## Checklist obrigatório antes de merge

- RLS ativa nas tabelas novas; policies testadas com roles anon/authenticated.
- Nenhuma key/secret no diff (ex.: `grep -rn service_role src/`).
- Nenhum fetch direto com credenciais; dados de servidor via React Query com client Supabase anon.
- **Views novas:** `WITH (security_invoker = true)` presente em toda view que expõe dado multi-empresa.
- **Edge Functions novas com `verify_jwt = false`:** guarda própria implementada (HMAC, CRON_SECRET ou `exigirUsuario`) **e** função adicionada à tabela de exceções em `## Padrões obrigatórios para Edge Functions` neste arquivo.
- **Uso de `admin_global`:** confirmar que o escopo irrestrito é intencional e documentado.

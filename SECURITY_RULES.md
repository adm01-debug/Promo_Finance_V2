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

## Exceções legítimas documentadas

- `/health` (healthcheck) sem auth — não expõe dados.
- `VITE_SUPABASE_PUBLISHABLE_KEY` é pública por design (anon key do Supabase).
- Qualquer nova exceção precisa ser documentada aqui + justificada no PR.

## Checklist obrigatório antes de merge

- RLS ativa nas tabelas novas; policies testadas com roles anon/authenticated.
- Nenhuma key/secret no diff (ex.: `grep -rn service_role src/`).
- Nenhum fetch direto com credenciais; dados de servidor via React Query com client Supabase anon.

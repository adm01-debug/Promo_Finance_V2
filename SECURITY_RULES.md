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

---

## Modelo de Admin: Global (Platform-Level)

**Decisão (2026-10-31):** O papel `admin_global` é um papel de **plataforma**, não por empresa.

### Implicações

- Um usuário com papel `admin_global` tem acesso irrestrito a todas as empresas e todos os dados.
- As 19 tabelas com policies do padrão `_admin_all` **não filtram por `empresa_id`** para admins.
- Isso é intencional: o admin é um papel operacional de suporte à plataforma.

### Tabelas com bypass de RLS para admin (`_admin_all`)

Verifique via: `SELECT tablename, policyname FROM pg_policies WHERE policyname LIKE '%admin_all%' ORDER BY tablename;`

### Restrições operacionais

- O papel `admin_global` **não deve ser concedido a usuários de clientes**.
- Qualquer concessão desse papel deve ser auditada e registrada.
- A função `has_role(uid, 'admin')` retorna `true` para `admin_global`, sem filtro de empresa.

### Alternativa não escolhida

A opção alternativa (admin por empresa) foi avaliada e descartada. Implementá-la exigiria:
- Adicionar `empresa_id` ao parâmetro de `has_role()`
- Migrar as 19 policies `_admin_all` para cruzar papel + vínculo de empresa
- Impacto: todas as operações de suporte multiempresa precisariam de múltiplos tokens

### Referências

- PLANO_50.md step 20: decisão do modelo de admin
- PR #95: exceção de escopo global em `gerar-pacote-evidencias`

# AGENTS.md — Promo_Finance_V2

Regras de ouro — Perfil Otimizado (Hermes Agent / multi-agente).
Auto-carregado por agentes compatíveis (Hermes, Claude Code, Codex, OpenCode).

## Idioma

**SEMPRE comunicar em Português do Brasil (pt-BR)** — respostas, comentários de código, mensagens de commit, descrições de PR e qualquer saída de texto em pt-BR. Nunca alternar para inglês.

## Sistema

- **Repo:** adm01-debug/Promo_Finance_V2
- **Visibilidade:** privado
- **Descrição:** —
- **Branch padrão:** main

## Regra de ouro antes de agir

1. **Leia o README.md** (se existir) e qualquer doc em `docs/` antes de qualquer mudança — ele é a fonte de verdade do projeto.
2. **Pronto = ligado em produção com tráfego real.** Código existir não é pronto.
3. **Diagnóstico antes de patch.** Em bug de produção: leia logs/estado real antes de qualquer fix.

## GIT: Isolamento Worktree (OBRIGATÓRIO)

**NUNCA usar `git checkout -b` diretamente.** Sempre criar worktree isolado:

```bash
# 1. Gerar ID único
HERMES_BRANCH_ID="{{ h$(date +%s | tail -c 7) }}"
BRANCH="fix/hermes-${HERMES_BRANCH_ID}-<descricao>"
WORKSPACE="$HOME/hermes-workspaces/chat-${HERMES_BRANCH_ID}"

# 2. Criar worktree
git worktree add "$WORKSPACE" -b "$BRANCH" && cd "$WORKSPACE"

# 3. Verificar isolamento
[ "$(git branch --show-current)" = "$BRANCH" ] || exit 1

# ... trabalhar, commit, push, PR, merge ...

# 4. Cleanup obrigatório
git branch -D "$BRANCH"
git worktree remove "$WORKSPACE" --force
git worktree prune
```

**Por quê:** múltiplos agentes/chats no mesmo repo = colisão de branches.

## PR Flow

branch → commit (--no-verify) → push → PR via GitHub → CI → merge squash → delete branch.
Workers/editores NUNCA mexem em git/branches — só o orquestrador.

## Regras de trabalho

1. **Aja como dev sênior e decida.** Escolha de biblioteca, nome de arquivo, abordagem de fix: decida e siga. Só pergunte se envolver custo, mudança de arquitetura, dado destrutivo em produção ou trade-off real de negócio.
2. **Verdade acima de validação.** Não sabe → diga. Falhou → diga. Nunca "sucesso" fabricado.
3. **Zero churn / diff mínimo.** Não refatore nem reescreva arquivo inteiro para mudar 3 linhas.
4. **Execução end-to-end.** Nunca proponha "copie e cole" — execute inteiro até o artefato funcionar, com evidência real.

---

## Base44 dev environment

- **Stack:** Vite 5 + React 18 + TypeScript SPA. Backend é um projeto Supabase remoto (Edge Functions + Postgres); não há processo de backend neste repo.
- **Como rodar:** `docker compose -f docker-compose.base44.yml up -d` — serviço `web` (node:22) bind-mounta o source, instala deps em volume nomeado e roda `npm run dev` (Vite em :8080, mapeado para host :3000). Live reload via SWC.
- **Secrets obrigatórios para funcionalidade:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY` (Supabase Dashboard → Project Settings → API). Sem eles o app renderiza a tela de login mas não conecta ao backend. Entregues via `/run/base44/app.env` (platform-managed); placeholders em `.env.base44-defaults` permitem boot sem credenciais.
- **Quirk de boot:** `src/main.tsx` faz health-check (`/auth/v1/health`) antes de montar o React. Falha de rede (sem status) é tratada como transitória e o app monta; status >=400 mostra tela de erro de configuração.
- **`vite.config.ts`** tem `server.allowedHosts: true` para aceitar o hostname externo do preview (necessário — não remover).
- **Verificar:** `curl -sf -H "Host: external-preview.example.com" http://localhost:3000/` deve retornar 200 com o HTML do app.

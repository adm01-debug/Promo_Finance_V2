# Graphify — referência para agentes

> Ler quando for consultar, atualizar ou validar o grafo de código. Resumo operacional em
> `AGENTS.md`, seção 8. Skill: `.claude/skills/graphify/SKILL.md`.

## Grafo de conhecimento (`graphify-out/`)

- Pergunta sobre o código: `graphify query "<pergunta>"` quando `graphify-out/graph.json` existe.
- Relações: `graphify path "<A>" "<B>"` ou `graphify explain "<conceito>"`.
- `graphify-out/GRAPH_REPORT.md` só para revisão ampla de arquitetura.
- Após mudar código: `graphify update .` (AST-only, sem custo de API).

### Frescura do grafo

```sh
git rev-parse --short HEAD
grep "Built from commit" graphify-out/GRAPH_REPORT.md
```

Se divergirem, o auto-sync N8N corrige em até 15 min. Forçar rebuild: `graphify update . --force`.
No CI, `.github/workflows/graphify.yml` reconstrói os mapas privados a cada merge em `main`.

## Piloto privado (`scripts/graphify/`)

- Ler `docs/GRAPHIFY_PLANO_50_ETAPAS.md`. O piloto é `npm run graphify:pilot`; perfis explícitos
  usam `npm run graphify:analyze -- --profile NOME` e podem ser revisados antes com
  `npm run graphify:inventory -- --profile NOME`. Perfis versionados: `pilot`, `edge-runtime`,
  `domain-integrations`, `frontend-entry`, `frontend-routes`, `frontend-components`.
- Consultar apenas um grafo cuja `evidencia.json` tenha status de piloto validado, commit e hashes
  compatíveis com os arquivos atuais. Um grafo parcial não é o sistema inteiro.
- Os resultados ficam privados em `graphify-out/piloto-*/`. Não contornar o wrapper com
  `graphify update .`, `extract .`, instalação de hooks ou rotulagem por LLM; não ativar hooks
  globais, LLM, MCP público ou banco automaticamente.
- Preservar `src/lib/arquitetura/` e seu analisador existente. Confirmar relações no código: nó
  isolado não significa lixo e AST não comprova implantação, RLS ou segurança financeira.
- Outros scripts: `graphify:sql-inventory`, `graphify:code-references`, `graphify:edge-inventory`,
  `graphify:quality`, `graphify:benchmark`, `graphify:test`.

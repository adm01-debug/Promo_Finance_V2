# 04 — Plano de correção e melhoria

> Produzido pela auditoria de QA somente leitura de 2026-11-22, sobre `main` em `2c2486f`.
> Achados e evidências: `03-ACHADOS.md`. Cobertura: `01-INVENTARIO.md`. Cenários: `02-CENARIOS.md`. Progresso: `05-PROGRESSO.md`.

## Instruções para o agente executor

Você vai executar este plano sozinho, etapa por etapa, sem acesso a quem o escreveu. Tudo o que você precisa está aqui e nos arquivos irmãos em `docs/qa/`. Leia estas regras antes da primeira etapa e volte a elas sempre que algo divergir.

1. **Uma etapa por vez, na ordem, respeitando as dependências.** Cada etapa tem `Depende de:`. Não comece uma etapa cujas dependências não estejam marcadas como concluídas em `05-PROGRESSO.md`. Cada etapa é uma branch própria e uma PR própria — nunca junte duas etapas na mesma PR, mesmo que pareçam gêmeas.
2. **Antes de mudar qualquer coisa, releia a evidência da etapa no código atual.** Abra o `arquivo:linha` citado e confirme que o trecho descrito está lá. O repositório tem muitos agentes trabalhando ao mesmo tempo; o código pode já ter mudado. **Se o código não corresponde ao descrito, pare essa etapa**, escreva em `05-PROGRESSO.md` o que encontrou no lugar, marque a etapa como `[~] divergente` e siga para a próxima etapa independente. Não adivinhe o que o autor queria dizer.
3. **Corrija a causa raiz com a menor mudança possível.** Não refatore, não renomeie, não reorganize imports, não "melhore" o que a etapa não pede, não reescreva o arquivo inteiro para mudar três linhas. O campo `Arquivos e objetos a tocar:` é o limite da sua mudança; `Não tocar / armadilhas:` diz o que parece relacionado e deve ficar como está.
4. **Problema novo encontrado no caminho não é corrigido na hora.** Anote em `05-PROGRESSO.md`, na seção "Achados novos", com `arquivo:linha` e uma linha de descrição. Continue a etapa em que estava.
5. **Etapa marcada `Precisa de aprovação humana: sim` fica com a PR aberta, aguardando.** Não faça merge. Avise o dono com o link da PR e passe para a etapa seguinte que não dependa dela. Isso vale para migration/DDL em produção, CI/workflows, segredos, infraestrutura, deleção de dado, mudança de arquitetura ou de custo.
6. **Uma etapa só termina com a verificação executada e a evidência anotada.** O campo `Como verificar:` traz um comando, consulta ou request concreto e o resultado esperado. Rode, cole a saída real em `05-PROGRESSO.md` e só então marque `[x]`. "Deveria funcionar" não conclui etapa. Se a verificação falhar, a etapa continua aberta.
7. **Convenções do repositório que valem para toda etapa** (de `AGENTS.md`, que vence qualquer outro documento em conflito):
   - Branch nova a partir de `main` atualizado, nome `claude/<tipo>-<slug>-<AAMMDD-HHMM>` com `tipo` em `fix`|`feat`|`chore`|`infra`. Nunca commitar em `main`, nunca reaproveitar branch, nunca escrever em branch de outro agente.
   - Antes de começar, liste as PRs abertas (`github_graphql`). Se houver PR aberta tocando os mesmos arquivos, pare e avise o dono.
   - Escrita no GitHub pelo MCP `GITHUB - MCP - FOREVER` (o MCP padrão devolve 403 em escrita).
   - Commits em português, prefixo `fix:`/`feat:`/`chore:`/`infra:`, de preferência um commit atômico.
   - **DDL nunca por `supabase_apply_migration`**: execute via `supabase_db_query` e grave o arquivo correspondente em `supabase/migrations/` com timestamp `YYYYMMDDHHmmss` estritamente crescente — confira antes com `SELECT max(version) FROM supabase_migrations.schema_migrations`.
   - `CREATE INDEX` sem `CONCURRENTLY` (o gateway transacional do Supabase recusa `CONCURRENTLY`).
   - Views com `security_invoker = true`. RLS em toda tabela pública. Isolamento por `empresa_id`; `organizacao_id` não entra em consulta, policy ou migration financeira.
   - Edge Function nova: `validatePayload` com Zod e `verify_jwt` ligado (desligar só com justificativa em comentário no `supabase/config.toml`).
   - Nada de `any` implícito nem `@ts-ignore` sem justificativa escrita; `src/integrations/supabase/types.ts` é gerado e não se edita à mão.
   - Segredo só em variável de ambiente ou secret do serviço — nunca em código, commit ou resposta.
8. **Antes de abrir a PR**, rode o que o repositório tem para os arquivos que você tocou: `bun run type-check`, `bun run lint`, `bun run test:run` (ou o teste do arquivo). Erro herdado de `main`, que você não introduziu, não é seu: anote em `05-PROGRESSO.md` e siga.
   - **Atenção de ambiente**: em contêiner com rede restrita, `bun install` pode não completar (o proxy recusa parte dos tarballs com 403). Se as dependências não instalarem, diga isso na PR em vez de afirmar que os testes passaram.
9. **Depois do merge, confirme o deploy.** Merge em `main` é produção (Vercel). Verifique que o deploy subiu e que o comportamento mudou de verdade (log, consulta ou request real). CI vermelha: leia o resumo da falha antes de qualquer correção; se o vermelho veio do seu merge, corrija em branch nova `fix:`.
10. **Relate ao fim de cada etapa**: link da PR e estado (mergeada / aberta aguardando o dono / CI vermelha e por quê).

### Como ler cada etapa

`Onda` dá a prioridade (1 = primeiro). `Severidade` vem do achado. `Achados resolvidos` liga a etapa ao `03-ACHADOS.md` — toda etapa tem pelo menos um. `Caminho recomendado` é o campo mais importante: diz por onde começar, que padrão já existente no repositório seguir (com o arquivo de referência) e qual atalho tentador evitar. Siga-o em vez de inventar um caminho próprio: quem escreveu leu o código ao redor, você está vendo só este trecho.

### Ordem das ondas

1. Segurança e risco de perda de dado
2. Fluxos principais quebrados
3. Integridade de dados e regras de negócio
4. Funcionalidades incompletas
5. Robustez: erros, estados, concorrência
6. Performance
7. Experiência de uso e consistência
8. Higiene: código morto, CI, observabilidade

### Relação com os outros planos abertos no repositório

Em 2026-11-22 já existiam dois planos de etapas no repositório, somando 390 etapas, gerados no mesmo dia: `docs/PLANO_FRONTEND_190_ETAPAS_2026-11-22.md` (190 etapas, prefixo `E-`) e `docs/PLANO_UX_NAVEGACAO_200_ETAPAS_2026-11-22.md` (200 etapas, prefixo `N-`). Eles cobrem **front-end e navegação/UX**. Este plano foi deduplicado contra os títulos daqueles dois: onde um item de interface já estava previsto lá, ele **não** foi repetido aqui, e a etapa correspondente deste plano registra a referência (`E-0xx` / `N-0xx`) no campo "Não tocar / armadilhas". O foco deste plano é o que aqueles dois não alcançam: banco de dados e RLS, Edge Functions, integrações e webhooks, regras de negócio e cálculo financeiro, infraestrutura e CI, e riscos transversais de isolamento multi-empresa.


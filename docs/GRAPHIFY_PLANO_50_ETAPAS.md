# Graphify no Promo Finance V2 — implementação em 50 etapas

Data: 11/09/2026. Base inicial inspecionada: `b0ff4c55e504d4483e397ff2110556aa0dbfda57`.
Integração publicada na `main`: `cfb20e6363c71f62962a43d86f8effbbd3041dac`.

## Objetivo e limite desta entrega

Integrar o Graphify ao desenvolvimento e à auditoria do repositório privado
`adm01-debug/Promo_Finance_V2`, permitindo navegar por relações estruturais com
evidências. **Não é uma nova funcionalidade da aplicação financeira, nem uma
certificação de que o sistema inteiro está correto ou implantado.**

Esta entrega implementa a fundação, um piloto AST reproduzível de cinco arquivos e
onze perfis adicionais, incluindo seis domínios financeiros.
As 50 etapas abaixo constituem o roteiro completo de expansão. `[x]` significa
critério local desta etapa atendido; `[ ]` significa pendente, parcial ou dependente
de autorização, conforme descrito. Não significa 50 etapas concluídas, deploy ou
validação do banco. A aceitação operacional integral está reservada à etapa 050.

### Fontes e decisões de arquitetura

- `README.md`, `AGENTS.md`, `docs/ARCHITECTURE.md` e `docs/DEPLOYMENT.md`.
- Preservar `scripts/gerar-grafo-arquitetura.ts`, `src/lib/arquitetura/analisador-imports.ts`,
  `modulos.ts` e os testes existentes: o Graphify complementa, não substitui, essas regras.
- Pacote Python **`graphifyy==0.9.48`**, executável `graphify`, API/CLI inspecionada na
  instalação local. Não confundir com pacotes homônimos ou uma biblioteca React.
- Python 3.11 recomendado. Nenhuma dependência adicionada ao bundle Vite ou Deno.
- Banco canônico: `bwwbeyolnnzppeuhgkcd`; catálogo parcial consultado somente
  por leitura durante a validação. Origem Lovable/Cloud: `lszcmoymovkpckehlagr`,
  ainda sem autenticação nesta execução. Nenhum SQL, DDL ou dado financeiro foi alterado.
- Relações do AST são observações estáticas; relações dinâmicas e execução real
  exigem evidências independentes. Não remover objetos porque estejam vazios ou isolados.

## Uso já implementado

Instalação explícita, apenas no ambiente de desenvolvimento:

```sh
uv tool install graphifyy==0.9.48
npm run graphify:inventory
npm run graphify:test
npm run graphify:pilot
npm run graphify:analyze -- --profile edge-runtime
npm run graphify:sql-inventory
npm run graphify:code-references
npm run graphify:edge-inventory
npm run graphify:quality -- --profile pilot
npm run graphify:benchmark
```

Alternativa sem `uv`: instalar o mesmo pacote/versão em um ambiente virtual Python
e ativá-lo antes dos comandos. O piloto não instala nem atualiza dependências sozinho.
A versão direta e as dependências transitivas estão fixadas no lock Linux
x86_64/Python 3.11, com hashes exigidos na instalação do CI.

O inventário e os testes usam a biblioteca padrão do Python e não precisam do
Graphify instalado. O piloto exige o CLI da versão configurada no `PATH`.

Cada execução cria `graphify-out/piloto-<id>/`, com permissões privadas no Linux:

| Artefato | Uso e restrição |
| --- | --- |
| `evidencia.json` | Status, commit, hashes SHA-256 dos bytes analisados, versão, limites da evidência e diagnóstico |
| `corpus/` | Cópia privada dos arquivos selecionados; contém repositório Git sintético para limitar descoberta da raiz |
| `extracao-bruta.json` | Relações antes do agrupamento; preserva referências não resolvidas |
| `diagnostico.json` | Nós, arestas, referências incompletas e risco de colapso de relações |
| `graphify-out/graph.json` | Grafo navegável direcionado; somente após status validado |
| `graphify-out/GRAPH_REPORT.md` | Relatório do fornecedor com aviso local de escopo e limitações |
| `extracao.log`, `agrupamento.log` | Diagnóstico privado do fornecedor; não publicar automaticamente |

Não escolher uma execução só porque é a mais recente: conferir `status` e os hashes.
`falhou` e `iniciado` não são evidências válidas. Os números do piloto não abrangem
arquivos fora da lista explícita. Mudanças no commit ou nos bytes exigem nova execução.
O snapshot é dos bytes lidos por arquivo; não é uma transação atômica sobre todo o worktree.

Para consultar, usar o caminho impresso pela execução, por exemplo:

```sh
graphify query "construirGrafoObservado" --budget 800 --graph graphify-out/piloto-ID/graphify-out/graph.json
graphify explain "authenticateWebhook" --graph graphify-out/piloto-ID/graphify-out/graph.json
```

`piloto-ID` é um marcador documental, substituído pelo diretório real. Os perfis
versionados atuais são `pilot`, `edge-runtime`, `domain-integrations`, `frontend-entry`,
`frontend-routes` e `frontend-components`; o processo recusa perfis ad hoc. Selecionar
termos existentes nos rótulos; não inventar sinônimos como se o CLI os resolvesse.
Não executar `graphify update .`, `extract .`, instalação de hooks ou rotulagem por LLM
como atalho: isso abandona os controles do wrapper e amplia o corpus.

### Segurança e economia

- Lista explícita de cinco arquivos rastreados em `scripts/graphify/config.json`.
- Até 50 arquivos e 1 MiB agregado; dois workers AST; timeout por fase e dez minutos no CI.
- Sem SQL, documentos, imagens, dumps, `types.ts` gerado, `.env` ou arquivos não rastreados.
- Rejeita traversal, symlinks, binários, UTF-8 inválido e alguns padrões conhecidos de credencial.
- **Filtro heurístico não é garantia de ausência de segredos.** Revisar o corpus e manter
  todos os artefatos privados; não há mecanismo DLP completo nesta entrega.
- Ambiente dos processos Graphify não herda chaves de APIs, Supabase, proxies nem flags de LLM.
  Isso não é uma sandbox de rede/sistema operacional nem proteção contra dependência maliciosa.
- AST não executa as funções financeiras. Nenhuma chamada Supabase, migration, deploy,
  exportação de registros reais, serviço MCP, Neo4j ou envio a IA foi configurado.
- Sem watcher, hook Git global ou upload automático. Cada execução preserva as anteriores.
- Tokens de LLM da extração: zero. Isso não mede os tokens gastos pelo assistente para integrar a ferramenta.

## Simulação prévia de falhas e gaps

| Cenário | Tratamento desta entrega | Limite ou próxima ação |
| --- | --- | --- |
| Outro agente modifica um arquivo | Copiar exatamente os bytes inventariados e registrar hash | Não confundir snapshot com HEAD; captura transacional futura na 038 |
| Versão errada ou CLI ausente | Falhar antes de criar saída | Lock transitivo na 007 |
| Arquivo secreto, não rastreado ou symlink | Recusar antes da extração | Revisão humana/DLP adicional na 047 |
| Corpus excessivo | Falhar por contagem/bytes | Novos perfis dependem de orçamento revisado |
| Timeout/interrupção | Diretório exclusivo; `falhou` quando capturado; `iniciado` se interrupção abrupta | Nunca consumir estados incompletos |
| Arquivo inteiro omitido pelo extrator | Falhar se não houver representação no grafo | Não garante cobertura de cada símbolo interno |
| Dependência fora do recorte | Registrar referência não resolvida e preservar extração bruta | Não inventar nó nem tratar como código morto |
| Arestas paralelas colapsadas | Preservar bruto e diagnóstico do fornecedor | Multigrafo investigado na 030 |
| Grafo vazio, duplicado ou final inconsistente | Rejeitar evidência | Testes sintéticos não substituem extração real |
| Alias `@/` ou import dinâmico | Não assumir resolução completa | Fixtures e expansão nas 018–020 |
| Saída considerada prova de RLS/produção | Advertência explícita no relatório e nas regras dos agentes | Auditoria somente leitura nas 021–025 |
| CI verde sem uso real | CI valida somente tooling/piloto | Adoção operacional comprovada na 050 |

## Plano de implementação — exatamente 50 etapas

Prioridades: **P0** proteção/integridade; **P1** entrega fundamental; **P2** expansão;
**P3** otimização. Responsáveis indicam papéis, não agentes já designados.
Uma etapa só muda para concluída com artefato e comando/evidência verificável.

### Execução posterior à fundação (11/09/2026)

- O lote inicial foi integrado por squash na `main` em `434ba7ec`; todos os checks
  da PR #70 estavam verdes antes da integração.
- Foram executados cinco perfis AST privados: Edge runtime (148 arquivos, 1.205.292
  bytes, 1.115 nós/2.175 relações), domínio e integrações (227, 1.007.449,
  1.654/2.845), entrada frontend (3, 31.678, 259/385), rotas/hooks (429,
  2.658.801, 2.043/2.287) e componentes (804, 5.194.434, 3.653/4.194).
- Referências sem destino dentro do próprio recorte foram preservadas no bruto:
  207, 304, 51, 6.384 e 13.024 respectivamente. Não são erros confirmados:
  são principalmente dependências que estão em outro perfil ou fora do código.
- O inventário lexical local de 595 migrations achou 5.005 declarações: 482 tabelas,
  88 views, 588 funções, 741 índices, 963 policies, 317 triggers, 13 enums,
  12 extensões, 310 grants e 29 jobs. O número é histórico (create/alter em
  migrations), não o número de objetos vivos no banco. Ele marcou quatro arquivos com literais
  semelhantes a credenciais sem copiar seus valores; tratar como P0 separado.
- A correlação de 1.646 fontes de código identificou 2.366 referências literais
  (1.251 relações, 74 RPCs, 91 Edge Functions, 229 rotas e 721 query keys), mais
  509 chamadas dinâmicas não resolvidas. Com o parser corrigido, nove relações
  literais e uma Edge Function não tiveram match histórico/versionado; são itens para investigação,
  não bugs provados. O resultado é histórico/estático, não catálogo canônico.
- Duas execuções concorrentes do perfil `frontend-entry` produziram diretórios
  separados e o mesmo total (259 nós/385 relações); uma reexecução sequencial
  teve nós e relações idênticos. No piloto, dois worktrees produziram o mesmo
  SHA-256 final; três destinos não resolvidos do bruto variaram apenas no prefixo
  absoluto do worktree incorporado pelo fornecedor.
- Em 11/09/2026, o MCP oficial comprovou o destino canônico
  `bwwbeyolnnzppeuhgkcd` e permitiu listar tabelas, migrations, extensões, Edge
  Functions e advisors. A permissão de `execute_sql` continuou insuficiente; por
  isso policies, rotinas, triggers, views, privilégios e jobs vivos não foram
  inventados a partir de migrations. O gateway legado `supabase_producao` ainda
  retornou Management API 403.
- Seis perfis financeiros, resolução lexical de imports, inventário Edge,
  calibração de qualidade, navegação com teto, resumo SVG offline e benchmark
  foram executados. Evidência agregada e limites estão em
  `docs/GRAPHIFY_VALIDACAO_2026-09-11.md`; artefatos completos continuam privados.
- Uma interrupção real com `SIGKILL` deixou manifesto `iniciado`
  e nenhum grafo final, eliminando o diretório órfão sem estado observado antes do ajuste.
- As etapas 022–025 e 046–047 continuam parciais enquanto faltar catálogo vivo
  completo e acesso autenticado à origem. A 035 e a política destrutiva da 044
  continuam dependentes de decisão explícita; conclusão técnica não substitui a
  aceitação operacional humana da 050. Com a homologação remota e o merge, o
  placar verificável passou para **38 concluídas e 12 pendentes**.

### A. Governança e diagnóstico — etapas 001–005

- [x] **001 — Delimitar a integração.** P0 · responsável: arquitetura · dependência: nenhuma.
  Implementar análise de desenvolvimento, sem mudar o produto financeiro ou bancos.
  **Aceite:** escopo, proibições e distinção piloto/produção explícitos neste documento.
- [x] **002 — Registrar a base e preservar outros agentes.** P0 · responsável: mantenedor · depende: 001.
  Inspecionar Git e desenvolver em worktree/branch exclusivos.
  **Aceite:** base SHA registrada e nenhum reset, checkout ou sobrescrita no worktree principal.
- [x] **003 — Verificar a ferramenta existente.** P1 · responsável: tooling · depende: 002.
  Inspecionar `graphify --version`, ajuda e implementação instalada antes de escolher comandos.
  **Aceite:** versão 0.9.48 e flags usadas efetivamente executadas no piloto, não presumidas.
- [x] **004 — Preservar o mapa arquitetural atual.** P0 · responsável: arquitetura · depende: 002.
  Ler analisador, catálogo de módulos e convenções; documentar coexistência.
  **Aceite:** nenhum arquivo de `src/lib/arquitetura/` alterado e nenhuma regra substituída.
- [x] **005 — Simular ameaças e falhas antes da expansão.** P0 · responsável: segurança · depende: 001–004.
  Registrar cenários de vazamento, corpus incompleto, conflito, timeout e falsa aprovação.
  **Aceite:** tabela acima liga cada risco ao controle ou à pendência identificada.

### B. Instalação, escopo e privacidade — etapas 006–010

- [x] **006 — Reproduzir instalação em ambiente limpo.** P1 · responsável: tooling · depende: 003.
  Instalar e executar o piloto em venv Python 3.11 vazio, separado da instalação original.
  **Aceite:** versão correta, parser TS disponível e piloto concluído sem reutilizar o ambiente local.
- [x] **007 — Fechar a cadeia de dependências.** P0 · responsável: segurança/DevOps · depende: 006.
  Gerar lock transitivo por plataforma com hashes, revisar licença e vulnerabilidades e definir atualização.
  **Aceite:** instalação com hashes verificados e revisão registrada; pin direto sozinho não conclui esta etapa.
- [x] **008 — Implementar corpus explícito rastreado.** P0 · responsável: tooling · depende: 005.
  Usar `git ls-files -z`, lista versionada e extensões permitidas, sem varrer todo o repo.
  **Aceite:** inventário reproduz os cinco arquivos; não rastreados, SQL e tipos gerados são recusados.
- [x] **009 — Aplicar filtro inicial de conteúdo sensível.** P0 · responsável: segurança · depende: 008.
  Rejeitar credenciais conhecidas, binários e UTF-8 inválido; não imprimir conteúdo rejeitado.
  **Aceite:** testes negativos aprovados e limitação heurística documentada, sem alegação de DLP completo.
- [x] **010 — Separar saída privada do produto.** P0 · responsável: tooling · depende: 008–009.
  Ignorar `graphify-out/`, recusar symlink de saída e criar diretórios exclusivos privados.
  **Aceite:** corpus/grafos não entram no Git, `src/`, `public/`, `dist/` ou artefatos públicos do CI.

### C. Execução e proveniência — etapas 011–015

- [x] **011 — Congelar os bytes selecionados.** P0 · responsável: tooling · depende: 008–010.
  Capturar bytes durante inventário e extrair sobre cópia; limitar descoberta da raiz do extrator.
  **Aceite:** teste modifica original após inventário e comprova snapshot preservado; nenhum arquivo fonte executado.
- [x] **012 — Aplicar orçamento de processamento.** P1 · responsável: DevOps · depende: 011.
  Limitar contagem, bytes, workers e tempo de subprocessos.
  **Aceite:** orçamento agregado/individual e timeout testados; CI com limite global explícito.
- [x] **013 — Isolar configurações e validar versão.** P0 · responsável: segurança · depende: 003, 011.
  Subprocessos sem herdar tokens, proxies ou flags de IA; recusar CLI diferente.
  **Aceite:** testes com sentinelas e versão incorreta; nenhum fallback automático para LLM.
- [x] **014 — Preservar extração bruta e diagnóstico.** P0 · responsável: tooling · depende: 011–013.
  Salvar estado antes do agrupamento e resultado do diagnóstico de integridade.
  **Aceite:** referências externas continuam auditáveis mesmo que não integrem o grafo navegável.
- [x] **015 — Registrar evidência por execução.** P0 · responsável: auditoria · depende: 014.
  Registrar commit, hashes, horário, versão, indicador de alterações nos fontes e status de execução.
  **Aceite:** timeout produz `falhou`; execução anterior permanece intacta; relatório aponta para `evidencia.json`.

### D. Mapeamento de código — etapas 016–020

- [x] **016 — Validar o piloto AST real.** P1 · responsável: arquitetura · depende: 015.
  Mapear analisador de imports, módulos, cliente Supabase e guards de usuário/webhook.
  **Aceite:** cinco arquivos representados, grafo não vazio, referências pendentes expostas e tokens LLM zero.
- [x] **017 — Expandir por módulos financeiros.** P1 · responsável: frontend · depende: 016, 030.
  Criar perfis separados para pagar, receber, cobrança, conciliação, contabilidade e tributário.
  **Aceite:** relatório por perfil com denominador de arquivos, amostra manual de funções e orçamento respeitado.
- [x] **018 — Validar resolução de imports TypeScript.** P1 · responsável: tooling/frontend · depende: 016.
  Testar `@/`, relativos, reexports, barrels, imports de tipos, lazy imports e arquivos inexistentes.
  **Aceite:** fixtures com arestas esperadas e limites documentados; não inferir resolução a partir do nome.
- [x] **019 — Expandir backend Deno e helpers.** P1 · responsável: backend · depende: 016, 018.
  Inventariar Edge Functions efetivamente presentes, URLs de imports, helpers e entradas HTTP.
  **Aceite:** denominador atualizado a partir do checkout; não reutilizar contagens antigas como baseline.
- [x] **020 — Mapear relações dinâmicas da aplicação.** P2 · responsável: frontend/backend · depende: 017–019.
  Criar adaptadores testados para rotas, lazy loading, queries, mutation keys e `functions.invoke`.
  **Aceite:** diferenciar referência literal de chamada dinâmica não resolvida, com arquivo/linha e confiança.

### E. Banco e rastreabilidade funcional — etapas 021–025

- [x] **021 — Mapear migrations sem executá-las.** P1 · responsável: DBA · depende: 019.
  Ler DDL de forma segura; separar criação, alteração, remoção e estado histórico, sem aplicar SQL.
  **Aceite:** parser testado com comentários, dollar quoting, overloads e migrations repetidas; falhas visíveis.
- [ ] **022 — Inventariar o catálogo canônico somente leitura.** P0 · responsável: DBA/segurança · depende: 021.
  Exigir acesso de leitura verificado ao projeto `bwwbeyolnnzppeuhgkcd`; inventariar schemas, tabelas,
  colunas, constraints, índices, RLS/policies, funções, triggers, views, enums, extensões, privilégios,
  jobs e migrations. Não copiar registros financeiros nem comandos de cron com segredos sem redação.
  **Aceite:** cobertura por categoria e permissões insuficientes explícitas; nenhum write ou DDL.
- [ ] **023 — Comparar origem e destino sem confundir intenção com perda.** P0 · responsável: DBA/arquitetura · depende: 022.
  Se houver acesso aprovado à origem, comparar assinaturas qualificadas, definições e decisões ADR.
  **Aceite:** diferenças classificadas como intencionais, divergentes ou indeterminadas, com evidência de ambos os lados.
- [ ] **024 — Ligar referências de código a objetos SQL.** P1 · responsável: backend/DBA · depende: 020–023.
  Correlacionar `.from`, `.rpc`, views e argumentos literais/dinâmicos com schema e overloads.
  **Aceite:** matriz referência→objeto→evidência; ausência de chamada direta não implica ausência de uso.
- [ ] **025 — Rastrear dependências indiretas e implementação parcial.** P1 · responsável: DBA/produto · depende: 024.
  Incluir trigger→função→tabela, policy→função, FK, job e integrações externas, sem expor segredos.
  **Aceite:** distinguir objeto declarado, conectado, testado, implantado e observado; preservar tabelas vazias.

### F. Qualidade do grafo e interpretação — etapas 026–030

- [x] **026 — Preservar origem e confiança das relações.** P0 · responsável: auditoria · depende: 014.
  Manter atributos fornecidos pelo AST e proibir arestas inventadas para preencher lacunas.
  **Aceite:** extração bruta consultável; relatório distingue extraído de inferido; nenhuma semântica LLM neste piloto.
- [x] **027 — Tornar lacunas visíveis.** P0 · responsável: tooling · depende: 026.
  Executar diagnóstico antes do agrupamento e imprimir a quantidade de referências sem destino.
  **Aceite:** as 13 referências do piloto aparecem na evidência e no aviso do relatório, não como sucesso silencioso.
- [x] **028 — Preservar a direção do relacionamento.** P1 · responsável: arquitetura · depende: 014.
  Marcar extração como direcionada antes de construir o grafo navegável.
  **Aceite:** `graph.json` final com `directed=true`; validar que imports/chamadas não sejam interpretados invertidos.
- [x] **029 — Recusar evidência estrutural inválida.** P0 · responsável: QA · depende: 027–028.
  Rejeitar grafo vazio, IDs duplicados, arquivo omitido e aresta final com endpoint ausente.
  **Aceite:** testes negativos aprovados; tolerância só no bruto, onde referência externa permanece registrada.
- [x] **030 — Calibrar qualidade antes de expandir.** P1 · responsável: arquitetura/QA · depende: 016, 026–029.
  Definir tolerâncias de omissão por símbolo e colapso de relações; avaliar multigrafo e coesão por comunidade.
  **Aceite:** amostra manual confrontada com AST, métricas brutas e decisão registrada; não usar número de nós como nota 10/10.

### G. Navegação, visualização e agentes — etapas 031–035

- [x] **031 — Integrar comandos do projeto.** P1 · responsável: tooling · depende: 016.
  Adicionar inventário, piloto e testes ao `package.json`, sem lifecycle hooks ou dependência de runtime.
  **Aceite:** nove comandos explícitos executáveis; `dev`, `build` e `prepare` não disparam Graphify.
- [x] **032 — Homologar consultas e caminhos.** P1 · responsável: arquitetura/QA · depende: 028, 031.
  Validar consultas com termos do grafo, caminho conhecido, termo inexistente e orçamento de saída.
  **Aceite:** fixture com resultados esperados e smoke real; sem caminho não equivale a função desconectada.
- [x] **033 — Nomear comunidades de forma verificável.** P2 · responsável: arquitetura · depende: 030, 032.
  Trocar rótulos genéricos por nomes curtos baseados nos membros e confirmar coesão bruta.
  **Aceite:** rótulos estáveis e revisados. Rotulagem por LLM somente após decisão explícita sobre dados/custo.
- [x] **034 — Disponibilizar visualização local segura.** P2 · responsável: tooling/segurança · depende: 030, 033.
  Validar HTML/SVG, dependências de CDN, caracteres hostis, arquivos grandes e modo sem rede.
  **Aceite:** navegador não envia conteúdo privado; acima de 5.000 nós usar agregação ou manter `--no-viz`.
- [ ] **035 — Oferecer MCP local opcional.** P2 · responsável: tooling/segurança · depende: 007, 032, 047.
  Avaliar extra MCP do pacote e configurar stdio para um grafo específico, sem substituir MCPs de banco.
  **Aceite:** ferramentas expostas inventariadas, limites testados e ausência de listener público; não ativado nesta entrega.

### H. Testes e integração contínua — etapas 036–040

- [x] **036 — Exercitar falhas com dados sintéticos.** P0 · responsável: QA · depende: 009–015, 029.
  Testar filtros, snapshots, limites, isolamento de ambiente, ferramenta ausente, timeout e preservação.
  **Aceite:** 68 testes `unittest` aprovados; casos sintéticos identificados como tais, sem aprovação fictícia de produção.
- [x] **037 — Executar smoke com o Graphify real.** P1 · responsável: QA · depende: 016, 036.
  Usar CLI instalado e os cinco arquivos reais, incluindo diagnóstico e geração de relatório.
  **Aceite:** extração, agrupamento, grafo e status verificáveis; não considerar mock do processo como substituto.
- [x] **038 — Verificar reprodutibilidade e concorrência.** P0 · responsável: QA/tooling · depende: 037.
  Comparar execuções em worktrees/caminhos diferentes; simular duas execuções, edição simultânea e interrupção abrupta.
  **Aceite:** diferenças só em metadados previstos; nenhum grafo anterior perdido; definir captura consistente de mudanças concorrentes.
- [x] **039 — Homologar o workflow privado.** P1 · responsável: DevOps · depende: 006, 036–038.
  Workflow já versionado: testes e piloto em Python 3.11, permissão `contents: read`, sem credenciais persistidas/upload.
  **Aceite:** execução remota verde ligada ao SHA `d50315305e6d565ed6771786265e419e99318a9d`
  no run `34637671321`; YAML existir ou teste local passar não conclui a etapa.
- [ ] **040 — Testar compatibilidade e upgrades.** P2 · responsável: DevOps · depende: 007, 039.
  Definir matriz Linux/ambientes dos agentes e testar versão nova com o mesmo corpus antes de atualizar o pin.
  **Aceite:** procedimento de rollback e comparação de métricas, hashes e relações revisado.

### I. Operação e documentação — etapas 041–045

- [x] **041 — Documentar comandos, limites e recuperação.** P1 · responsável: documentação · depende: 031, 037.
  Publicar este plano, link no README e localização dos artefatos privados.
  **Aceite:** instalação, falha, reexecução e interpretação descritas sem exigir segredos no chat.
- [x] **042 — Orientar múltiplos agentes sem instalar hooks.** P0 · responsável: mantenedor · depende: 015, 041.
  Acrescentar seção mínima em `AGENTS.md`, mantendo instruções anteriores.
  **Aceite:** agentes verificam frescor/corpus, confirmam fonte e não alteram configs globais ou trabalho concorrente.
- [x] **043 — Medir ganho real de navegação.** P2 · responsável: auditoria · depende: 017–020, 032.
  Comparar buscas `rg` com consultas do grafo em perguntas financeiras conhecidas, contabilizando latência e acertos.
  **Aceite:** benchmark repetível com custos medidos; nenhuma promessa percentual de economia sem medição.
- [ ] **044 — Definir atualização e retenção.** P2 · responsável: DevOps · depende: 038–043.
  Preferir comando explícito; avaliar incremental por perfil, validade, armazenamento e retenção de snapshots privados.
  **Aceite:** política aprovada; limpeza não remove fonte nem artefato de outro agente; nenhum watcher global implícito.
- [ ] **045 — Integrar resultados à revisão de mudanças.** P2 · responsável: mantenedor · depende: 030, 043–044.
  Criar modelo de impacto por PR com escopo, referências, lacunas e confirmação humana.
  **Aceite:** grafo auxilia revisão, mas não autoriza remoção de tabela, função, dependência ou módulo sozinho.

### J. Aceitação e expansão controlada — etapas 046–050

- [ ] **046 — Fechar cobertura por módulo e categoria.** P1 · responsável: arquitetura/QA · depende: 017–025, 030.
  Consolidar matriz arquivo/módulo/objeto conhecido→representado→testado, incluindo exclusões justificadas.
  **Aceite:** denominadores atualizados, gaps atribuídos e categorias sem acesso marcadas indisponíveis, não zero.
- [ ] **047 — Revisar privacidade e fronteiras de confiança.** P0 · responsável: segurança · depende: 007, 022, 034.
  Auditar corpus, logs, nomes, definições SQL, retenção, dependências e eventual acesso por agentes/MCP.
  **Aceite:** revisão independente e nenhum segredo/dado financeiro exposto; risco residual aceito pelo responsável.
- [ ] **048 — Comparar utilidade antes/depois.** P2 · responsável: produto/arquitetura · depende: 043, 046–047.
  Repetir perguntas de impacto e implementação parcial usando evidências do código e, se disponível, catálogo real.
  **Aceite:** ganho mensurado sem crescimento injustificado de falsos positivos ou custos.
- [x] **049 — Integrar via PR com gates verificados.** P0 · responsável: mantenedor · depende: 039, 041–042.
  Revisar diff, reconciliar outras PRs, executar gates e integrar seguindo proteção da branch.
  **Aceite:** PR #72 integrado por squash na `main` em
  `cfb20e6363c71f62962a43d86f8effbbd3041dac`; pipeline pós-merge `34638407809`
  aprovado, sem contornar a falha E2E encontrada e corrigida durante a homologação.
- [ ] **050 — Aceitar operacionalmente e manter backlog honesto.** P1 · responsável: mantenedor/usuário · depende: 045–049.
  Demonstrar uso por agentes em uma mudança real, conferir evidências e registrar limitações remanescentes.
  **Aceite:** fluxo utilizado e útil no projeto, cobertura pactuada e responsáveis definidos. Isso não certifica
  funcionalidades financeiras nem substitui validação de produção do Promo Finance.

## Ordem segura, dependências e pontos de decisão

1. Fundação 001–016, 026–029, 031, 036–037 e 041–042: integração local entregue neste lote.
2. Reprodutibilidade/cadeia de dependências 006–007, 030, 032 e 038–040: antes da expansão automática.
3. Código 017–020 e banco 021–025: lotes separados; falta de acesso ao banco não invalida o piloto AST.
4. Visualização/MCP 033–035 e operação 043–048: somente após controle de privacidade e utilidade.
5. Integração via PR pode entregar a fundação sem encerrar todo o roteiro; 050 exige critérios pactuados.

Não estão implicitamente autorizados: envio de código/dados a LLM externo, serviço
MCP público, Neo4j hospedado, gastos adicionais, alteração de banco, remoção de objetos,
eliminação de suposto lixo, limpeza global de worktrees ou substituição de hooks.
Qualquer uma dessas ações exige decisão específica antes da execução.

### Recuperação e rollback

Se uma execução falhar, ler seu status e diagnosticar a etapa, sem promover sua saída.
Corrigir a causa e reexecutar o piloto cria outro diretório; o grafo anterior permanece intacto.
Interrupção abrupta pode deixar `iniciado`, que deve ser tratado como incompleto.
Não usar `--force` ou excluir o grafo anterior para mascarar redução de cobertura.

Reverter a integração significa reverter, via PR, os scripts, workflow e referências
documentais deste lote. Não exige migration, rollback de dado, alteração de Edge
Function ou reversão do analisador arquitetural existente. Artefatos locais privados
podem ser preservados; qualquer remoção material deve identificar o alvo e ser validada.

## Evidência local inicial

- Inventário real: **5 arquivos, 36.716 bytes**.
- Extração bruta: **61 nós e 106 relações**; **13 referências sem destino no recorte**.
- Grafo navegável: **61 nós e 93 relações**. As referências excluídas continuam no bruto.
- Diagnóstico inicial: zero endpoints ausentes por campo, zero autoarestas e zero
  pares colapsados no corpus inicial. Não extrapolar para o repositório inteiro.
- Suite local do Graphify: **68 testes aprovados**. A validação complementar do
  produto executou **2.712 testes Vitest**, sem falhas.
- Instalação independente em venv Python 3.11 validada: 30 pacotes instalados e
  mesmo resultado do piloto (61 nós/93 relações). `actionlint` aprovou o workflow.
- Navegação real: `construirGrafoObservado` retornou oito nós; `authenticateWebhook`
  mostrou sete relações. Encontrado gap: `--budget 700` retornou estimativa de 756 tokens,
  com aviso do fornecedor. Não tratar o budget nativo como teto rígido; etapa 032 permanece parcial.
- Sem uso de LLM na extração, sem alteração do banco, sem deploy e sem modificação em `src/`.
- Execução remota/merge e etapas de expansão só devem ser marcados após evidência correspondente.

Os artefatos completos são privados e regeneráveis. Este documento registra números
e critérios, sem copiar código, credenciais ou definições sensíveis para o relatório versionado.

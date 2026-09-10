# Auditoria financeiro-funcional — evidências de 10/09/2026

Projeto: Promo Finance V2. Commit auditado: `d84a692dd13914540f9bc9d43a5317d9a65c62d9`. Trabalho isolado na branch `fix/codex-auditoria-financeira-20260910`.

Plano executável: [100 etapas com checklist, prioridades e aceite](PLANO_AUDITORIA_FINANCEIRA_100_ETAPAS_2026-09-10.md).

## Parecer

Há riscos de distorção financeira e funcionalidades parcialmente conectadas. Os testes existentes demonstram regressão controlada em parte do código, mas não sustentam uma certificação integral do produto. A nova auditoria encontrou importação com valor incorreto, datas impossíveis aceitas, instrumentos de cobrança rejeitados pelo parser do próprio sistema, uso de valores brutos em títulos parcialmente liquidados e indicadores apresentados sem lastro real.

Não atribuo nota 10/10. O aceite de cada operação exige conciliação entre tela, registro persistido, saldo e, quando houver, retorno do provedor. Esta rodada não realizou transações reais nem certificou todos os botões com todos os perfis. O alcance efetivo é explicitado abaixo para impedir um novo falso positivo de produção.

## Baseline e dimensão

Inventário AST TypeScript gerado por `scripts/auditoria-financeira/inventario.mjs` a partir dos arquivos versionados. Conta ocorrências, não capacidades únicas de negócio. Funções incluem callbacks; controles incluem botões, abas, checkboxes, switches e gatilhos de menus/dialogs; componentes repetidos em listas podem gerar mais elementos em runtime.

| Objeto | Quantidade | Interpretação |
|---|---:|---|
| Arquivos TypeScript/TSX em `src` | 1.746 | Inclui testes e tipos; não é denominador de cobertura |
| Arquivos da suíte Vitest | 205 | Encontrados e executados |
| Rotas declaradas em `App.tsx` | 129 | Inclui curingas, parâmetros e rota exclusiva de desenvolvimento |
| Rotas com `ProtectedRoute` | 118 | Inventário de proteção explícita |
| Controles interativos no código | 2.416 | Não representa 2.416 cliques executados |
| Ocorrências de funções/callbacks | 14.223 | Não são 14.223 funcionalidades independentes |
| Chamadas `.from/.rpc/.invoke` | 1.146 | Literal ou dinâmica; necessita interpretação do receptor |
| Diretórios de Edge Functions com `index.ts` | 102 | Inventário local, não confirmação de deploy |
| Arquivos de teste Deno `_test.ts`/`.test.ts` | 46 | CI seleciona explicitamente 22 no job unitário |
| Arquivos E2E `.e2e.ts` | 26 | Quantidade de arquivos não comprova cobertura das rotas |
| Migrations SQL versionadas | 595 | Não equivale a migrations aplicadas no banco |

Foram localizados 69 sinais `Math.random`, 47 sinais TODO/FIXME/HACK/“em breve”, 104 usos de `.limit` e 178 sinais de mock/simulação. São candidatos de inspeção: nem aleatoriedade nem limite de consulta são defeitos por si. Detectou-se ainda um consumidor literal `api-keys-manage` sem diretório correspondente no código de Edge Functions. Isso comprova lacuna no repositório, não ausência de deploy remoto.

O parser de rotas foi corrigido durante a auditoria para desconsiderar três usos do ícone `Route` sem propriedade `path`; eles não são rotas. Esta correção evita inflar o denominador de 129 para 132.

## Testes executados e limites de evidência

| Verificação | Resultado | Limite |
|---|---|---|
| Instalação com `bun install --frozen-lockfile` | Aprovada | Checkout isolado; mesma resolução de dependências |
| `bun run type-check` | Aprovado | Configuração exclui E2E/testes e usa `strict: false` |
| `bun run lint` | 0 erros; 13 warnings | `lint:strict` exige eliminar dívida antes de ficar verde |
| `bun run test:coverage` | 205 arquivos; 2.691 testes aprovados | Denominador padrão com 339 arquivos no relatório |
| Build sem configuração | Reprovado por ausência das três variáveis Supabase | Comportamento esperado da proteção de ambiente; não defeito novo |
| Build com configuração sintética válida | Aprovado | Prova empacotamento, não conectividade ou deploy |
| Suite Deno selecionada pelo CI | 160 testes, 23 steps; 0 falhas | 22 arquivos; rede runtime restrita a localhost/127.0.0.1 |
| Gate canônico offline, integridade TOML, replay safety e reparos SQL | Aprovados | Inspeção offline; não prova estado live |
| Novos cenários financeiros | 26 executados: 7 aprovados; 19 reprovações | Cenários adversariais dirigidos, não amostra estatística da qualidade global |
| Cobertura com todos os arquivos elegíveis de `src` | Reprovada nos thresholds de funções e branches | Mesmo conjunto de testes; arquivos nunca exercitados incluídos |
| Navegação sem sessão | 118/118 rotas protegidas redirecionaram para `/auth` | Prova guard no navegador local; não substitui RLS |
| Login em 1440×1000 e 375×812 | Botão acionável em trial; sem overflow horizontal | Não foi submetida credencial real |
| Navegação com sessão sintética e modais | Resultados detalhados no [anexo gerado](auditoria-financeira-20260910/INTERFACE_E_INVENTARIO.md) | Mocks controlados; erros de fixture não são classificados automaticamente como bugs |
| Consulta MCP de produção somente leitura | HTTP 403 na Management API | Sem dados/schema live coletados nesta rodada |

Os workflows do commit-base passaram, incluindo [DB Linter](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/34473102972), [CI](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/34473102973) e [Deno](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/34473102962). Nesta auditoria, o estado desses runs foi consultado novamente. Isso não autoriza concluir que todos os objetos do banco foram certificados nem permite ler ou comprovar o valor de um secret. O job “Integration tests (edge functions live)” executa apenas `sso-test-login/index.test.ts`, não todos os módulos financeiros.

Não há `E2E_USER_EMAIL`/`E2E_USER_PASSWORD` disponíveis no ambiente local. Não foram recuperadas credenciais privadas nem habilitado stress de produção para contornar essa limitação. A sessão sintética serve exclusivamente à renderização e às interações locais com chamadas interceptadas. Sua primeira tentativa usou chave de storage diferente da configurada no cliente e foi invalidada; a sonda foi corrigida para falhar se uma tentativa autenticada terminar em `/auth`.

Na navegação autenticada sintética, as 118 rotas foram visitadas; uma apresentou exceção de renderização, reproduzida e explicada em F26. Sete dos oito diálogos dirigidos abriram; o convite de usuário não teve abertura comprovada, permanecendo como limitação da fixture/permissão/controle, não como defeito confirmado de clique. Uma tentativa anterior de interações estava bloqueada pelo tour de onboarding: a repetição usa usuário com onboarding concluído, sem forçar cliques através do overlay. A consulta SEFAZ exibiu sucesso e autorização de nota com **zero chamadas à integração fiscal**; o handler confirma alteração exclusivamente local.

## Gap de cobertura comprovado

| Métrica | Configuração padrão | Inclusão explícita de `src/**/*.{ts,tsx}` |
|---|---:|---:|
| Arquivos no relatório | 339 | 1.498 |
| Linhas | 73,68% — 7.850/10.654 | 17,77% — 7.425/41.778 |
| Statements | 72,59% — 8.685/11.964 | 17,20% — 8.226/47.822 |
| Funções | 64,25% — 1.616/2.515 | 11,03% — 1.559/14.123 |
| Branches | 66,36% — 6.038/9.098 | 14,33% — 5.749/40.103 |

O comando com inclusão explícita aplica o filtro de arquivos ao relatório inteiro; por isso também varia a contagem de trechos cobertos, além de adicionar arquivos não exercitados. Os percentuais descrevem universos diferentes, não regressão de comportamento entre commits.

Na medição ampliada, páginas têm 132/5.070 linhas cobertas; hooks, 918/10.055; componentes, 945/18.568; bibliotecas, 5.351/7.830. O domínio puro tem cobertura substancialmente maior que telas e fluxos. Os limites configurados são 6% de linhas/statements, 18% de funções e 50% de branches: o escopo ampliado falha nos dois últimos. Não reduzir os limites para aprovar artificialmente; melhorar o escopo medido e os testes.

## Achados e impacto financeiro

Legenda: **R** = reprodução executada; **E** = evidência estática com caminho de consumo; **C** = contrato de negócio a homologar; **L** = limitação/gap de validação. Prioridade corresponde ao risco de uso, não a uma perda financeira real já comprovada.

| ID | Prioridade / evidência | Achado, impacto e referência | Etapas |
|---|---|---|---|
| F01 | P1 · R | CSV `1.234,56` resulta em `1.234`; negativo perde grandeza da mesma forma. `abc` é aceito com `sucesso: true` e valor `NaN`. Pode distorcer a base conciliada. `src/lib/ofx-parser/csv.ts:80`; S01/S02/S03. | 004, 031, 033 |
| F02 | P1 · R | `31/02/2026` e `20260231` são aceitos; no CSV, a data vira 03/03/2026. Pode deslocar competência/vencimento. `src/lib/ofx-parser/utils.ts:4` e `:27`; S04/S05/S22. | 005, 032 |
| F03 | P1 · R | `parseCurrency('12abc')` retorna 12 por parsing parcial. Entrada inválida ganha aparência de valor válido. `src/lib/currency.ts:115`; S06. | 004, 011, 021 |
| F04 | P1 · R/C | `valueToCents(1.005)` retorna 100; negativo retorna -100. Difere de uma política de meia unidade afastada de zero, usada na sonda. Essa política precisa de homologação; não é apresentada aqui como obrigação tributária universal. `currency.ts:177`; S07/S08. | 004 |
| F05 | P1 · R | Parcelamento não rejeita taxa `NaN` ou infinita; contamina parcela, juros e saldo. Valores e quantidade têm guard, mas a taxa não. `currency.ts:218`; S09/S10. | 004, 019 |
| F06 | P1 · R/C | Projeção realista com mesmas entradas produz 900 ou 765 ao variar `Math.random` dentro do intervalo permitido. Falta contrato de reprodutibilidade/seed e origem das premissas. `cashflow-scenarios.ts:91`; S13. Aleatoriedade poderia ser intencional em Monte Carlo, desde que explicitada e auditável. | 003, 046 |
| F07 | P1 · R | Projeção vazia gera `saldoMinimo: Infinity`; saldo final não preserva saldo inicial porque a API de métricas não o recebe. `cashflow-scenarios.ts:184`; S14. | 048 |
| F08 | P1 · R | Saldo de 75.000 com risco médio configurado em 100.000 não gera alerta; `_limiteRiscoMedio` é ignorado. `cashflow-scenarios.ts:121`; S15. | 047 |
| F09 | P1 · R | Débito `NaN` é convertido em zero e pode produzir balancete `balanceado: true`. `src/lib/contabil/balancete-utils.ts:52`; S17. Isso não comprova dado inválido no banco; comprova fragilidade da validação na fronteira. | 072 |
| F10 | P0 · R/E | Geradores privados de boleto produzem código de 40 dígitos e linha de 53, rejeitados pelo `parseBoleto` do próprio projeto. Há fallback para esses geradores inclusive quando o provedor omite os campos. `src/hooks/useBoletos.ts:62`, `:241`; S23/S24. | 051–053 |
| F11 | P1 · R/E | Conversores recebem título de 1.000 parcialmente liquidado em 400 e usam 1.000, não residual 600. `montarLancamentosSistema` também omite os campos de baixa. `src/lib/transaction-matcher/converters.ts:3`; `src/lib/conciliacao-page-helpers.ts:66`; S25/S26. Não foi confirmada liquidação indevida no backend. | 035–038 |
| F12 | P0 · E / UI sintética | `/notas-fiscais` inicia com `mockNotasFiscais`; consultar usa timer/aleatoriedade e anuncia autorização, protocolo e consulta concluída. `src/pages/NotasFiscais.tsx:45`, `:61`; `src/components/nfe/NovaNFeForm.tsx:68`. Evidência de botão no anexo de interface. | 061–064 |
| F13 | P1 · E | Scores Serasa/Boa Vista são aleatórios; descrição comportamental fixa. `src/pages/Cobrancas.tsx:232`. Pode induzir decisões de cobrança/crédito sem suporte. | 026 |
| F14 | P1 · E | Métricas por canal usam multiplicadores arbitrários e taxas de conversão fixas 42/58/12/75. `Cobrancas.tsx:53`. Não constituem medição de entrega/recebimento real. | 027, 059 |
| F15 | P1 · E | Histórico anterior é calculado por `*0.9` e zero do mês anterior substituído por `atual*0.95`. `useContasReceberLogic.ts:217`, `:223`; `useContasPagarLogic.ts:158`. | 029 |
| F16 | P1 · E | CP usa `allContas` limitado a 1.000 para KPIs, apesar das RPCs de totais já existentes em outros consumidores. Datas/aprovação e ordenação são aplicadas após paginação. `useContasPagarLogic.ts:146`, `:191`, `:248`; `financial/useContasPagar.ts:21`. | 017–018, 079 |
| F17 | P1 · E | KPI “30 dias” soma todos os títulos pendentes sem limite de vencimento; não filtra empresa no próprio hook. `src/hooks/useFluxoCaixa.ts:18`. RLS pode restringir acesso, mas não substitui filtro funcional da empresa selecionada. | 045, 050 |
| F18 | P1 · E | Gráfico de tesouraria usa valor bruto e apenas `pendente/vencido`, excluindo parciais. `src/components/tesouraria/ProjectedCashFlowChart.tsx:38`. | 049 |
| F19 | P1 · E | `ConviteUsuarioDialog` tenta inserir log e informa e-mail enviado/perfil atribuído, sem serviço de convite e sem verificar `error` do insert. `src/components/usuarios/ConviteUsuarioDialog.tsx:32`. | 009, 082 |
| F20 | P1 · E | `useApiKeys` chama `api-keys-manage`, sem implementação local correspondente. O hook já informa indisponibilidade no erro, o que deve ser preservado. `src/hooks/useApiKeys.ts:48`. | 083 |
| F21 | P1 · E | Atualização de oportunidades de elisão exclui identificadas e depois insere novas fora de uma transação observável no cliente. Falha entre operações pode deixar histórico incompleto. `src/hooks/useOportunidadesElisao.ts:131`, `:152`. Estado efetivo dos triggers não inspecionado. | 006, 069 |
| F22 | P1 · E | `useMovimentacoes` recebe conta, mas a consulta não aplica o filtro; criação descarta vários campos da interface por divergência de schema/tipos. `src/hooks/useFinancialOperations.ts:56`, `:74`. | 044, 094 |
| F23 | P1 · R/E | Cobertura ampla reprova; `tsc` exclui E2E e os testes. Há assertivas condicionadas à existência de botão e um `expect(options.count())` sem aguardar o número. `vitest.config.ts`, `tsconfig.json`, `e2e/contas-pagar.e2e.ts:96`, `e2e/conciliacao.e2e.ts:129`. | 091–093 |
| F24 | P1 · L/E | Gates SQL são ignorados sem `DATABASE_URL`; MCP ainda 403; CI live Deno focado em uma função. Testes verdes não validam toda a superfície financeira ou de RLS. `.github/workflows/ci.yml:130`; `.github/workflows/deno-tests.yml`. | 093–095 |
| F25 | P2 · E | `docs/TESTING.md` cita scripts/arquivos inexistentes; `DEPLOYMENT.md` indica `build:prod`, ausente no `package.json`; índice de execução ainda usa base de agosto. | 098 |
| F26 | P1 · R/E | `/tributario/relatorios-contabeis` quebra na primeira renderização: `Cannot read properties of undefined (reading 'filter')`. O componente chama `apuracoes.filter` e `operacoes.filter` antes de os hooks fornecerem dados, sem tratar carregamento. `src/components/reforma-tributaria/RelatoriosContabeisTributarios.tsx:41`, `:49`. Reproduzido na sessão sintética; não depende de classificar uma tabela vazia como erro. | 009, 079, 092 |
| F27 | P1 · E | `transmitirApuracao` apenas atualiza o registro para `status: 'transmitido'` e informa “Apuração transmitida com sucesso”; o próprio código declara simulação, sem transmissão externa ou protocolo confirmado. `src/hooks/useApuracoesTributarias.ts:312`. Não foi acionado no banco real. | 070 |
| F28 | P1 · E | Exportar PDF/Excel nos relatórios tributários apenas executa `toast.info`; não gera arquivo nem inicia download. `src/components/reforma-tributaria/RelatoriosContabeisTributarios.tsx`, handler `handleExportar`. A quebra inicial F26 também impede o acesso normal a esses controles. | 079 |

## Cenários que passaram e devem ser preservados

S11: parcelar 100 em três conserva 10.000 centavos, última parcela 33,34 e saldo zero. S12: soma de 0,10 e 0,20 retorna 0,30. S16: balancete válido conserva igualdade de débitos/créditos. S18: conta sintética não duplica total analítico. S19: CSV simples `123,45` funciona. S20: 29/02/2024 válido é aceito. S21: zero parcelas é rejeitado.

As 19 reprovações não são 19 vulnerabilidades nem 19 perdas reais: algumas compartilham a mesma causa, e S07/S08/S13 dependem do contrato de arredondamento/reprodutibilidade proposto. O arquivo `cenarios.json` registra cada entrada, esperado e obtido para avaliação financeira independente.

## Matriz de escopo por família funcional

O anexo gerado relaciona individualmente todas as rotas e a navegação realizada. Esta matriz resume o que deve ser comprovado para fechar cada família.

| Família | Funções/controles a certificar | Evidência atual / lacuna | Etapas |
|---|---|---|---|
| Autenticação, SSO, MFA, perfil, segurança | Entrar, recuperar, encerrar sessão, conceder/revogar acesso | Guards locais exercitados; identidade real não usada nesta rodada | 008–010, 087 |
| CP, recorrência, aprovações, bloqueios | Criar, editar, pagar, aprovar, rejeitar, estornar, excluir, importar | Lógica e testes revisados; operações financeiras reais pendentes | 011–020 |
| CR, clientes, vendedores, contratos, portal | Receber, renegociar, cobrar, compartilhar, calcular comissão | Conversores/KPIs revisados; baixa e portal reais pendentes | 021–030 |
| Conciliação e movimentações | Importar OFX/CSV/XLSX, sugerir, confirmar, desfazer, filtrar conta | Falhas de parser/residual reproduzidas; transação SQL não testada live | 031–040, 044 |
| Contas bancárias, tesouraria e fluxo | Transferir, projetar, selecionar empresas, comparar, alertar | Invariantes puras e caminhos estáticos; efeito de triggers pendente | 041–050 |
| Boletos, Pix, cobrança, régua | Emitir, copiar, pagar, cancelar, enviar, reconciliar retorno | Incompatibilidade de códigos reproduzida; provedor sandbox pendente | 051–060 |
| NF-e/DF-e e certificados | Emitir, consultar, cancelar, manifestar, importar, vincular | UI simulada identificada; homologação fiscal pendente | 061–064 |
| Tributário, elisão, calculadoras, reforma | Simular, apurar, gravar, fechar, exportar, explicar memória | Bibliotecas cobertas em parte; regras/validadores externos requerem contador | 065–070 |
| Contabilidade, DRE, balanço, SPED | Lançar, totalizar, conferir, exportar, fechar/reabrir | Balancete inválido reproduzido; escrituração live pendente | 070–075 |
| Compras, orçamento, evento, metas, BI | Aprovar, comprometer, consumir, comparar, explicar indicador | Inventário e revisão de contratos; homologação ponta a ponta pendente | 020, 076–080 |
| Integrações, API, IA, automações | Conectar, sincronizar, renovar, revogar, executar ação | Falta local de função identificada; conectores reais não certificados | 080, 083–086, 093 |
| Organizações, usuários, privacidade | Convidar, aceitar, atribuir perfil, exportar, revogar | Convite placebo identificado; aceite/entrega não implementados nesse fluxo | 007–009, 081–087 |
| Alertas, sino, digest, preferências | Marcar lida, filtrar, enviar, reprocessar, abrir destino | Inventário e chamadas; entrega por canal pendente | 088–090 |
| Administração, SRE, auditoria, status | Consultar logs, privilégios, saúde, anomalias, campos e filtros | Navegação sintética não comprova papel/serviço real | 083, 087, 093–098 |

## Reprodução e artefatos

Os scripts são sondas de auditoria, fora da suíte padrão e sem modificações no código de produção. A sonda de cenários retorna exit code **1** enquanto houver reprovações, propositalmente. Não deve ser ligada ao gate de produção antes da remediação e homologação das invariantes.

```bash
bun install --frozen-lockfile
node scripts/auditoria-financeira/inventario.mjs /tmp/promo-auditoria-financeira-20260910
TZ=America/Sao_Paulo bun scripts/auditoria-financeira/cenarios.ts /tmp/promo-auditoria-financeira-20260910
bun run test:coverage
bun run test:coverage --coverage.include='src/**/*.{ts,tsx}' --coverage.reportsDirectory=/tmp/promo-auditoria-financeira-20260910/cobertura-global
```

Para a sonda de navegador, subir Vite em `127.0.0.1:18089` com os três valores **fictícios** documentados em `scripts/auditoria-financeira/navegacao.mjs` (`https://audit.supabase.co`, chave fictícia `sb_publishable_audit_fixture_1234567890` e ref `aaaaaaaaaaaaaaaaaaaa`). Executar `node scripts/auditoria-financeira/navegacao.mjs`. Todas as requisições externas são interceptadas; não usar esta fixture como mecanismo de login real.

O anexo `docs/auditoria-financeira-20260910/` preserva inventário comprimido, cenários, resumo da cobertura, resultados de navegação e hashes. Logs completos da execução permanecem em `/tmp/promo-auditoria-financeira-20260910/`; não são necessários para reexecutar as sondas. A captura de tela contém somente a empresa e dados sintéticos da auditoria.

## Condições de fechamento

Priorizar contenção de NF-e/boletos fictícios, correção de parsing/valores, residuais de conciliação, KPIs e toasts sem operação correspondente. Em seguida, concluir os contratos financeiros e a matriz de cliques em homologação. A lista de 100 etapas define dependências e critérios individuais.

O projeto só pode receber aceite integral quando todo controle aplicável do inventário tiver resultado registrado, os fluxos financeiros estiverem reconciliados no backend e os P0/P1 estiverem fechados. Código existente, mock bem-sucedido e workflow verde são evidências parciais — não certificação da operação completa.

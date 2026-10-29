# Revisão do plano e das implementações — 12/09/2026

## Parecer

**Não implementamos nem validamos todas as melhorias. O sistema não possui evidência para aceite 10/10.**

Há avanços reais na main e no runtime, mas coexistem implementação parcial, código não implantado, diferenças de deploy, funções simuladas apresentadas como reais e gates incompletos. Esta revisão não desfaz trabalhos anteriores nem transforma divergência nominal em perda.

A matriz principal reavalia as **100 etapas** do índice do Cline: **2 controles verificados no recorte, 61 parciais, 7 critérios não atendidos e 30 inconclusivos**. Isso é uma classificação de evidência, **não percentual de funcionalidades prontas**. Os 30 inconclusivos não são automaticamente defeitos ou tarefas nunca executadas.

Os planos complementares têm identificadores próprios: Graphify 50, correções 50 e frontend/contratos 100. Seus itens não devem ser somados como entregas independentes; vários se sobrepõem. Foram inventariados nos anexos, com profundidade de validação explicitada. O plano histórico de migração de 24/08 não é um catálogo atual: suas contagens e ordens de remoção não foram tomadas como autorização.

## 1. Escopo, método e limites

- Repositório: adm01-debug/Promo_Finance_V2; referência examinada: `9b1e6e89db21a3e52cf24e8fb0aa533c89178ba9`. **Visibilidade real consultada: PUBLIC**, divergente do AGENTS.md, que declara privado. Os inventários desta revisão permanecem locais e não devem ser publicados sem avaliação de exposição.
- Main local e refs/heads/main consultada no GitHub coincidem nesse SHA; nenhuma alteração pendente na main no início e nas reconferências desta revisão. Não implica que todas as branches/PRs estejam integradas.
- Banco canônico confirmado via MCP: `bwwbeyolnnzppeuhgkcd`. O projeto de origem `lszcmoymovkpckehlagr` não foi novamente inventariado nesta rodada.
- Leitura de README, instruções, planos, código relevante, CI, catálogo remoto, advisors e todas as 103 fontes Edge retornadas pelo MCP.
- Graphify usado como complemento estrutural privado: 1.649 fontes, 2.373 referências, 10.404 imports (7.399 resolvidos, 3.005 externos, zero local ausente). Não consultado grafo antigo como se fosse do SHA atual.
- Chamadas dinâmicas separadas: 216 relações, 8 RPCs, 13 Edge e 272 query keys. Referência literal não esgota os consumidores.
- Consulta SQL read-only para triggers foi negada por `Insufficient scope`. Portanto não há certificação integral de constraints, índices, policies, rotinas SQL, triggers, views, enums, extensões, privilégios, jobs e definições de migrations atuais.
- Não houve navegação manual por todos os botões, dois tenants reais, transmissão fiscal, criação de cobrança, email real ou teste de carga em produção. Evidência de código/teste não foi promovida a tráfego real.
- Nenhuma DDL/DML, rotação, exclusão, merge, push ou deploy nesta revisão. Só documentos e reprodutor offline no worktree isolado `docs/codex-revisao-plano-20260912`.
- Critério adotado: código → testes do comportamento → contrato/schema → deploy exato → observação real → aceite. Cada estágio requer sua própria evidência.

## 2. Paridade GitHub × banco: não está integral

| Verificação | Resultado |
| --- | --- |
| Git main local × GitHub main | Mesmo SHA auditado |
| Arquivos git rastreados | 2.925 |
| Edge com index.ts local | 104 |
| Edge no catálogo remoto | 103 |
| Somente local | api-keys-manage |
| Somente remota | Nenhuma |
| Bundles remotos com todos os arquivos retornados iguais à main | 46 |
| Bundles com pelo menos um arquivo diferente | 57 |
| Arquivo remoto sem correspondência local após normalização de caminho | Nenhum |
| JWT gateway local | 53 true / 51 false |
| JWT gateway remoto | 56 true / 47 false |
| Tabelas public no catálogo | 271, todas com RLS habilitada |
| Colunas dessas tabelas | 3.578 |
| Arquivos de migration locais | 596 |
| Versões no ledger remoto | 356 |
| Versões coincidentes | 33 |
| Arquivos com versão somente local | 563 |
| Versões somente no ledger | 323 |

A comparação de fontes normaliza CRLF/LF; abrange handlers e arquivos compartilhados **retornados pelo MCP**, não o conteúdo transitivo das URLs de dependências externas. Igualdade textual não comprova configuração de secrets, permissões ou comportamento. Divergência textual também não prova defeito, perda ou que a main seja a versão correta a implantar.

As três diferenças de gateway são `ci-security-gate-log`, `n8n-callback` e `notify-performance-alert`: local false, remoto true. Isso pode ser hardening intencional ou incompatibilidade com chamadores internos; requer contrato e teste do chamador, não sincronização automática.

Casos prioritários: `compare-schemas` v12, `mcp-query` v15 e `send-push-notification` v13 divergem. Em `mcp-query`, sql-policy.ts coincide, mas handler e sql-write-guard.ts diferem. Não afirmar que a proteção testada localmente está integralmente implantada.

`convidar-usuario` v1 tem os cinco arquivos retornados idênticos à main e implantação comprovada. Isso encerra a dúvida de publicação daquele bundle, não a homologação de convite real.

Os números de migrations representam versões/arquivos, não operações SQL equivalentes. Nenhuma das 563 diferenças locais foi automaticamente chamada de migration perdida. Não executar `db push` em bloco, reparar ledger ou recriar objetos sem genealogia e autorização.

## 3. Achados prioritários com evidência

### A01 — EXPERT anuncia boleto inexistente — critério funcional não atendido

`src/hooks/expert-actions/financial-actions.ts:238` lê a conta e constrói código de barras com `Math.random()` e relógio; retorna sucesso e “BOLETO GERADO” sem provedor. A ação está conectada por `useExpertActions.ts` e `pages/Expert.tsx`.

Reprodução offline executa a função original transpilada, substituindo apenas dependências. Confirmado: somente leitura de contas_receber, nenhuma API de boleto disponível no ambiente e retorno de sucesso. Não houve cobrança real. Etapas mestre 059/070/094.

Fechamento: resposta emitida exclusivamente por provedor homologado com chave idempotente e teste de timeout/duplicação, ou ação inequivocamente indisponível/simulada sem sucesso financeiro.

### A02 — PER/DCOMP altera status com recibo simulado e ignora falha parcial

`src/hooks/usePerDcomp.ts:133` cria recibo aleatório, grava pedido como transmitido e crédito como compensado sem transmitir a um sistema externo. Conectado ao botão em `PerDcompTable.tsx:88` pelo painel `PerDcompPanel.tsx:154`.

Duas reproduções offline do código original: (a) ambos os status são escritos sem transmissão externa; (b) erro retornado na atualização de créditos é ignorado e onSuccess continua anunciando transmissão. O texto “simular” em comentário não é isolamento operacional.

Fechamento: decidir contrato real ou demonstrativo; separar estados, exigir comprovante verificável, transação/compensação e testes de falha parcial. Não é recomendação tributária nem afirmação de que houve transmissão real indevida.

### A03 — API keys parcialmente implementadas, não publicadas e contrato SQL não conciliado

`supabase/functions/api-keys-manage/index.ts` possui create com guarda, vínculo empresarial, hash e exibição única. Testes de unidade existem. O catálogo remoto não contém a função.

A tabela canônica exige `nome`, `chave` e `name` não nulos; o create não envia nome/chave. Não há defaults nesses dois campos no catálogo retornado. **Possível falha NOT NULL**, salvo trigger de compatibilidade que não pôde ser consultado. Não corrigir armazenando segredo bruto em chave.

O contrato de 50 etapas exige criar/listar/rotacionar/revogar; o handler só aceita create. A UI lista por select('*') e remove diretamente por id em `useApiKeys.ts`; não comprova revogação auditada/tenant-safe ou rotação. O mock de insert no teste aceita payload sem impor as constraints reais.

Fechamento: esclarecer trigger/schema, metadados públicos, revogação e rotação; ensaiar com schema representativo; só então publicar.

### A04 — Passkeys ainda não compõem autenticação verificável no servidor

`src/hooks/useWebAuthn.ts` gera challenges no navegador e armazena credencial diretamente. No authenticate, escolhe credencial por id e atualiza contador, mas não envia a assinatura a verificador server-side nem estabelece sessão Supabase.

`src/pages/Auth.hooks.ts:273` anuncia autenticação biométrica bem-sucedida e depois informa necessidade do backend. As Edge sugeridas webauthn-register/webauthn-verify não estão na árvore nem no catálogo.

Isso **não comprova bypass completo do login**: não foi observada criação de sessão autenticada. Comprova funcionalidade incompleta e sinal de sucesso prematuro. Fechar com challenge server-side de uso único, RP/origin/signature/replay e sessão real, ou bloquear o recurso de forma honesta.

### A05 — Guarda de papel ignora expiração

`supabase/functions/_shared/auth-guard.ts:127` consulta user_roles por user_id e is_active, mas não expires_at. A coluna existe no banco. Comentário diz usar has_role, porém implementação faz consulta direta.

Uma atribuição ativa porém vencida passa pela decisão de papel caso ainda esteja ativa no momento da consulta. Não foi verificado se algum job externo desativa papéis vencidos, nem realizado ataque em produção. A garantia deve estar na própria autorização e em teste de fronteira de tempo. O helper está idêntico no bundle de convite.

### A06 — Segurança do banco ainda não encerrada

Advisors do canônico retornaram sete categorias, totalizando 95 ocorrências:

| Categoria | Nível do advisor | Ocorrências | Interpretação |
| --- | --- | ---: | --- |
| RLS habilitada sem policy | INFO | 1 | estrategias_elisao_catalogo: pode negar acesso por intenção; não significa tabela inútil |
| View SECURITY DEFINER | ERROR | 14 | Revisar contexto de execução e isolamento; não alterar em lote |
| search_path mutável | WARN | 17 | Contradiz attestation histórica de cobertura integral |
| Materialized view exposta | WARN | 2 | mv_performance_alerts_weekly e mv_benchmark_setorial |
| SECDEF executável por anon | WARN | 3 | Duas administrativas e uma descoberta SSO com exceção potencialmente legítima |
| SECDEF executável por authenticated | WARN | 57 | Não são automaticamente 57 vulnerabilidades; validar consumidor/escopo |
| Proteção de senhas vazadas desativada | WARN | 1 | Configuração pendente de decisão/validação |

Rotinas anon: get_acessos_suspeitos, get_integrity_alerts, resolve_sso_providers_for_domain. O PR #79 de restrição administrativa continua aberto e com linter reprovado; não pode ser contado como correção integrada.

O catálogo comprova RLS habilitada em 271 tabelas, não policies corretas, isolamento de views ou permissão de RPCs. Tabela vazia não foi classificada como lixo.

### A07 — Suítes verdes não cobrem toda a obrigação do plano

- Main CI tem 213 arquivos Vitest aprovados; cobertura reportada de 71,69% statements, 65,6% branches, 63,56% functions e 72,91% lines **no conjunto instrumentado**.
- Pisos em vitest.config.ts ainda são lines/statements6, functions18, branches50. O alvo85% não foi atingido, e a trava está muito abaixo da cobertura atualmente reportada.
- `type-check` usa `tsc --noEmit` e tsconfig.json: strict=false, testes/E2E excluídos. Não confundir com tsconfig.app.json.
- Workflow Deno lista explicitamente 25 de 48 arquivos de teste; os 23 restantes estão no anexo. Isso é lacuna de manifesto/justificativa, não afirmação de que nenhum deles jamais rodou.
- Deno check foca 17 arquivos, não as 104 funções completas.
- Nesta rodada `lint:strict` reprovou: 12 warnings, exit1. Zero erros de lint não atende max-warnings0.
- Main CI não executou Observability privileges guard, Integridade dos catálogos tributários (pgTAP) e Gate35 retenção: DATABASE_URL ausente. Status correto: inconclusivo.
- Quarentena E2E é não bloqueante e Post-merge Simulation Audit está skipped. Não usar isso como teste de produção aprovado.

### A08 — Erros e navegação ainda parcialmente tratados

`useRegrasConciliacao.ts` perdeu ts-nocheck, mas continua sem checar error em leitura/insert/update, além de incremento por leitura+escrita sujeito a concorrência. Seis testes verdes não cobrem essa garantia integral.

`useOptimizedQueries.ts` retorna data ou [] sem verificar erros; indisponibilidade pode parecer ausência de dados. `usePrefetchRoutes.ts` mantém prefetch sem queryFn e sets globais. A versão .tsx é wrapper, não cópia idêntica: não apagar por “duplicidade”.

`SidebarNavGroups.tsx:249,282,287` compara pathname com href que pode conter hash; seleção por âncora ainda não atendida. O link preditivo já existe na command palette, portanto sua simples criação não deve ser refeita.

### A09 — Publicação, documentação e simulações complementares

- Workflow de deploy limita escolha a convidar-usuario e branch main, o que reduz escopo; não oferece por si só promoção vinculada a todos os gates do mesmo SHA, rollback automático ou verificação pós-deploy completa. CLI permanece latest.
- PRs #69, #73 e #79 abertos na consulta. #69 foi parcialmente sucedido por entregas mais recentes, não deve ser reintroduzido por merge cego.
- open-finance ainda contém bancos/contas/consentimentos simulados no handler; falta comprovar isolamento de sandbox na superfície usada.
- Documentos contêm contagens de87/94/102/103 funções e números antigos de migrations. O plano10/10 repete #1 com estados diferentes e diz search_path integralmente fixado; advisors atuais impedem repetir essa afirmação.
- Não copiar automaticamente as antigas propostas de Edge: existe orquestrador de elisão TypeScript; SPED tem variantes especializadas. Nome diferente não prova função de negócio ausente.

## 4. Testes e evidências efetivamente executados/consultados

**Achado adicional A10 — visibilidade divergente.** A consulta explícita `gh repo view adm01-debug/Promo_Finance_V2 --json nameWithOwner,url,isPrivate,visibility` retornou `isPrivate:false`, `visibility:PUBLIC`. Não é inferência a partir de acesso autenticado. AGENTS.md:13 declara privado. Não foi modificada a visibilidade nem executada rotação. Tratar como prioridade de segurança: confirmar intenção com o proprietário, revisar conteúdo/histórico acessível e rotacionar credenciais cuja exposição seja confirmada. Esta rodada não comprova nem descarta segredos no histórico inteiro. Tornar o repositório privado não revoga cópias ou credenciais anteriormente expostas.

| Verificação | Resultado | Limite |
| --- | --- | --- |
| 5 arquivos financeiros Vitest direcionados | 48 testes aprovados nesta rodada | Mocks; não provam provedor/banco real |
| Graphify unittest | 68 testes aprovados nesta rodada | Ferramenta estrutural, não domínio financeiro |
| Suíte MCP self-test | 15 verificações aprovadas nesta rodada | CLI/guard local, não autenticação de todos os servidores |
| Gates canônicos node --test | 8 testes aprovados nesta rodada | Snapshots sintéticos e fail-closed HTTP |
| test-supabase-config.py | Aprovado | Contrato estático de configuração |
| test-migration-replay-safety.sh | Aprovado | Não é replay efetivo de596 migrations |
| lint:strict | Reprovado,12 warnings | Não mascarado |
| Boleto sem provedor | Defeito reproduzido offline | Não representa emissão real |
| PER/DCOMP sem transmissão | Defeito reproduzido offline | Sem DML real |
| PER/DCOMP com falha de crédito | Defeito reproduzido offline | Retorno error injetado |
| CI principal do SHA | Success,213 arquivos Vitest | DB gates inconclusivos e simulação skipped |
| Fontes remotas | 103 bundles lidos/comparados | Dependências externas e secrets fora da igualdade textual |

O reprodutor `reproduzir-lacunas.cjs` executa a fonte original transpilada em contexto com dependências permitidas explicitamente, sem acesso a cliente real/rede. O exit0 indica **que o defeito foi reproduzido**, não aprovação do produto. Não integrar esse reprodutor como gate de aceite sem inverter os critérios após a correção.

Comando de reprodução (com TypeScript instalado no projeto):

```bash
node docs/auditoria-20260912/reproduzir-lacunas.cjs /caminho/do/checkout-com-dependencias
```

Fontes remotas de CI:
[CI main](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/34694654179),
[Deno main](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/34694654186),
[Linter main](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/34694654197),
[Deploy convite](https://github.com/adm01-debug/Promo_Finance_V2/actions/runs/34694667705),
[PR79](https://github.com/adm01-debug/Promo_Finance_V2/pull/79).
Dados coletados antes/depois podem mudar; esta conclusão vale para o SHA e a rodada identificados.

## 5. Matriz das 100 etapas — revalidação individual

Legenda: **V** controle verificado no recorte; **P** implementação/evidência parcial; **N** critério não atendido identificado; **I** inconclusivo/decisão ou acesso pendente. Apenas V recebe checklist marcado; não significa produto em produção aceito. A coluna “original” preserva o estado histórico, não o reafirma.


### Lote A

| Etapa | Checklist | Original | Agora | Obrigação e revalidação |
| --- | --- | --- | --- | --- |
| 001 | [ ] | 🟡 | P | Recriar baseline com commit, ferramentas, ambiente, timestamp e hashes. **Revisão:** Baseline atual fixada no SHA e nos inventários desta revisão; catálogo completo da origem e de rotinas ainda indisponível. |
| 002 | [ ] | 🟡 | P | Atualizar matriz P0–P3 e classificar vulnerabilidade, perda, drift, parcial, dívida ou falso positivo. **Revisão:** Achados atuais classificados neste relatório; severidade depende de alcance produtivo e não apenas de sinal lexical. |
| 003 | [ ] | 🟡 | P | Revalidar `compare-schemas`; preservar hardening existente e fechar qualquer segredo/auth restante. Rotação/deploy exigem autorização. **Revisão:** Handler remoto compare-schemas difere da main; falta revalidar seu contrato e comprovar rotação externa. |
| 004 | [ ] | 🟡 | P | Revalidar `send-push-notification` por tenant/usuário, chamadas internas e fallback; corrigir apenas gaps comprovados. **Revisão:** send-push-notification remoto difere; testes locais não certificam autorização e idempotência do bundle ativo. |
| 005 | [ ] | 🟡 | P | Cobrir todos os endpoints caros de IA com identidade, autorização, cota, orçamento e testes de abuso. **Revisão:** Há guards e testes de IA, mas não há evidência integral de cotas, orçamento e abuso para todos os endpoints. |
| 006 | [ ] | ❌ | P | Remover fallback sensível da suíte MCP em PR; preparar revogação/rotação externa sem expor valor. **Revisão:** Fallback hardcoded removido da suíte MCP; 15 self-tests aprovados. Revogação da credencial histórica não comprovada. |
| 007 | [x] | ✅ | V | Manter a regra de não destruição e provar que os novos lotes a respeitam. **Revisão:** Nenhuma DDL/DML, exclusão, deploy ou alteração de código do produto realizada nesta revisão; worktree isolado. |
| 008 | [ ] | 🟡 | P | Atualizar painel de prontidão com estados codificado/testado/deployado/tráfego/aceito. **Revisão:** Índice do Cline ainda referencia agosto; separação código/teste/deploy/tráfego/aceite não consolidada. |
| 009 | [ ] | ❌ | I | Implantar varredura ampliada de segredos no conteúdo e histórico, com saída mascarada e gate real. **Revisão:** Inventário Graphify sem sinal de segredo não substitui varredura do histórico inteiro e prova de rotação. |
| 010 | [ ] | ❌ | N | Fechar o gate de contenção somente após todos os P0 terem runtime e testes negativos aprovados. **Revisão:** Contenção integral não demonstrada: RPCs administrativas pendentes e falhas funcionais reproduzidas. |

### Lote B

| Etapa | Checklist | Original | Agora | Obrigação e revalidação |
| --- | --- | --- | --- | --- |
| 011 | [ ] | ⛔ | I | Restabelecer MCP da origem estritamente read-only; requer acesso/autorização operacional. **Revisão:** Acesso atual à origem não comprovado; MCP canônico não é o banco Lovable. |
| 012 | [ ] | ⛔ | I | Coletar catálogo integral da origem após 011, sem DDL/DML. **Revisão:** Não houve nova coleta integral de catálogo da origem nesta revisão. |
| 013 | [ ] | 🟡 | P | Recoletar destino e explicar variações frente ao snapshot anterior. **Revisão:** Destino coletado: 271 tabelas públicas, 3.578 colunas, 103 Edge, 356 migrations; demais catálogos têm limitação de acesso. |
| 014 | [ ] | ❌ | P | Construir genealogia das migrations do repo (551 arquivos; ver nota 2 abaixo) em relação ao ledger live (28 entradas); não replayar em bloco. **Revisão:** 596 arquivos locais versus 356 versões remotas: somente 33 versões coincidem. Genealogia semântica ainda pendente. |
| 015 | [ ] | 🟡 | P | Internalizar SQL real das migrations destino-only sem reconstrução por suposição ou reaplicação cega. **Revisão:** 323 versões apenas no ledger precisam de SQL/proveniência; não reconstruir SQL por nome. |
| 016 | [ ] | ❌ | P | Explicar migration local ausente no ledger e classificar não aplicável, falha, substituição ou perda de deploy. **Revisão:** 563 arquivos com versão apenas local exigem classificação por substituição, baseline, não aplicação ou perda. |
| 017 | [ ] | ❌ | I | Classificar individualmente `sql/` e `db/functions/` como oficial, biblioteca, diagnóstico ou legado. **Revisão:** Não comprovada homologação individual de sql/ e db/functions/; proibição de remoção preservada. |
| 018 | [ ] | ❌ | P | Regenerar tipos por ambiente após homologar baseline; remover compensações com testes. **Revisão:** Tipos existem, mas api_keys demonstra contrato não reconciliado; regeneração não substitui ajuste funcional. |
| 019 | [ ] | ⛔ | I | Produzir diff semântico origem × destino × repo quando ambos os acessos estiverem disponíveis. **Revisão:** Diff semântico tripartido permanece sem nova coleta integral da origem e SQL canônico. |
| 020 | [ ] | ⛔ | I | Obter decisão do proprietário sobre baseline e eventual desativação da origem. **Revisão:** Destino canônico confirmado pelo proprietário; política de origem/descomissionamento não revalidada. |

### Lote C

| Etapa | Checklist | Original | Agora | Obrigação e revalidação |
| --- | --- | --- | --- | --- |
| 021 | [ ] | 🟡 | P | Reclassificar objetos só nos tipos, respeitando ADR-001 e partições futuras; nada de recriação automática. **Revisão:** ADR de escopo e partições precisam acompanhar objetos só nos tipos; ausência de uso não autoriza recriação. |
| 022 | [ ] | 🟡 | P | Explicar objetos só no destino, inclusive partições e `estrategias_elisao_catalogo`. **Revisão:** estrategias_elisao_catalogo existe com RLS sem policy; demais objetos exclusivos exigem decisão de uso. |
| 023 | [ ] | ❌ | I | Reconciliar views ausentes por definição, consumidor e decisão; nunca apenas por nome. **Revisão:** Definições e consumidores completos de views não revalidados; list_tables não substitui pg_views. |
| 024 | [ ] | ❌ | P | Mapear as colunas divergentes contra payloads, defaults, nulabilidade, migrations e tipos. **Revisão:** api_keys exige nome/chave e create envia name/hash; eventual trigger de compatibilidade não pôde ser conferido. |
| 025 | [ ] | ❌ | I | Preparar validação da constraint `faixas_simples_reparticao_soma_chk`; aplicar somente após autorização e zero linha incompatível. **Revisão:** Validação live da constraint faixas_simples_reparticao_soma_chk não comprovada com execute_sql indisponível. |
| 026 | [ ] | 🟡 | I | Auditar índices com workload, FKs, filtros RLS, custo de escrita e janela suficiente. **Revisão:** Não executada nova análise de workload; contagem ou índice sem uso em janela curta não autoriza remoção. |
| 027 | [ ] | ❌ | P | Definir uso e policy mínima de `estrategias_elisao_catalogo`; aplicar somente após autorização. **Revisão:** Advisor confirma estrategias_elisao_catalogo sem policy; falta decidir exposição mínima necessária. |
| 028 | [ ] | 🟡 | P | Completar matriz CRUD das policies e testes cross-tenant; justificar policies literais verdadeiras. **Revisão:** 271 tabelas com RLS habilitada não provam isolamento; testes CRUD multiempresa reais incompletos. |
| 029 | [ ] | 🟡 | P | Preparar redução de `GRANT ALL`/`TRUNCATE` para `authenticated` sem quebrar fluxos. **Revisão:** Há gates SQL e PR #79 de ACL, mas privilégios integrais atuais não puderam ser consultados. |
| 030 | [ ] | 🟡 | P | Revisar anon insert de telemetria e grants de sequences com antiabuso e consumidor comprovado. **Revisão:** Advisor aponta EXECUTE anon em três rotinas; diferenciar descoberta SSO legítima de RPC administrativa. |
| 031 | [ ] | 🟡 | P | Completar catálogo de rotinas: assinatura, owner, segurança, grants, callers e dependências. **Revisão:** Catálogo de funções SQL com owner/ACL/callers não obtido integralmente; list_edge_functions não é pg_proc. |
| 032 | [ ] | ❌ | I | Remover referências Lalamove residuais de `check_integrity_invariants` por migration nova e autorizada. **Revisão:** Referências efetivas de check_integrity_invariants precisam de definição live; não reexecutar migration histórica. |
| 033 | [ ] | 🟡 | I | Testar overloads no PostgREST e resolver somente ambiguidades comprovadas. **Revisão:** Overloads PostgREST não testados integralmente com credenciais representativas. |
| 034 | [ ] | 🟡 | P | Revisar todas as `SECURITY DEFINER`; preservar `search_path` fixo e reduzir superfície. **Revisão:** Advisor identifica 17 search_path mutáveis; attestation histórica não certifica estado atual. |
| 035 | [ ] | 🟡 | P | Ajustar `EXECUTE` por consumidor comprovado; toda revogação remota exige autorização. **Revisão:** PR #79 aberto, linter reprovado; dois acessos administrativos anon continuam indicados pelo advisor. |
| 036 | [ ] | ❌ | I | Provar efeito duplicado em triggers de organização antes de propor retirada de um deles. **Revisão:** Efeito e ordem de triggers de organização não demonstrados; não apagar por duplicidade aparente. |
| 037 | [ ] | 🟡 | I | Completar catálogo/teste de triggers com evento, ordem, custo, falha e owner. **Revisão:** Consulta read-only de triggers foi negada por escopo; catálogo de triggers permanece não certificado. |
| 038 | [ ] | 🟡 | P | Certificar filtros tenant, segurança, colunas e refresh de views/matview. **Revisão:** Advisor indica 14 views SECURITY DEFINER e duas matviews expostas; falta teste tenant/refresh. |
| 039 | [ ] | 🟡 | P | Revalidar jobs e corrigir o refresh concorrente de `mv_performance_alerts_weekly`, que exige índice único compatível ou estratégia sem `CONCURRENTLY`. **Revisão:** Gate offline de constraint/cron passou; execução real do refresh e índice compatível não comprovados. |
| 040 | [ ] | 🟡 | I | Reconciliar cron origem/destino/migrations; nenhuma alteração de schedule sem homologação. **Revisão:** Não recolhidos jobs completos de origem e destino; ledger não comprova execução de cron. |

### Lote D

| Etapa | Checklist | Original | Agora | Obrigação e revalidação |
| --- | --- | --- | --- | --- |
| 041 | [ ] | 🟡 | P | Manter catálogo/config explícito 103/103, atualizar contratos, secrets e auth conforme implementação real. **Revisão:** 104 handlers locais/103 remotos e três diferenças verify_jwt; matriz histórica de 103/99 não é atual. |
| 042 | [ ] | 🟡 | P | Regressão completa de `compare-schemas` com admin, segredo externo, auditoria e fail-closed. **Revisão:** compare-schemas ativo diverge do handler local; regressão integral contra esse código não comprovada. |
| 043 | [ ] | 🟡 | P | Regressão completa do push com tenant, destinatário, idempotência e chamada interna. **Revisão:** Há testes de push, mas bundle remoto diverge e falta teste autorizado de destinatário/tenant real. |
| 044 | [ ] | ❌ | P | Implementar `api-keys-manage` ou adaptar UI ao contrato aprovado; segredo exibido uma única vez. **Revisão:** api-keys-manage implementado/testado apenas para create, ausente no deploy; contrato de colunas e ciclo de vida incompletos. |
| 045 | [ ] | ❌ | I | Implementar `webhook-financeiro` ou remover/desabilitar a promessa após decisão de produto. **Revisão:** Não localizada Edge com nome webhook-financeiro; investigar promessa e equivalente antes de criar endpoint redundante. |
| 046 | [ ] | ❌ | P | Corrigir referência `enviar-push-notification` para `send-push-notification` em migration corretiva nova. **Revisão:** Migration histórica ainda cita enviar-push-notification; definição live não disponível para provar correção posterior. |
| 047 | [ ] | 🟡 | P | Consolidar auth, cota, timeout, cancelamento, custo e auditoria das funções de IA. **Revisão:** Rate limit/guards existem; expiração de papel e concorrência de cota ainda exigem testes. |
| 048 | [ ] | ❌ | P | Classificar as 99 funções locais sem JWT: JWT, webhook/HMAC, cron secret, chamada interna ou público controlado. Testar cada exceção. **Revisão:** Inventário atual completo de nomes, não de comportamento: 51 locais e 47 remotos sem JWT de gateway. |
| 049 | [ ] | 🟡 | P | Fazer CI cobrir todos os testes Edge, check e lint reais sem mascaramento. **Revisão:** 48 arquivos Deno identificados; 25 explicitamente listados no workflow e check focado em 17 arquivos. |
| 050 | [ ] | ⛔ | P | Deploy canário e observação de tráfego requerem autorização, staging e rollback. **Revisão:** Deploy de convite comprovado por pipeline e código remoto; canário e observação abrangentes não comprovados. |

### Lote E

| Etapa | Checklist | Original | Agora | Obrigação e revalidação |
| --- | --- | --- | --- | --- |
| 051 | [ ] | 🟡 | P | Certificar rota, página, menu, permissão, dados e estados de erro/vazio para todo o mapa atual. **Revisão:** Mapa estrutural atual sem imports locais ausentes; não equivale a testar todas as rotas/botões com papéis reais. |
| 052 | [ ] | ❌ | P | Corrigir deep link de alertas preditivos e cobrir navegação direta/command palette. **Revisão:** Link /inteligencia#alertas-preditivos já existe; falta certificar ativação do destino e navegação direta. |
| 053 | [ ] | ⛔ | I | Integrar, arquivar ou retirar páginas órfãs somente após decisão explícita do proprietário. **Revisão:** Páginas órfãs devem ser reconciliadas com módulos inativos e decisão de produto; nenhuma remoção nesta rodada. |
| 054 | [ ] | ❌ | N | Tornar seleção do menu sensível ao hash com testes de histórico/refresh/mobile. **Revisão:** SidebarNavGroups ainda compara pathname com href contendo hash; seleção de âncora não concluída. |
| 055 | [ ] | ❌ | P | Eliminar score aleatório de cobranças; usar dado determinístico ou “indisponível”. **Revisão:** CustomerDeepScore corrigido no código e dois testes aprovados; não certifica todo domínio cobrança em produção. |
| 056 | [ ] | 🟡 | P | Garantir persistência canônica e correlação do histórico WhatsApp proativo ponta a ponta. **Revisão:** Implementação proativa e testes existem; falta comprovar mensagem, correlação e histórico reais sem duplicação. |
| 057 | [ ] | ❌ | P | Substituir convite placebo por convite real ou UI honesta de intenção. **Revisão:** convidar-usuario implantado e bundle idêntico; entrega de email, aceite, papel e recuperação reais ainda não comprovados. |
| 058 | [ ] | ❌ | P | Concluir NF-e em homologação real ou isolar visualmente como simulação; nunca aparentar emissão fiscal real. **Revisão:** Simulador SEFAZ existe; presença de modo homologação não demonstra isolamento de toda superfície produtiva. |
| 059 | [ ] | ❌ | N | Gerar identificadores de boleto somente no backend/provedor homologado, com concorrência testada. **Revisão:** gerarBoleto do EXPERT fabrica código aleatório e anuncia sucesso; reproduzido offline sem provedor. |
| 060 | [ ] | ❌ | P | Corrigir prefetch/imports e duplicidade `usePrefetchRoutes.ts`/`.tsx` com medição e diff mínimo. **Revisão:** .ts é hook e .tsx wrapper, não cópias idênticas. Prefetch sem queryFn e cache global ainda exigem validação. |

### Lote F

| Etapa | Checklist | Original | Agora | Obrigação e revalidação |
| --- | --- | --- | --- | --- |
| 061 | [ ] | ❌ | I | Tornar atualização de oportunidades de elisão atômica e idempotente; preservar estado anterior em falha. **Revisão:** Atomicidade/idempotência integral da atualização de oportunidades de elisão não comprovada. |
| 062 | [ ] | 🟡 | P | Remover `@ts-nocheck` e tratar todos os erros em regras de conciliação. **Revisão:** Sem ts-nocheck neste hook e seis testes verdes; aprender/aplicar regras ainda ignoram erros e incrementam por leitura+escrita. |
| 063 | [ ] | ❌ | N | Diferenciar vazio real, RLS, indisponibilidade e drift nas queries otimizadas. **Revisão:** Queries otimizadas ainda retornam data ou [] sem verificar error; indisponibilidade pode aparecer como vazio. |
| 064 | [ ] | ❌ | P | Impedir sucesso integral quando qualquer suboperação da auditoria de conciliação falhar. **Revisão:** Melhorias na página de conciliação e 24 testes passam; não encerram auditoria de todas as suboperações. |
| 065 | [ ] | ❌ | P | Resolver TODOs de schema individualmente contra o catálogo atual. **Revisão:** Contrato api_keys demonstra TODO funcional remanescente; triagem schema deve ser por consumidor. |
| 066 | [ ] | ❌ | P | Modelar escrita secundária com atomicidade, compensação ou tolerância observável. **Revisão:** PER/DCOMP ignora erro da escrita de créditos após alterar pedido; falha parcial reproduzida offline. |
| 067 | [ ] | ❌ | P | Revisar awaits Supabase suspeitos caso a caso; corrigir somente erros realmente ignorados. **Revisão:** Erros Supabase ignorados confirmados em regras, queries otimizadas e PER/DCOMP; não basta lint verde. |
| 068 | [ ] | ❌ | P | Triar TODO/FIXME/HACK, `@ts-nocheck` e `eslint-disable`; não ampliar ignores. **Revisão:** Dívida ainda existe; varredura lexical não decide sozinha se TODO/supressão representa bug. |
| 069 | [ ] | ❌ | I | Mapear objetos sem consumidor para roadmap/owner; lista de decisão, nunca exclusão automática. **Revisão:** Sem consumidor literal não significa objeto morto: chamadas dinâmicas e integrações externas preservadas. |
| 070 | [ ] | 🟡 | P | Completar invariantes de cobrança, boleto, conciliação, fiscal, convite e elisão, incluindo concorrência e falha parcial. **Revisão:** 48 testes financeiros direcionados verdes; três cenários diagnósticos reproduziram defeitos não cobertos por esse aceite. |

### Lote G

| Etapa | Checklist | Original | Agora | Obrigação e revalidação |
| --- | --- | --- | --- | --- |
| 071 | [ ] | ❌ | P | Alinhar thresholds documentados e reais, elevando gradualmente a partir de baseline comprovado. **Revisão:** CI mede 72,91% linhas no conjunto instrumentado, mas trava mínima segue 6%; alvo 85% não atingido. |
| 072 | [ ] | ❌ | P | Incluir testes/E2E/apoio no typecheck e avançar strictness por domínio. **Revisão:** tsconfig.json usado pelo script exclui testes/E2E e usa strict=false; tsconfig.app diferente não muda esse gate. |
| 073 | [ ] | 🟡 | P | Executar todos os 35 arquivos Deno atuais ou justificar tecnicamente exclusões explícitas. **Revisão:** 25 de 48 arquivos explicitamente listados; 23 precisam de execução ou justificativa de exclusão. |
| 074 | [ ] | ❌ | P | Corrigir Deno lint em lotes revisáveis e remover `\/\/ true`; não gerar mega-diff. **Revisão:** Lint Deno bloqueante no recorte endurecido; gate de todo diretório ainda não demonstrado. |
| 075 | [x] | ✅ | V | Preservar a permissão mínima de leitura no comando Deno e seu teste de regressão. **Revisão:** Permissão --allow-read preservada nos dois comandos Deno; self-test MCP mantém modo read-only padrão. |
| 076 | [ ] | ❌ | N | Fazer `lint:strict` passar sem ignores globais e promovê-lo a gate real. **Revisão:** lint:strict executado nesta revisão: exit 1, zero erros e 12 avisos; critério max-warnings=0 não atendido. |
| 077 | [ ] | ❌ | I | Formatar em PRs mecânicos separados; zero mistura com mudança funcional. **Revisão:** Não reformatado código alheio; política de PR mecânico não substitui evidência de execução dos lotes. |
| 078 | [ ] | 🟡 | P | Corrigir E2E Supabase HTTP 400, tornar ambiente hermético e provar os navegadores/projetos prometidos. **Revisão:** CI E2E crítico/logout verdes; quarentena não bloqueante e simulação pós-merge skipped não provam cobertura integral. |
| 079 | [ ] | ❌ | I | Preparar decisão de lockfile; remover somente o arquivo individualmente aprovado. **Revisão:** Decisão única de lockfile não revalidada; não remover arquivo por preferência técnica. |
| 080 | [ ] | 🟡 | P | Fixar Bun/runners/dependências e fazer auditoria de vulnerabilidade bloquear conforme política. **Revisão:** Deno fixado, mas CLI deploy latest e auditoria Bun não bloqueante mantêm lacunas de reprodutibilidade. |

### Lote H

| Etapa | Checklist | Original | Agora | Obrigação e revalidação |
| --- | --- | --- | --- | --- |
| 081 | [ ] | ❌ | I | Definir e aplicar orçamento de bundle por rota; medir chunks grandes atuais. **Revisão:** Build bem-sucedido não comprova orçamento por rota; baseline e gate de tamanho precisam de evidência atual. |
| 082 | [ ] | 🟡 | P | Remover avisos Vite/OXC/esbuild/depreciações e comprovar artefato final. **Revisão:** Build verde no CI; execução local ainda avisa sobre plugin React SWC, portanto zero avisos não comprovado. |
| 083 | [ ] | ❌ | P | Decompor somente hotspots comprovados, preservando arquivos gerados e comportamento. **Revisão:** Refatorações existem, porém lint aponta arquivos longos e documentação de único arquivo acima de 700 está desatualizada. |
| 084 | [ ] | 🟡 | P | Atualizar mapa arquitetural/Graphify com commit, saúde e limitações explícitas. **Revisão:** 68 testes Graphify verdes, inventários regenerados no SHA atual; grafo antigo não usado como verdade corrente. |
| 085 | [ ] | 🟡 | P | Completar SLOs, alertas, owner, correlação e runbooks para todo fluxo P0/P1. **Revisão:** Runbooks/telemetria existentes, mas freshness de cron, alertas injetados e owners não certificados para todo fluxo. |
| 086 | [ ] | ❌ | N | Atualizar documentação e contagens por scripts reproduzíveis, removendo contradições. **Revisão:** Índice Cline, plano 10/10 e catálogos contêm números/estados antigos e item #1 duplicado. |

### Lote I

| Etapa | Checklist | Original | Agora | Obrigação e revalidação |
| --- | --- | --- | --- | --- |
| 087 | [ ] | ⛔ | I | Apresentar decisão por lockfile; não remover nada sem aprovação. **Revisão:** Nenhuma remoção de lockfile autorizada individualmente nesta revisão. |
| 088 | [ ] | ⛔ | I | Comparar suíte E2E paralela/Dyad e preservar cobertura exclusiva antes de decidir. **Revisão:** Cobertura exclusiva das suítes paralelas/Dyad não revalidada; preservar. |
| 089 | [ ] | ⛔ | I | Submeter artefatos, relatórios, `sql/` e `db/functions/` individualmente à decisão. **Revisão:** Nenhum artefato, SQL ou relatório excluído; classificação depende de evidência e decisão individual. |
| 090 | [ ] | ⛔ | I | Homologar matriz manter/integrar/arquivar/remover/investigar com o proprietário. **Revisão:** Matriz manter/integrar/arquivar/remover sem novo aceite do proprietário. |

### Lote J

| Etapa | Checklist | Original | Agora | Obrigação e revalidação |
| --- | --- | --- | --- | --- |
| 091 | [ ] | ⛔ | I | Preparar staging representativo, backup e rollback; requer autorização e infraestrutura. **Revisão:** Staging representativo, backup e restauração não certificados por execução nesta rodada. |
| 092 | [ ] | ⛔ | P | Ensaiar migrations do zero e sobre baseline somente após genealogia homologada. **Revisão:** Teste de replay safety passou, mas replay do zero/incremental não foi executado nem autorizado. |
| 093 | [ ] | ⛔ | I | Implantar segurança apenas em staging autorizado e testar isolamento. **Revisão:** Não realizados testes com duas identidades e dois tenants em staging nesta rodada. |
| 094 | [ ] | ⛔ | P | Exercitar E2E real de convite, boleto, cobrança, WhatsApp, conciliação, elisão e NF-e. **Revisão:** Smokes/testes locais existentes não substituem sete fluxos reais; boleto/PER/DCOMP impedem aceite. |
| 095 | [ ] | ⛔ | I | Executar regressão integral do banco e provar diff apenas com exceções aprovadas. **Revisão:** Sem acesso SQL integral não há prova de diff apenas com exceções aprovadas. |
| 096 | [ ] | ⛔ | P | Testar carga, indisponibilidade, retries, orçamento e idempotência. **Revisão:** Três simulações offline executadas; carga/retries/idempotência com provedores reais não certificados. |
| 097 | [ ] | ⛔ | I | Ativar gates operacionais e provar alertas por falha injetada. **Revisão:** Não injetadas falhas em produção nem demonstrados alertas operacionais desta rodada. |
| 098 | [ ] | ⛔ | P | Fazer rollout canário produtivo com janela e rollback automático. **Revisão:** Pipeline permite deploy isolado de convite; não implementa por si só rollback automático e janela canário. |
| 099 | [ ] | ⛔ | I | Observar e reconciliar tráfego real entre frontend, Edge, banco e provedores. **Revisão:** Não coletada reconciliação de tráfego financeiro real frontend/Edge/banco/provedores. |
| 100 | [ ] | ⛔ | N | Solicitar aceite final apenas com zero P0/P1 aberto e dossiê completo. **Revisão:** Aceite 10/10 bloqueado por falhas reproduzidas, divergências não classificadas e evidência produtiva incompleta. |

## 6. Planos complementares: não confundir checkboxes com homologação

### 6.1 Correções em 50 etapas

Revisão cruzada das obrigações, sem reutilizar os números do mestre. Apenas a etapa40 estava marcada no documento histórico. Abaixo constam achados atuais ou limite específico; nenhum item recebe aceite produtivo por mera existência de arquivo.

| ID C50 | Obrigação | Revisão |
| --- | --- | --- |
| 01 | Confirmar o projeto Supabase de produção | Projeto canônico confirmado; domínio frontend produtivo não revalidado. |
| 02 | Criar inventário read-only do runtime produtivo | Catálogo parcial atual coletado; SQL completo negado. |
| 03 | Gerar diff completo repositório × produção | Anexo compara 103 bundles; diffs SQL semânticos não concluídos. |
| 04 | Tornar a cadeia de migrations reproduzível | 596 arquivos / 356 versões; genealogia e replay pendentes. |
| 05 | Atualizar inventários e documentos canônicos | Contagens antigas contraditórias; relatório registra baseline atual. |
| 06 | Aplicar e validar as migrations de reconciliação de 22/08 em staging | Não comprovado staging com todas as reconciliações. |
| 07 | Reconciliar todas as tabelas consumidas pelo código | api_keys com contrato incompleto; demais consumidores requerem matriz. |
| 08 | Reconciliar as 15 RPCs ausentes | Não declarar RPC ausente apenas por nome; catálogo pg_proc indisponível. |
| 09 | Reconciliar as views consumidas | Views precisam de definição e teste RLS atual. |
| 10 | Criar e proteger os buckets necessários | Não revalidada disponibilidade/policy de todos os buckets. |
| 11 | Instalar e validar `pg_net` | Extensões não certificadas por consulta SQL nesta rodada. |
| 12 | Reconciliar os 16 cron jobs históricos | Jobs não recolhidos integralmente; não reativar automaticamente. |
| 13 | Validar a régua de cobrança ponta a ponta | 48 testes de recorte financeiro não comprovam régua inteira. |
| 14 | Ativar automações tributárias e de conformidade | Falta execução observada e reconciliação de jobs tributários. |
| 15 | Ativar automações de observabilidade e manutenção | Falta prova atual de jobs, owners e SLOs. |
| 16 | Implementar `orquestrador-elisao` | Há orquestrador TypeScript em src/lib/tributario/elisao; falta decidir se substitui a Edge proposta. |
| 17 | Implementar `importar-xml-nfe` | Não encontrada Edge deste nome; mapear equivalentes de importação e contrato XML antes de criar outra. |
| 18 | Implementar `exportar-sped` | Há gerar-sped-ecd/ecf e exportar-sped-contribuicoes; reconciliar escopo do nome genérico. |
| 19 | Implementar `previsao-tributaria-ia` | Nome proposto sem handler correspondente; equivalência funcional e proveniência não homologadas. |
| 20 | Implementar `api-keys-manage` | create local testado; deploy ausente, schema e rotação/revogação incompletos. |
| 21 | Implementar `webauthn-register` | webauthn-register ausente; registro atual sem verificação server-side demonstrada. |
| 22 | Implementar `webauthn-verify` | webauthn-verify ausente; fluxo atual não valida assinatura no servidor nem cria sessão. |
| 23 | Retirar a emissão NF-e simulada da superfície produtiva | Simulador existe; isolamento integral da UI produtiva não certificado. |
| 24 | Decidir e implementar o destino da emissão NF-e | Decisão e homologação de emissão fiscal real não demonstradas. |
| 25 | Substituir ou restringir o Open Finance simulado | open-finance ainda tem contas/consentimento simulados; sandbox exige aviso e isolamento. |
| 26 | Corrigir os shards E2E 2/3 e 3/3 | E2E crítico/logout verdes no SHA; isso não encerra shards/escopo histórico. |
| 27 | Eliminar skips condicionais indevidos nos E2E | Há gates explícitos e quarentena não bloqueante; não contar skips como aprovação. |
| 28 | Habilitar os gates de banco no CI | DATABASE_URL ausente deixa três gates inconclusivos. |
| 29 | Elevar cobertura de forma incremental até 85% | 72,91% linhas instrumentadas; piso6%, meta85% não atingida. |
| 30 | Auditar a qualidade dos testes existentes | Simulações encontraram gaps fora de testes verdes; mocks não validam schema SQL. |
| 31 | Regenerar os tipos Supabase a partir do schema canônico | Tipos existentes não garantem paridade; api_keys contradiz payload. |
| 32 | Remover os sete `@ts-nocheck` restantes | Remoção de supressão não basta: erros ignorados persistem em regras/PER-DCOMP. |
| 33 | Resolver os TODOs de divergência de schema | Contrato coluna-a-coluna ainda pendente. |
| 34 | Validar isolamento multiempresa em toda a superfície | RLS habilitada em 271 tabelas não comprova isolamento em toda superfície. |
| 35 | Promover CSP de report-only para enforcement | Plano 10/10 declara report-only; enforcement e violações live não certificados. |
| 36 | Validar Asaas ponta a ponta | Não feitas cobranças reais nem testes de webhook/provedor desta rodada. |
| 37 | Validar Bling ponta a ponta | Não executado OAuth/sync/webhook real Bling nesta rodada. |
| 38 | Validar Bitrix24 ponta a ponta | Não executado OAuth/sync/webhook real Bitrix nesta rodada. |
| 39 | Fortalecer filas, retries e DLQ | Concorrência e replay integral de filas ainda sem aceite. |
| 40 | Revisar o módulo de logística herdado | Documento declara decisão de exclusão Lalamove; não autoriza apagar outros objetos. |
| 41 | Gerar baseline real de bundle por rota | CI build passou; orçamento de bundle por rota não homologado. |
| 42 | Aplicar lazy loading às rotas e módulos pesados | Lazy imports resolvem; prefetch sem queryFn permanece. |
| 43 | Revalidar índices com telemetria atual | Sem nova janela de workload produtivo, índices não certificados. |
| 44 | Tornar o SRE Command Center operacional | UI SRE existe; RPCs/ACL/telemetria live incompletas. |
| 45 | Implantar SLOs, alertas e runbooks acionáveis | Falta prova de alerta injetado e owner em cada fluxo. |
| 46 | Executar migração integral para staging limpo | Replay safety passou; migração integral em staging não executada. |
| 47 | Executar bateria de homologação financeira e fiscal | Boleto/PER-DCOMP reproduzidos impedem homologação financeira integral. |
| 48 | Realizar ensaio de rollback e recuperação | Não executado restore/rollback nem aferido RTO/RPO. |
| 49 | Promover para produção com observação assistida | Convite publicado isoladamente; observação global não certificada. |
| 50 | Comprovar uso real e encerrar os planos anteriores | Sem aceite por tráfego e zero P0/P1; não encerrar planos anteriores. |

### 6.2 Graphify em 50 etapas

O documento declara38 marcadas/12 abertas; a validação de11/09 registra publicação e onze perfis. Hoje rerodaram os68 testes e dois inventários, não cada perfil/benchmark nem todas as condições de aceite humano. “Histórico validado localmente” não quer dizer sistema financeiro pronto. O Graphify influenciou esta revisão ao delimitar chamadas dinâmicas e eliminar falsos positivos; nenhum grafo obsoleto fundamentou decisão destrutiva.

| ID G50 | Etapa | Declaração do plano | Limite da revisão atual |
| --- | --- | --- | --- |
| 001 | Delimitar a integração. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 002 | Registrar a base e preservar outros agentes. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 003 | Verificar a ferramenta existente. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 004 | Preservar o mapa arquitetural atual. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 005 | Simular ameaças e falhas antes da expansão. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 006 | Reproduzir instalação em ambiente limpo. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 007 | Fechar a cadeia de dependências. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 008 | Implementar corpus explícito rastreado. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 009 | Aplicar filtro inicial de conteúdo sensível. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 010 | Separar saída privada do produto. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 011 | Congelar os bytes selecionados. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 012 | Aplicar orçamento de processamento. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 013 | Isolar configurações e validar versão. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 014 | Preservar extração bruta e diagnóstico. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 015 | Registrar evidência por execução. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 016 | Validar o piloto AST real. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 017 | Expandir por módulos financeiros. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 018 | Validar resolução de imports TypeScript. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 019 | Expandir backend Deno e helpers. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 020 | Mapear relações dinâmicas da aplicação. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 021 | Mapear migrations sem executá-las. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 022 | Inventariar o catálogo canônico somente leitura. | Aberta | Permanece aberta; não encerrada por testes da ferramenta. |
| 023 | Comparar origem e destino sem confundir intenção com perda. | Aberta | Permanece aberta; não encerrada por testes da ferramenta. |
| 024 | Ligar referências de código a objetos SQL. | Aberta | Permanece aberta; não encerrada por testes da ferramenta. |
| 025 | Rastrear dependências indiretas e implementação parcial. | Aberta | Permanece aberta; não encerrada por testes da ferramenta. |
| 026 | Preservar origem e confiança das relações. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 027 | Tornar lacunas visíveis. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 028 | Preservar a direção do relacionamento. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 029 | Recusar evidência estrutural inválida. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 030 | Calibrar qualidade antes de expandir. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 031 | Integrar comandos do projeto. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 032 | Homologar consultas e caminhos. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 033 | Nomear comunidades de forma verificável. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 034 | Disponibilizar visualização local segura. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 035 | Oferecer MCP local opcional. | Aberta | Permanece aberta; não encerrada por testes da ferramenta. |
| 036 | Exercitar falhas com dados sintéticos. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 037 | Executar smoke com o Graphify real. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 038 | Verificar reprodutibilidade e concorrência. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 039 | Homologar o workflow privado. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 040 | Testar compatibilidade e upgrades. | Aberta | Permanece aberta; não encerrada por testes da ferramenta. |
| 041 | Documentar comandos, limites e recuperação. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 042 | Orientar múltiplos agentes sem instalar hooks. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 043 | Medir ganho real de navegação. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 044 | Definir atualização e retenção. | Aberta | Permanece aberta; não encerrada por testes da ferramenta. |
| 045 | Integrar resultados à revisão de mudanças. | Aberta | Permanece aberta; não encerrada por testes da ferramenta. |
| 046 | Fechar cobertura por módulo e categoria. | Aberta | Permanece aberta; não encerrada por testes da ferramenta. |
| 047 | Revisar privacidade e fronteiras de confiança. | Aberta | Permanece aberta; não encerrada por testes da ferramenta. |
| 048 | Comparar utilidade antes/depois. | Aberta | Permanece aberta; não encerrada por testes da ferramenta. |
| 049 | Integrar via PR com gates verificados. | Marcada | Entrega documentada; suíte comum68/68 hoje. Aceite específico não reexecutado integralmente. |
| 050 | Aceitar operacionalmente e manter backlog honesto. | Aberta | Permanece aberta; não encerrada por testes da ferramenta. |

### 6.3 Frontend e contratos em 100 etapas

O documento registra19 marcadas/81 abertas. As marcadas são sobretudo fundação de contrato/versionamento e gates. A triagem abaixo preserva cada obrigação; **não é uma afirmação de que100 endpoints ou toda a acessibilidade foram testados**. Relacionar contratos/auth aos mestres041–049, UI aos051–060 e gates aos071–080/094–100. A revalidação comportamental endpoint a endpoint ainda falta.

| ID F100 | Obrigação original | Estado documental e evidência atual |
| --- | --- | --- |
| 001 | Inventariar todos os pontos de entrada HTTP; aceite: 100% dos `index.ts` classificados. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 002 | Conciliar contagem real e catálogos; aceite: documentação registra 102 funções ou a contagem vigente. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 003 | Mapear helper e schema de cada endpoint; aceite: nenhuma célula sem classificação. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 004 | Catalogar status e shape atual por falha; aceite: 400/401/403/422/500 diferenciados. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 005 | Definir erro canônico `{ code, message, fields }`; aceite: helper compartilhado implementado. P0. | Marcada no plano; fundação presente nas suítes de CI. Não certifica rollout de todos os consumidores. |
| 006 | Normalizar issues Zod em `path/message/code`; aceite: testes de raiz e campos passam. P0. | Marcada no plano; fundação presente nas suítes de CI. Não certifica rollout de todos os consumidores. |
| 007 | Fazer os dois validadores compartilhados emitirem o mesmo 422; aceite: ambos delegam ao helper canônico. P0. | Marcada no plano; fundação presente nas suítes de CI. Não certifica rollout de todos os consumidores. |
| 008 | Fechar primeira onda nos seis ingressos externos; aceite: Asaas, Bitrix, Bling, WhatsApp e n8n cobertos. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 009 | Garantir autenticação antes da validação; aceite: credencial inválida nunca revela schema. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 010 | Cobrir ausente, tipo incorreto e vazio; aceite: matriz automatizada verde. P0. | Marcada no plano; fundação presente nas suítes de CI. Não certifica rollout de todos os consumidores. |
| 011 | Converter schema-only em teste HTTP real; aceite: status e body verificados por webhook. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 012 | Atualizar contratos de Conciliacao e NFe para 422; aceite: asserts legados removidos. P1. | Marcada no plano; fundação presente nas suítes de CI. Não certifica rollout de todos os consumidores. |
| 013 | Separar 422 de schema e regras de negócio; aceite: taxonomia documentada. P1. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 014 | Definir `x-contract-version`, default v1 e suporte v2; aceite: helper publicado. P1. | Marcada no plano; fundação presente nas suítes de CI. Não certifica rollout de todos os consumidores. |
| 015 | Testar v1, v2 e versão não suportada; aceite: retrocompatibilidade automatizada. P1. | Marcada no plano; fundação presente nas suítes de CI. Não certifica rollout de todos os consumidores. |
| 016 | Corrigir baseline do healthcheck; aceite: auth/status refletem runtime. P1. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 017 | Cruzar contrato com prova de origem; aceite: nenhum webhook público sem credencial. P1. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 018 | Definir “sem endpoint sem validação”; aceite: gate inspeciona todo consumidor de body. P1. | Marcada no plano; fundação presente nas suítes de CI. Não certifica rollout de todos os consumidores. |
| 019 | Integrar gates de contrato ao workflow Deno; aceite: CI executa novos testes. P1. | Marcada no plano; fundação presente nas suítes de CI. Não certifica rollout de todos os consumidores. |
| 020 | Publicar conformidade endpoint a endpoint; aceite: percentual calculado sobre inventário real. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 021 | Classificar as 102 funções por exposição; aceite: webhook/JWT/cron/utilitária marcados. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 022 | Mapear body, texto, query e headers; aceite: todas as entradas registradas. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 023 | Consolidar uso de `validatePayload`, `validateContract` e inline; aceite: matriz única. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 024 | Remover imports Zod divergentes; aceite: apenas `_shared/zod.ts` fornece Zod. P1. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 025 | Eliminar consumers de body sem validação detectável; aceite: gate verde. P0. | Marcada no plano; fundação presente nas suítes de CI. Não certifica rollout de todos os consumidores. |
| 026 | Mapear autenticação de cada webhook; aceite: evidência por arquivo/linha. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 027 | Auditar todo uso de service role; aceite: guard obrigatório ou exceção justificada. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 028 | Padronizar respostas manuais de `safeParse`; aceite: todas usam helper 422. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 029 | Separar falha sintática JSON (400) de schema (422); aceite: testes para ambas. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 030 | Validar body, query e headers relevantes; aceite: checklist completo por endpoint. P1. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 031 | Catalogar testes existentes; aceite: fluxo feliz/auth/contrato identificados. P1. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 032 | Criar backlog dos endpoints sem teste local; aceite: owner e prioridade definidos. P1. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 033 | Completar matriz válido/ausente/tipo/vazio; aceite: quatro cenários por contrato. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 034 | Migrar autenticação manual para guards comuns; aceite: exceções documentadas. P1. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 035 | Contratar query/header em endpoints sem body; aceite: entradas administrativas validadas. P1. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 036 | Selecionar webhooks candidatos a v1/v2; aceite: quatro webhooks principais integrados. P1. | Marcada no plano; fundação presente nas suítes de CI. Não certifica rollout de todos os consumidores. |
| 037 | Definir diferença v2 por identificador de evento obrigatório; aceite: schemas separados. P1. | Marcada no plano; fundação presente nas suítes de CI. Não certifica rollout de todos os consumidores. |
| 038 | Migrar schemas em ondas por risco; aceite: nenhuma regressão de consumidores. P1. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 039 | Executar lotes webhook → service role → negócio; aceite: gates verdes por lote. P1. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 040 | Fechar matriz schema/422/teste/versão; aceite: 100% das funções classificadas. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 041 | Remover `SkipLinks` duplicado; aceite: um conjunto no tab order. P1. | Aberta no documento; inspeção parcial de navegação/prefetch. Sem homologação integral de UI/a11y. |
| 042 | Corrigir alvo `#main-nav`; aceite: destino existe e recebe foco. P1. | Aberta no documento; inspeção parcial de navegação/prefetch. Sem homologação integral de UI/a11y. |
| 043 | Adicionar landmark navegacional; aceite: axe reconhece nome e região. P1. | Aberta no documento; inspeção parcial de navegação/prefetch. Sem homologação integral de UI/a11y. |
| 044 | Rotular recolhimento da sidebar; aceite: nome muda com estado. P1. | Aberta no documento; inspeção parcial de navegação/prefetch. Sem homologação integral de UI/a11y. |
| 045 | Rotular idioma, tema e notificações; aceite: nomes acessíveis nos triggers. P1. | Aberta no documento; inspeção parcial de navegação/prefetch. Sem homologação integral de UI/a11y. |
| 046 | Tornar drawer mobile diálogo modal; aceite: role, título e Escape funcionam. P1. | Aberta no documento; inspeção parcial de navegação/prefetch. Sem homologação integral de UI/a11y. |
| 047 | Implementar focus trap/restauração; aceite: foco não escapa e retorna ao gatilho. P1. | Aberta no documento; inspeção parcial de navegação/prefetch. Sem homologação integral de UI/a11y. |
| 048 | Rotular botão “Fechar menu”; aceite: leitor de tela anuncia ação. P1. | Aberta no documento; inspeção parcial de navegação/prefetch. Sem homologação integral de UI/a11y. |
| 049 | Rotular download/abrir no portal; aceite: ação inclui contexto do documento. P1. | Aberta no documento; inspeção parcial de navegação/prefetch. Sem homologação integral de UI/a11y. |
| 050 | Testar shell real com axe; aceite: layout/header/sidebar/drawer cobertos. P1. | Aberta no documento; inspeção parcial de navegação/prefetch. Sem homologação integral de UI/a11y. |
| 051 | Corrigir marca/domínio/social cards; aceite: remover PromoBrindes e Lovable. P1. | Aberta no documento; inspeção parcial de navegação/prefetch. Sem homologação integral de UI/a11y. |
| 052 | Criar título por rota; aceite: página + marca em todas as rotas principais. P1. | Aberta no documento; inspeção parcial de navegação/prefetch. Sem homologação integral de UI/a11y. |
| 053 | Definir description/canonical públicos; aceite: Auth, Status, Portal e convites cobertos. P2. | Aberta no documento; inspeção parcial de navegação/prefetch. Sem homologação integral de UI/a11y. |
| 054 | Corrigir prefetch sem `queryFn`; aceite: cache aquecido ou recurso removido. P1. | Aberta no documento; inspeção parcial de navegação/prefetch. Sem homologação integral de UI/a11y. |
| 055 | Instrumentar prefetch; aceite: teste/telemetria comprova execução útil. P2. | Aberta no documento; inspeção parcial de navegação/prefetch. Sem homologação integral de UI/a11y. |
| 056 | Estabilizar canais realtime; aceite: não recriados em cada navegação. P2. | Aberta no documento; inspeção parcial de navegação/prefetch. Sem homologação integral de UI/a11y. |
| 057 | Elevar listeners globais ao shell; aceite: uma montagem por sessão. P2. | Aberta no documento; inspeção parcial de navegação/prefetch. Sem homologação integral de UI/a11y. |
| 058 | Corrigir `/centro-custos` no breadcrumb; aceite: rota e trilha coincidem. P2. | Aberta no documento; inspeção parcial de navegação/prefetch. Sem homologação integral de UI/a11y. |
| 059 | Trocar `window.location.href` por router; aceite: navegação sem reload. P2. | Aberta no documento; inspeção parcial de navegação/prefetch. Sem homologação integral de UI/a11y. |
| 060 | Validar shell em viewports móveis; aceite: sem overlays ou conteúdo sobrepostos. P2. | Aberta no documento; inspeção parcial de navegação/prefetch. Sem homologação integral de UI/a11y. |
| 061 | Inventariar endpoints públicos e `verify_jwt=false`; aceite: risco e credencial registrados. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 062 | Unificar autenticação de origem; aceite: helper comum em todos os webhooks. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 063 | Proteger Bling com HMAC/token; aceite: chamada sem credencial rejeitada. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 064 | Aplicar segredo fail-closed e comparação constante; aceite: ausência nunca libera tráfego. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 065 | Implementar timestamp/nonce/janela anti-replay; aceite: mensagens antigas/repetidas falham. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 066 | Deduplicar por chave canônica composta; aceite: duplicatas concorrentes não têm efeito. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 067 | Generalizar claim/success/failure/DLQ; aceite: todos os provedores rastreáveis. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 068 | Implementar envelope 422 único; aceite: testes do helper passam. P0. | Marcada no plano; fundação presente nas suítes de CI. Não certifica rollout de todos os consumidores. |
| 069 | Formalizar taxonomia HTTP; aceite: matriz e testes por classe de erro. P1. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 070 | Versionar contratos por header; aceite: v1/v2 detectáveis. P0. | Marcada no plano; fundação presente nas suítes de CI. Não certifica rollout de todos os consumidores. |
| 071 | Congelar v1 e criar schemas v2; aceite: exports distintos por webhook. P0. | Marcada no plano; fundação presente nas suítes de CI. Não certifica rollout de todos os consumidores. |
| 072 | Provar coexistência v1/v2; aceite: suíte de compatibilidade verde. P0. | Marcada no plano; fundação presente nas suítes de CI. Não certifica rollout de todos os consumidores. |
| 073 | Definir sunset com data e telemetria; aceite: ciclo de vida publicado. P1. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 074 | Incluir arrays vazios e campos extras; aceite: cinco categorias negativas por schema. P0. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 075 | Logar correlation, auth e versão; aceite: agregação sem parsing de texto. P1. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 076 | Reduzir enumeração e detalhes sensíveis; aceite: testes de respostas indistinguíveis. P1. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 077 | Endurecer replay administrativo; aceite: RBAC, escopo e trilha de auditoria. P1. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 078 | Cobrir todas as origens no retry worker; aceite: nenhum source ativo sem handler. P1. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 079 | Bloquear endpoint com body sem validação no CI; aceite: teste de cobertura falha em regressão. P0. | Marcada no plano; fundação presente nas suítes de CI. Não certifica rollout de todos os consumidores. |
| 080 | Publicar matriz auth/replay/idempotência/DLQ/schema/versão; aceite: sem campos indefinidos. P1. | Aberta no documento; inventário completo de nomes não substitui contrato/auth/replay de cada handler. |
| 081 | Descobrir e executar todos os testes Deno no CI; aceite: nenhum teste existente omitido. P0. | Aberta no documento; CI parcial,25/48 arquivos Deno explícitos e DB gates inconclusivos. |
| 082 | Versionar manifesto endpoint/schema/teste/auth; aceite: nova função sem entrada falha. P0. | Aberta no documento; CI parcial,25/48 arquivos Deno explícitos e DB gates inconclusivos. |
| 083 | Exigir válido, JSON inválido, ausente, tipo e vazio; aceite: cinco cenários por endpoint. P0. | Aberta no documento; CI parcial,25/48 arquivos Deno explícitos e DB gates inconclusivos. |
| 084 | Criar helper único de asserção/envelope; aceite: testes independem de mensagens locais. P0. | Marcada no plano; fundação presente nas suítes de CI. Não certifica rollout de todos os consumidores. |
| 085 | Cobrir cada `safeParse` inline no handler; aceite: sucesso e falha HTTP reais. P0. | Aberta no documento; CI parcial,25/48 arquivos Deno explícitos e DB gates inconclusivos. |
| 086 | Separar gate sintático e comportamental; aceite: dois checks obrigatórios. P0. | Aberta no documento; CI parcial,25/48 arquivos Deno explícitos e DB gates inconclusivos. |
| 087 | Publicar artefatos JSON de contrato; aceite: endpoint/status/body resumidos por cenário. P1. | Aberta no documento; CI parcial,25/48 arquivos Deno explícitos e DB gates inconclusivos. |
| 088 | Testar auth/schema/idempotência dos quatro webhooks; aceite: três classes por webhook. P1. | Aberta no documento; CI parcial,25/48 arquivos Deno explícitos e DB gates inconclusivos. |
| 089 | Cobrir proxies críticos; aceite: contrato e encaminhamento mockado verificados. P1. | Aberta no documento; CI parcial,25/48 arquivos Deno explícitos e DB gates inconclusivos. |
| 090 | Cobrir funções cron e defaults; aceite: default válido e shape inválido por job. P1. | Aberta no documento; CI parcial,25/48 arquivos Deno explícitos e DB gates inconclusivos. |
| 091 | Logar endpoint/motivo/campos/request-id; aceite: falhas agregáveis. P1. | Aberta no documento; CI parcial,25/48 arquivos Deno explícitos e DB gates inconclusivos. |
| 092 | Medir success/invalid-json/schema/business-rule; aceite: dashboard consultável. P1. | Aberta no documento; CI parcial,25/48 arquivos Deno explícitos e DB gates inconclusivos. |
| 093 | Criar smoke sem efeito colateral em staging/produção; aceite: 4xx estruturado pós-deploy. P1. | Aberta no documento; CI parcial,25/48 arquivos Deno explícitos e DB gates inconclusivos. |
| 094 | Adicionar fixtures/testes v1/v2; aceite: coexistência automatizada. P1. | Marcada no plano; fundação presente nas suítes de CI. Não certifica rollout de todos os consumidores. |
| 095 | Bloquear rollout sem contrato/observabilidade; aceite: gate de deploy obrigatório. P1. | Aberta no documento; CI parcial,25/48 arquivos Deno explícitos e DB gates inconclusivos. |
| 096 | Corrigir docs aspiracionais e referência “Freight Quest”; aceite: docs refletem runtime. P2. | Aberta no documento; CI parcial,25/48 arquivos Deno explícitos e DB gates inconclusivos. |
| 097 | Publicar runbook de falha contratual; aceite: auth/schema/negócio diagnosticáveis. P2. | Aberta no documento; CI parcial,25/48 arquivos Deno explícitos e DB gates inconclusivos. |
| 098 | Publicar inventário Vitest/Deno/Playwright; aceite: artifact por pipeline. P2. | Aberta no documento; CI parcial,25/48 arquivos Deno explícitos e DB gates inconclusivos. |
| 099 | Fazer rollout progressivo em staging; aceite: smoke, observação e promoção documentados. P2. | Aberta no documento; CI parcial,25/48 arquivos Deno explícitos e DB gates inconclusivos. |
| 100 | Documentar cada contrato público; aceite: versão, auth, request e respostas canônicas publicados. P2. | Aberta no documento; CI parcial,25/48 arquivos Deno explícitos e DB gates inconclusivos. |

## 7. Sequência de fechamento recomendada — sem aplicar nesta revisão

1. Confirmar a visibilidade pública divergente e tratar exposição/credenciais com o proprietário; conter falsa confirmação de boleto/PER-DCOMP e passkey, definindo escopo real versus sandbox com produto.
2. Reconciliar schema e ciclo de vida de api_keys antes de publicar o handler.
3. Obter catálogo read-only completo e tratar PR79/RBAC expiração por consumidor, preservando descoberta SSO legítima.
4. Classificar os57 bundles divergentes e três diferenças de gateway em intencionais, upgrades, regressões e deploy pendente; nunca sobrescrever em massa.
5. Construir genealogia das migrations; mapear SQL efetivo e decisões de equivalência antes de replay.
6. Completar gates: lint strict, typecheck de testes, Deno completo ou exclusões justificadas, DATABASE_URL de ambiente seguro e cobertura calibrada.
7. Executar falhas/concorrência/idempotência em staging com duas empresas e perfis distintos; sem carga de produção implícita.
8. Promover por SHA aprovado, smoke de contrato, canário/rollback, rastreio e janela real de observação.
9. Atualizar índice e planos com links commit/teste/deploy/operação por etapa, sem apagar a evidência histórica.
10. Solicitar aceite final somente com todos os P0/P1 fechados ou decisão explícita de escopo que remova a promessa afetada.

## 8. Entrega e pendências de acesso

- Este relatório, inventário de paridade e reprodutor estão somente no worktree isolado. Não foram publicados ou mesclados nesta solicitação de revisão.
- [evidencias.json](auditoria-20260912/evidencias.json): inventário do schema public sem linhas de negócio; resultados da comparação de103 bundles, ledger, colunas e advisors. Não contém código-fonte remoto ou credenciais. O nome do schema não significa autorização de publicação deste inventário.
- [PARIDADE_EDGE.md](auditoria-20260912/PARIDADE_EDGE.md): checklist de104 funções, versão remota, configuração e diferenças por arquivo.
- [reproduzir-lacunas.cjs](auditoria-20260912/reproduzir-lacunas.cjs): reprodutor diagnóstico offline; seu resultado confirma defeitos, não aprova produção.
- A comparação semântica integral dos dois bancos, os testes autenticados de todos os fluxos e o aceite produtivo permanecem pendentes. Permissões SQL read-only insuficientes são um limite real, não motivo para chamar um catálogo não consultado de vazio.
- Nenhuma tabela vazia, objeto sem consumidor literal, arquivo de outro agente ou branch aberta foi descartado.

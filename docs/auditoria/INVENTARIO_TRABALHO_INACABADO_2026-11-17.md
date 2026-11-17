# Inventário de trabalho inacabado — 2026-11-17

Varredura automatizada do repositório em 6 frentes (configuração ignorada, código órfão,
divergência código×banco, fluxo pela metade, falha engolida, simulação em produção), com
**verificação adversarial**: cada achado passou por um agente cético independente, instruído
a refutá-lo e a confirmar apenas com evidência própria (leitura do código + `SELECT` no banco
de produção `bwwbeyolnnzppeuhgkcd`).

**17 achados distintos, 18 confirmados, 0 refutados.** 24 agentes, 710 chamadas de ferramenta.

1 achado(s) foram relatados por mais de uma frente e estão consolidados abaixo
(a contagem de "distintos" já desconta a repetição).

As evidências estão transcritas na íntegra, sem truncar: este arquivo é para ser conferido,
não só lido. Nenhum destes itens foi corrigido por esta PR — ela só registra o inventário.
Os corrigidos nas PRs #410–#421 não aparecem aqui.

## Índice por gravidade

| #   | Gravidade | Esforço | Achado                                                                                                                                                 | Onde                                                                    |
| --- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| 1   | alta      | medio   | Motor Anti-Duplicidade: regras salvas e versionadas que nenhum motor lê (e sem motor em produção)                                                      | `src/components/configuracoes/RegrasDuplicidadeTab.tsx:85`              |
| 2   | alta      | pequeno | Aba padrão de Configurações mostra uma régua de cobrança fictícia; a régua real está desligada no banco + Aba padrão de /configuracoes é uma régua de… | `src/pages/Configuracoes.tsx:96`                                        |
| 3   | alta      | grande  | "Salvar Configurações" do Sistema só emite toast — nenhuma preferência é persistida, e o gerador de alertas usa 7 dias fixos                           | `src/pages/Configuracoes.tsx:104`                                       |
| 4   | alta      | pequeno | Cobrança Asaas é criada no provedor e nunca gravada no sistema: insert em asaas*payments falha sempre (uuid x id "cus*") e o erro só é logado          | `supabase/functions/asaas-proxy/index.ts:453`                           |
| 5   | alta      | medio   | Baixa automática por extrato marca o título como pago mas o lançamento bancário nunca é gravado (conta_bancaria_id vazio) e falhas no update são…      | `src/components/contas-receber/BaixaAutomaticaDialog.tsx:154`           |
| 6   | alta      | medio   | Quorum de aprovação é salvo mas nunca exigido: 1 clique libera pagamento configurado para 2–5 aprovadores                                              | `src/components/aprovacoes/ConfiguracaoAprovacaoCard.tsx:173`           |
| 7   | alta      | pequeno | Painel de obrigações acessórias marca tudo como atrasado e nunca sai de 0% concluído: status vem só do calendário e os botões não têm handler          | `src/components/reforma-tributaria/ObrigacoesAcessorias.tsx:66`         |
| 8   | alta      | pequeno | Relatórios tributários agendados nunca são enviados: edge function sem nenhum invocador e sem job no pg_cron                                           | `supabase/functions/enviar-relatorios-tributarios-agendados/index.ts:3` |
| 9   | alta      | medio   | Alertas tributários nunca são gerados e o painel de Configurações afirma que o job 'roda diariamente às 06:00'                                         | `src/components/admin/CronJobsStatus.tsx:155`                           |
| 10  | alta      | pequeno | SPED EFD-Contribuições nunca gera: coluna empresas.inscricao_municipal não existe em produção                                                          | `supabase/functions/exportar-sped-contribuicoes/index.ts:108`           |
| 11  | alta      | pequeno | DRE Tributária sempre diz 'sem faturamento no período' porque faturamento_mensal.total_tributos não existe                                             | `supabase/functions/gerar-dre-tributaria/index.ts:61`                   |
| 12  | alta      | pequeno | Consulta de CNPJ (onboarding tributário) retorna 503 em 100% das chamadas: RPC cnpja_check_rate_limit não existe em produção                           | `supabase/functions/cnpja-lookup/index.ts:179`                          |
| 13  | alta      | pequeno | Open Finance devolve saldos e extratos inventados como sucesso e grava as transações falsas em transacoes_bancarias                                    | `supabase/functions/open-finance/index.ts:430`                          |
| 14  | alta      | pequeno | Log de eventos SEFAZ é semeado com 7 eventos falsos a cada carregamento da página, e o histórico e o analytics exibem protocolos e taxas inventados    | `src/lib/sefaz-event-logger.ts:238`                                     |
| 15  | alta      | medio   | Status da SEFAZ é decidido por Math.random, e a contingência automática pode trocar o modo de emissão fiscal com base nesse sorteio                    | `src/lib/sefaz-contingency/state.ts:111`                                |
| 16  | media     | pequeno | Conciliação automática do extrato conta e marca como conciliada antes de persistir: transação que falhou sai da fila de revisão e entra no relatório…  | `src/lib/conciliacao-page-helpers.ts:241`                               |
| 17  | media     | pequeno | Painel de SLO promete 'primeiro snapshot às 23:55' mas nada invoca calcular-slo-metrics-diario; tabela vazia em produção                               | `src/components/admin/SLOPanel.tsx:99`                                  |

> **Ressalva na correção proposta** (achado do Devin na PR #422): `calcular-slo-metrics-diario` tem `verify_jwt = true` em `supabase/config.toml:332`, então um job de `pg_cron` que envie apenas `x-cron-secret` é rejeitado pelo gateway antes de chegar ao guard interno. Ou o job manda `Authorization: Bearer <service_role>`, ou o bloco da função no `config.toml` passa a `verify_jwt = false` — e aí o guard interno é a única defesa, o que precisa ser decidido junto.

## 1. Motor Anti-Duplicidade: regras salvas e versionadas que nenhum motor lê (e sem motor em produção)

- **Gravidade:** alta · **Esforço estimado:** medio · **Frente:** config-ignorada
- **Onde:** `src/components/configuracoes/RegrasDuplicidadeTab.tsx:85`

**Cenário de falha**

O financeiro abre Configurações -> Anti-Duplicidade, marca apenas "Fornecedor / CNPJ" + "Valor Exato", liga Fuzzy Matching e põe Tolerância = 5 dias, clica "Salvar & Versionar" e recebe "Regras de duplicidade atualizadas e versionadas com sucesso!" + "Versão 2 ATIVA". Em seguida lança duas vezes a mesma NF do mesmo fornecedor com vencimentos em 10/03 e 13/03: nada é bloqueado, nada entra em bloqueios_duplicidade, nenhum alerta é criado. O lançamento idêntico (mesmo fornecedor, valor, documento e vencimento) também passa, porque não existe trigger de validação em contas_pagar em produção.

**Impacto no negócio**

Pagamento em duplicidade entra no contas a pagar e pode ser liquidado: perda financeira direta do valor duplicado por ocorrência. Pior, a tela afirma que o bloqueio está ativo e versionado, então ninguém confere manualmente — o controle de duplicidade existe só como texto na interface.

**Evidência confirmada pelo cético**

```text
1) Trecho existe e diz isso (li o arquivo inteiro, 299 linhas):
- /home/user/Promo_Finance_V2/src/components/configuracoes/RegrasDuplicidadeTab.tsx:85-93 — `supabase.from('configuracoes_duplicidade').insert({ empresa_id, campos_validacao: fields, fuzzy_matching: fuzzy, tolerancia_dias: tolerance, versao: (config?.versao || 0) + 1, ativo: true, criado_por })`.
- :99 — `toast.success('Regras de duplicidade atualizadas e versionadas com sucesso!')`.
- :162 — `Versão {config?.versao || 1} ATIVA`.
- :252-255 — "As alterações nestas regras são aplicadas instantaneamente a todos os novos lançamentos e edições."
- :231-235 — "Garantia de Idempotência / O sistema valida tokens de idempotência em todas as APIs críticas de pagamento 10/10."
- :200-206 e :212-224 — controles "Fuzzy Matching (IA)" e "Tolerância (Dias)".

2) Caminho alcançável em produção (CONFIRMADO):
- /home/user/Promo_Finance_V2/src/pages/Configuracoes.tsx:45 (import), :60 (tab 'duplicidade' na lista), :134-136 (TabsTrigger "Anti-Duplicidade"), :380-381 (`<TabsContent value="duplicidade"><RegrasDuplicidadeTab /></TabsContent>`).
- O Checkbox usado é input nativo com onChange (/home/user/Promo_Finance_V2/src/components/ui/checkbox.tsx:12-41), então `onChange={() => toggleField(id)}` (linha 178) funciona de fato — a UI é interativa, não inerte.
- RLS em produção permite a gravação para usuário comum da empresa: policy "Empresa-based access" (FOR ALL, with_check NULL -> USING vale como check) com `empresa_id IN (SELECT empresa_id FROM user_empresas WHERE user_id = auth.uid() AND ativo)` OR admin. Ou seja, o toast de sucesso é real.

3) O resultado errado acontece (CONFIRMADO no banco bwwbeyolnnzppeuhgkcd, só SELECT):
- Nenhuma função lê a tabela: `select proname, (pg_get_functiondef(oid) ilike '%configuracoes_duplicidade%') from pg_proc join pg_namespace ... where nspname='public' and (proname ilike '%duplicid%' or functiondef ilike '%configuracoes_duplicidade%')` -> 1 linha: `detectar_duplicidades_financeiras(p_empresa_id uuid, p_tabela text)` com le_config = **false**.
- Nenhuma trigger de duplicidade: `pg_trigger` (não internas) em contas_pagar/contas_receber + qualquer tgname ilike '%duplic%' -> só trg_anexos_sync_empresa e set_updated_at_*. Zero trigger de validação.
- `select count(*) from configuracoes_duplicidade` -> **0** (nenhuma regra foi sequer salva até hoje).
- Coluna idempotency_key em contas_pagar -> **0** em information_schema.columns; índices de contas_pagar (pg_indexes, 11 linhas) têm um único UNIQUE: `contas_pagar_pkey` em (id). Nada impede duas linhas idênticas.
- `bloqueios_duplicidade` tem 6 linhas, todas com created_at de jul/2026 e o mesmo sufixo de microssegundos (.196725) e motivos sintéticos ("Fornecedor em lista restritiva interna (Compliance)", "Pagamento já efetuado via boleto Itaú 7d atrás") -> são seed de demonstração, não bloqueios reais; nada foi gravado depois, coerente com a ausência de trigger.
- Nada protege adiante: `grep -rni "duplicid|idempotency" src/hooks/useContasPagar* src/components/contas-pagar` -> **zero** ocorrências. O formulário (src/components/contas-pagar/ContaPagarForm.tsx) e src/hooks/financial/useContasPagar.ts inserem em contas_pagar sem nenhuma checagem de duplicidade.
- Única lógica viva confirmada: detectar_duplicidades_financeiras, chamada apenas em /home/user/Promo_Finance_V2/supabase/functions/gerar-acoes-recomendadas/index.ts:115 (rpc), ou seja, sugestão posterior, não bloqueio.

4) Testes: nenhum. Busca por "RegrasDuplicidade" / "configuracoes_duplicidade" em arquivos *.test.ts(x) e *.e2e.ts (excluindo node_modules) -> zero arquivos. A tabela aparece em src/integrations/supabase/types.ts:4421 (gerado) e em migrations de RLS, nunca em teste.

CORREÇÃO AO ACHADO (a evidência alegada estava parcialmente errada, sem mudar a conclusão): o achado diz que o grep retorna SOMENTE o componente e que não existe motor porque `proname='validar_duplicidade_financeira'` não existe. O nome está errado. O motor EXISTE no repositório, com outro nome: /home/user/Promo_Finance_V2/supabase/migrations/20260508200327_cb379296-ba4d-4201-9f04-d175b2535749.sql:24-109 define `public.validar_duplicidade_avancada()`, que lê `configuracoes_duplicidade` (linha 50), monta SQL dinâmico a partir de campos_validacao, grava em bloqueios_duplicidade, cria alerta em alertas_tributarios e dá `RAISE EXCEPTION 'DUPLICIDADE_DETECTADA'`; as linhas 107-112 criam a trigger `trg_validar_duplicidade_pagar` em contas_pagar. O mesmo par aparece em 20260508200043_a00525d1-736f-4bbc-96fd-0d7171d610fe.sql. Nada disso está em produção (consultas acima). Portanto a conclusão do achado se sustenta e fica ainda mais clara: o motor foi escrito, versionado em migration, e nunca chegou ao banco — a UI continua prometendo que ele está ativo.

Dois detalhes do cenário alegado que NÃO consegui confirmar e que corrijo: (a) a função do arquivo, se aplicada, nunca suportaria "Tolerância = 5 dias" nem Fuzzy Matching — ela só trata fornecedor_id, valor, numero_documento, mes_vencimento e data_vencimento (exato); tolerancia_dias e fuzzy_matching não são lidos por nenhuma linha de código em nenhum lugar do repositório, logo esses dois controles da UI são puramente decorativos mesmo no desenho original; (b) a UI não tem histórico real de versões — o card "Histórico de Regras" (linhas 272-294) renderiza sempre uma única barra 100% com `v{config?.versao || 1} (Atual)`.
```

**Correção mínima (revisada na verificação)**

Duas partes, nesta ordem:

(1) Parar a mentira (pequeno, sem risco): em src/components/configuracoes/RegrasDuplicidadeTab.tsx remover/neutralizar as três afirmações falsas — bloco "Garantia de Idempotência" (linhas 228-237), o texto "aplicadas instantaneamente a todos os novos lançamentos e edições" (linhas 252-255) e o badge "Versão N ATIVA" (linhas 158-163, que mostra "Versão 1 ATIVA" mesmo com zero registros em configuracoes_duplicidade) — trocando por rótulo de configuração não aplicada; e ajustar o toast da linha 99 para não afirmar efeito em lançamentos.

(2) Ligar o motor (grande, DDL em caminho de dinheiro -> regra 6.6, exige o dono): nova migration que recria public.validar_duplicidade_avancada() (existe só no arquivo supabase/migrations/20260508200327_cb379296-ba4d-4201-9f04-d175b2535749.sql:24-109, nunca aplicada) e a trigger trg_validar_duplicidade_pagar BEFORE INSERT OR UPDATE em contas_pagar. Atenção: a função, como está no arquivo, referencia NEW.idempotency_key, coluna que NÃO existe em contas_pagar em produção (information_schema -> 0) — sem adicionar a coluna (ou remover o bloco 1 da função) a trigger derruba toda inserção de conta a pagar. Também monta SQL dinâmico por concatenação de valores (quote_literal/quote_nullable) a partir de campos_validacao gravados pela UI, o que precisa ser revisto antes de ir a produção. Fuzzy Matching e Tolerância (Dias) não têm nenhuma implementação em lugar algum — ou se implementa, ou se removem os dois controles da UI.

Sem (2), o botão "Salvar & Versionar" grava uma linha que nada consome.

## 2. Aba padrão de Configurações mostra uma régua de cobrança fictícia; a régua real está desligada no banco

> Relatado por 2 frentes independentes; as duas descrições estão abaixo.

### Frente 1: config-ignorada — Aba padrão de Configurações mostra uma régua de cobrança fictícia; a régua real está desligada no banco

- **Gravidade:** alta · **Esforço estimado:** pequeno · **Frente:** config-ignorada
- **Onde:** `src/pages/Configuracoes.tsx:96`

**Cenário de falha**

O dono entra em /configuracoes (cai na aba Régua), vê 5 etapas "Ativas" com dias e canais definidos e desliga a "2a Cobrança" para parar de incomodar um cliente grande; recebe "A régua de cobrança foi atualizada com sucesso". Ao recarregar a página a etapa volta a Ativa e no banco nada mudou. Em paralelo a régua real nunca disparou: auto_executar=false e dias_gatilho=[] fazem o executar-regua-cobranca sair sem selecionar regra (0 execuções registradas).

**Impacto no negócio**

A empresa acredita ter cobrança automática em 5 etapas rodando e não envia nenhuma cobrança — inadimplência envelhece sem régua, perda de recuperação de recebíveis. E toda decisão tomada nessa tela é tomada sobre dados inventados.

**Evidência confirmada pelo cético**

```text
(1) O TRECHO EXISTE E DIZ ISSO — confirmado, com uma correção de numeração:
- `src/pages/Configuracoes.tsx:75`: `const [etapas, setEtapas] = useState<EtapaConfig[]>(etapasIniciais);` (o achado disse linha 74 — está em 75).
- `src/pages/Configuracoes.tsx:96-102`:
  `const toggleEtapa = (id: string) => { setEtapas((prev) => prev.map((e) => (e.id === id ? { ...e, ativo: !e.ativo } : e))); toast({ title: 'Etapa atualizada', description: 'A régua de cobrança foi atualizada com sucesso.' }); };`
  Nenhuma chamada a supabase, mutation ou persistência.
- `src/pages/Configuracoes.tsx:80`: `const [tab, setTab] = useUrlTab('regua', CONFIG_TABS);` → 'regua' é o default (o achado disse 79).
- Prova de ausência de persistência: `grep -n "supabase|localStorage|useMutation|useQuery|useEffect" src/pages/Configuracoes.tsx` → ZERO ocorrências. A página inteira não toca o banco.
- `src/pages/Configuracoes.constants.ts:32-93`: `etapasIniciais` hardcoded, 6 etapas, exatamente como descrito (Lembrete Preventivo -3, Lembrete de Vencimento 0, 1ª Cobrança +5, 2ª Cobrança +15, Negociação +30, Aviso Jurídico +60). ids 1-5 com `ativo: true`, id 6 com `ativo: false` → 5 "Ativas" na timeline, como o achado alega.

(2) ALCANÇÁVEL EM PRODUÇÃO — confirmado em toda a cadeia:
- `src/routes/adminPages.ts:4`: `export const Configuracoes = lazy(() => import('../pages/Configuracoes'));`
- `src/routes/adminRoutes.tsx:38-47`: `<Route path="/configuracoes" element={<ProtectedRoute><MainLayout><Configuracoes /></MainLayout></ProtectedRoute>} />` — rota real, só exige login.
- `src/pages/Configuracoes.tsx:304-305`: `<TabsContent value="regua"><ReguaCobrancaTab etapas={etapas} onToggleEtapa={toggleEtapa} />` — o estado falso e o handler em memória são passados para o componente que realmente renderiza.
- `src/components/configuracoes/ReguaCobrancaTab.tsx:64-80` desenha a timeline só com `.filter((e) => e.ativo)`; `:85-128` lista as 6; `:124`: `<Switch checked={etapa.ativo} onCheckedChange={() => onToggleEtapa(etapa.id)} />`.
- `src/hooks/useUrlTab.ts:13`: sem `?tab=` na URL, `tab = defaultTab` → quem abre /configuracoes cai na aba Régua.

(3) O RESULTADO ERRADO ACONTECE; NADA PROTEGE ADIANTE — confirmado:
- Não existe nada a jusante: o handler termina no `setEtapas` + toast. Sem `useEffect` de sync, sem localStorage, sem mutation. Ao desmontar/recarregar, volta a `etapasIniciais` (id '4' = "2ª Cobrança", `ativo: true`).
- A UI não se apresenta como demo: `ReguaCobrancaTab.tsx:49-52` diz "Régua de Cobrança Automática" / "Configure as etapas e canais de comunicação para cobrança automática". Nenhum aviso de exemplo/preview.
- Agravante que eu encontrei: os outros controles da aba são totalmente mortos — `grep onClick` em `ReguaCobrancaTab.tsx` retorna NADA. O botão "Nova Etapa" (`:54-57`) e o "Edit" por etapa (`:121-123`) não têm handler nenhum.
- O editor real existe em OUTRA tela, confirmando que esta é casca: `src/pages/Cobrancas.tsx:34` importa `ReguaCobrancaConfig` e `:202-203` o renderiza; `src/hooks/useReguaCobranca.ts:20-40` (`useUpdateReguaCobranca`) faz `supabase.from('regua_cobranca').update(data).eq('id', id)` — este sim grava.
- ESTADO REAL EM PRODUÇÃO (SELECT no projeto bwwbeyolnnzppeuhgkcd, somente leitura): `select id,nome,etapa,ativo,auto_executar,dias_gatilho,canais,ordem from regua_cobranca` → 2 linhas, ambas nome="Régua Padrão", `ativo=true`, `auto_executar=false`, `dias_gatilho=[]`, `etapa=null`, `canais=["email","whatsapp"]`, mesma `empresa_id=610db558-...`. Contagens: `regras=2, elegiveis=0, execucoes=0` (elegiveis = `ativo and auto_executar`). Ou seja: a query do executor retorna ZERO regras e `execucoes_regua_cobranca` está vazia. Bate 100% com o alegado.
- O executor confere: `supabase/functions/executar-regua-cobranca/index.ts:42-47`: `.from('regua_cobranca').select('id,nome,descricao,dias_gatilho,canais,empresa_id,etapa,ordem').eq('ativo', true).eq('auto_executar', true).order('ordem')`.
- PIOR DO QUE O ACHADO DIZ: tentei refutar a parte "nunca disparou" supondo que a régua simplesmente não estivesse agendada. Está. `select jobid, schedule, jobname, active from cron.job where ... ilike '%regua%'` → jobid 2 `executar-regua-cobranca-diaria` schedule `0 12 * * *` active=true; jobid 24 `processar-regua-cobranca-diario` schedule `0 9 * * *` active=true. Logo o cron roda TODO DIA e cai num no-op, com 0 execuções registradas — não é uma feature "desligada de propósito", é maquinário ativo girando em falso enquanto a aba padrão afirma 5 etapas Ativas.

(4) TESTE COBRINDO — NÃO EXISTE:
`grep -rln "Configuracoes|ReguaCobrancaTab|etapasIniciais|toggleEtapa"` em `*.test.*`, `*.spec.*`, `*.e2e.*` (fora de node_modules) → ZERO arquivos. Nenhum teste unitário, de componente ou e2e toca esse fluxo. Nada no CI pegaria a regressão.

JULGAMENTO PELA RÉGUA DO PRÓPRIO PROJETO (`docs/agentes/definicao-de-pronto.md`): "Pronta = integrada de ponta a ponta: ... serviço/hook chamado ... botão com handler ... Sem corpo vazio, mock, hardcode, TODO/WIP" e "Fluxo incompleto (cria sem editar/excluir, lê sem salvar) = pela metade, não entregue como pronto". Esta aba é hardcode puro, com 2 de 3 botões sem handler e o terceiro gravando em memória e mentindo no toast. Falha explicitamente os dois critérios.
```

**Correção mínima (revisada na verificação)**

Duas opções, ambas sem reescrita:

(A) MÍNIMA DE VERDADE (recomendada, ~15 linhas): apagar o estado falso e a aba falsa de Configurações e apontar para o editor real.

- `src/pages/Configuracoes.tsx`: remover `etapas`/`setEtapas` (linha 75), `toggleEtapa` (96-102), o import de `etapasIniciais` (51) e o import de `ReguaCobrancaTab` (42).
- Substituir `TabsContent value="regua"` (304-305) por um card com link para `/cobrancas?tab=regua` (editor real) OU trocar o default de `useUrlTab('regua', ...)` (linha 80) para `'templates'` e remover a aba.
- Consequência: o dono deixa de receber "atualizada com sucesso" por uma mudança que não existe.

(B) Se quiser manter a régua dentro de Configurações: trocar o estado local por `useReguaCobranca()` + `useUpdateReguaCobranca()` (`src/hooks/useReguaCobranca.ts:6` e `:20`, já funcionando em `ReguaCobrancaConfig`), passando as linhas reais para `ReguaCobrancaTab` e ligando o `Switch` (`ReguaCobrancaTab.tsx:124`) ao `mutate({ id, ativo })`. Exige também mapear `dias_gatilho[]`/`canais[]` do banco para o shape `EtapaConfig` e tratar loading/erro/vazio. É a mesma tela duas vezes — por isso (A) é melhor.

FORA DO ESCOPO DO BUG DE UI (decisão de negócio do dono, não patch): as 2 linhas em `regua_cobranca` têm `auto_executar=false`, `dias_gatilho=[]` e `etapa=null`, e há 2 crons ativos (`executar-regua-cobranca-diaria` 0 12 \* \* _, `processar-regua-cobranca-diario` 0 9 _ \* \*) disparando todo dia para zero regra elegível. Também há duplicata: 2 linhas "Régua Padrão" idênticas na mesma `empresa_id`. Nenhuma correção de código conserta isso — precisa o dono definir os dias/canais e ligar `auto_executar`.

Observação para o orquestrador: as linhas citadas no achado estão deslocadas em 1 (o `useState` é 75, não 74; `useUrlTab` é 80, não 79). O `toggleEtapa` (96) e o toast (100) estão corretos.

### Frente 2: fluxo-incompleto — Aba padrão de /configuracoes é uma régua de cobrança falsa: toggles e "Salvar Template" não gravam nada e o toast mente

- **Gravidade:** alta · **Esforço estimado:** pequeno · **Frente:** fluxo-incompleto
- **Onde:** `src/pages/Configuracoes.tsx:96`

**Cenário de falha**

O dono abre /configuracoes (cai direto na aba "Régua de Cobrança Automática"), vê 4 etapas e desliga o Switch de "2ª Cobrança" para parar de cobrar um cliente grande em renegociação. Recebe "Etapa atualizada — A régua de cobrança foi atualizada com sucesso." Ao recarregar a página a etapa volta ligada (era state local) e, mais grave, a régua real nunca foi tocada: as linhas de regua_cobranca/templates_cobranca em produção seguem intactas. Mesmo roteiro na aba "Templates": ele reescreve o texto da cobrança, clica "Salvar Template" e o botão não faz nada — nem erro, nem toast; o texto digitado some ao fechar o diálogo, e o template real ("Aviso negativação: Sem retorno em 15 dias, seu nome será incluído no SPC/Serasa") continua sendo o que o sistema usa.

**Impacto no negócio**

O dono acredita ter desligado/reescrito a cobrança automática de um cliente e não desligou nada — risco de constrangimento comercial e de ameaça de negativação enviada a cliente já renegociado, exatamente o cenário que ele tentou evitar. Além disso a tela apresenta uma régua de 4 etapas que não existe no banco, então a leitura que o dono faz do próprio processo de cobrança é ficção (a régua real está com `auto_executar = false` e `dias_gatilho = []`, isto é, sem gatilho configurado) e as duas telas (/configuracoes e /cobrancas) mostram verdades diferentes sobre o mesmo processo.

**Evidência confirmada pelo cético**

```text
1) MOCK E TOAST MENTIROSO — src/pages/Configuracoes.tsx:74-80: `const [etapas, setEtapas] = useState<EtapaConfig[]>(etapasIniciais)` / `const [templates] = useState<Template[]>(templatesIniciais)` / `const [selectedTemplate] = useState<Template | null>(null)` (sem setter) / `const [tab, setTab] = useUrlTab('regua', CONFIG_TABS)`. Configuracoes.tsx:96-102: `const toggleEtapa = (id: string) => { setEtapas((prev) => prev.map((e) => (e.id === id ? { ...e, ativo: !e.ativo } : e))); toast({ title: 'Etapa atualizada', description: 'A régua de cobrança foi atualizada com sucesso.' }); };` — nenhuma chamada a supabase/mutation.
2) ZERO PERSISTÊNCIA — `grep -n "supabase\|localStorage" src/pages/Configuracoes.tsx src/components/configuracoes/ReguaCobrancaTab.tsx src/components/configuracoes/TemplatesTab.tsx src/pages/Configuracoes.constants.ts` → nenhuma linha.
3) ABA É A PADRÃO — src/hooks/useUrlTab.ts:13: `const tab = fromUrl !== null && validTabs.includes(fromUrl) ? fromUrl : defaultTab;` → abrir /configuracoes sem `?tab=` cai em 'regua'. Renderizada sem guarda em Configuracoes.tsx:304-306 (`<ReguaCobrancaTab etapas={etapas} onToggleEtapa={toggleEtapa} />`) e :309-316 (`<TemplatesTab .../>`).
4) ROTA ALCANÇÁVEL EM PRODUÇÃO — src/routes/adminRoutes.tsx:38-47 `<Route path="/configuracoes" element={<ProtectedRoute><MainLayout><Configuracoes /></MainLayout></ProtectedRoute>} />`; src/routes/adminPages.ts:4 `export const Configuracoes = lazy(() => import('../pages/Configuracoes'));`.
5) BOTÕES SEM HANDLER — src/components/configuracoes/ReguaCobrancaTab.tsx:54-57 `<Button><Plus .../>Nova Etapa</Button>`; :121-123 `<Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>`; único handler real é :124 `<Switch checked={etapa.ativo} onCheckedChange={() => onToggleEtapa(etapa.id)} />`.
6) DIÁLOGO DE TEMPLATE INERTE — src/components/configuracoes/TemplatesTab.tsx:90 `<Input placeholder="Ex: Lembrete de Vencimento" />`; :108 `<Input placeholder="Assunto do e-mail" />`; :112-115 `<Textarea placeholder="Digite o conteúdo da mensagem..." className="min-h-[200px] font-mono text-sm" />` (sem value/onChange); :138 `<Button className="w-full">Salvar Template</Button>` (sem onClick/onSubmit, fora de <form>); :178/:181/:184 Copy/Edit/Trash sem onClick; :83 `{selectedTemplate ? 'Editar Template' : 'Novo Template'}` nunca vira "Editar" porque selectedTemplate é fixo em null.
7) DADOS HARDCODED — src/pages/Configuracoes.constants.ts:32-87 `etapasIniciais` com 6 itens (Lembrete Preventivo -3, Lembrete de Vencimento 0, 1ª Cobrança +5, 2ª Cobrança +15, Negociação +30, Aviso Jurídico +60/ativo:false); :95-122 `templatesIniciais` com 3 itens (Lembrete Preventivo/email, Vencimento Hoje/whatsapp, 1ª Cobrança/email).
8) BANCO REAL (produção bwwbeyolnnzppeuhgkcd, SELECT) — `select nome, etapa, dias_gatilho, canais, ativo, auto_executar from regua_cobranca` → 2 linhas: {"nome":"Régua Padrão","etapa":null,"dias_gatilho":[],"canais":["email","whatsapp"],"ativo":true,"auto_executar":false} (x2). `select nome, canal, etapa, ativo from templates_cobranca` → 6 linhas: "Aviso negativação"/email/etapa 3, "Cobrança firme"/whatsapp/etapa 2, "Lembrete amigável"/email/etapa 1 (cada uma duplicada). Nenhum nome coincide com as constantes da tela.
9) UI QUE REALMENTE GRAVA ESTÁ EM OUTRA PÁGINA — src/components/cobranca/ReguaCobrancaConfig.tsx:20-25 importa `useReguaCobranca, useUpdateReguaCobranca, useTemplatesCobranca, useUpdateTemplate`; :42-46 os usa; :173 `updateTemplate.mutate({ id: template.id, ativo: checked })`; :182 `updateTemplate.mutate({ id: template.id, corpo: editCorpo })`. src/hooks/useReguaCobranca.ts:30 `await supabase.from('regua_cobranca').update(data).eq('id', id)` e :66 idem para templates_cobranca. Montada em src/pages/Cobrancas.tsx:202-203 `<TabsContent value="regua"><ReguaCobrancaConfig /></TabsContent>`.
10) CONSUMIDOR REAL DA RÉGUA — supabase/functions/executar-regua-cobranca/index.ts:43-46 `.from('regua_cobranca').select('id,nome,...').eq('ativo', true).eq('auto_executar', true)` → com auto_executar=false em produção, nada dispara hoje (daí a correção do cenário).
11) SEM TESTE — grep por `Configuracoes'|ReguaCobrancaTab|TemplatesTab|toggleEtapa|etapasIniciais|templatesIniciais` em *.test.ts(x)/*.spec.ts/*.e2e.ts: nenhum arquivo. e2e/regua-cobranca.e2e.ts:18-27 testa apenas que /cobrancas não redireciona para /auth e exibe um heading.
```

**Correção mínima (revisada na verificação)**

Trocar as duas abas-fantasma pelo componente que já grava, em vez de reimplementar: em src/pages/Configuracoes.tsx:304-316, substituir `<ReguaCobrancaTab .../>` e `<TemplatesTab .../>` por `<ReguaCobrancaConfig />` (src/components/cobranca/ReguaCobrancaConfig.tsx já cobre régua E templates, ambos com mutation real: :139-246 traz as abas por etapa com updateTemplate). Com isso caem: o state mockado e o toggleEtapa mentiroso (Configuracoes.tsx:75-78, :96-102), as constantes etapasIniciais/templatesIniciais (Configuracoes.constants.ts:32-122) e os dois componentes mockados (ReguaCobrancaTab.tsx, TemplatesTab.tsx). Remover 'templates' de CONFIG_TABS (Configuracoes.tsx:57-72) e o TabsTrigger correspondente (:130-133), mantendo 'regua' como default do useUrlTab. Decisão de negócio que fica pendente e NÃO é código: as 2 linhas "Régua Padrão" em produção estão com dias_gatilho=[] e auto_executar=false — depois de ligar a tela, o dono precisa definir os gatilhos, senão a régua continua inerte (agora de forma visível e honesta).

## 3. "Salvar Configurações" do Sistema só emite toast — nenhuma preferência é persistida, e o gerador de alertas usa 7 dias fixos

- **Gravidade:** alta · **Esforço estimado:** grande · **Frente:** config-ignorada
- **Onde:** `src/pages/Configuracoes.tsx:104`

**Cenário de falha**

O usuário vai em Configurações -> Sistema, desliga "Backup Automático", troca o fuso para America/Manaus, ajusta o alerta de vencimento para 7 dias e clica "Salvar Configurações": aparece "Preferências salvas - suas configurações foram atualizadas com sucesso". Ao recarregar (F5) tudo volta ao padrão (backup ligado, Brasília, 3 dias). O ajuste de antecedência nunca chegaria ao backend de todo modo: a RPC alerta com 7 dias fixos para todas as empresas. Clicar "Tema Escuro" não escurece a tela.

**Impacto no negócio**

A tela de preferências do sistema é teatro: o usuário recebe confirmação de salvamento e nada é salvo. Quem reduz a antecedência do alerta para 1 dia continua recebendo alertas de 7 dias; backup e regionalização não existem no backend. Erosão direta de confiança e tempo perdido reconfigurando o que nunca persiste.

**Evidência confirmada pelo cético**

```text
src/pages/Configuracoes.tsx:104-109 (toast sem persistência) e :83-94 (useState local com os 10 campos) · src/pages/Configuracoes.tsx:354-360 (aba Sistema passa onSave=savePreferencias) · src/components/configuracoes/SistemaTab.tsx:282-287 (botão "Salvar Configurações" → onSave) · SistemaTab.tsx:75-78 (temaEscuro só no estado local; arquivo não importa useTheme) vs src/components/layout/Header.tsx:25,63 (tema real via useTheme de @/components/theme/ThemeContext) · SistemaTab.tsx:97,104,113,132,141,232,241 (7 Switches com `checked` literal e sem onCheckedChange) · src/components/configuracoes/NotificacoesPreferencias.tsx:113-123 (Slider min 1/max 7 alimentando o mesmo estado); grep de supabase|useMutation|localStorage no arquivo = 0 ocorrências · supabase/functions/gerar-alertas/index.ts:59 `supabase.rpc('gerar_alertas_vencimento')` sem argumentos · Produção (bwwbeyolnnzppeuhgkcd), pg_get_functiondef(public.gerar_alertas_vencimento): `args` vazio, `cp.data_vencimento <= CURRENT_DATE + 7`, `cr.data_vencimento <= CURRENT_DATE + 7`, `WHEN t.data_vencimento <= CURRENT_DATE + 3 THEN 'alta'`, nenhuma leitura de preferência · Produção, cron.job: jobid 22, schedule `0 8 * * *`, command `select public.gerar_alertas_vencimento();` · Produção, information_schema.tables: não há tabela de preferências do sistema (só user_anomalia_preferences, user_demonstrativo_preferences, user_digest_preferences) · Sem teste: grep por SistemaTab|NotificacoesPreferencias|savePreferencias|"Salvar Configurações" em testes/e2e = nenhum arquivo
```

**Correção mínima (revisada na verificação)**

Dividir em duas entregas, porque a parte de banco exige aprovação do dono (regra 6.6: DDL em produção).

ENTREGA 1 — parar de mentir e persistir o que a UI já controla (front, sem DDL se usar tabela nova aprovada; caso contrário só o item (c) é imediato):
(a) Criar tabela `user_preferencias_sistema` (user_id PK → auth.users, JSONB `preferencias`, updated_at) com RLS `USING (user_id = auth.uid())`, via supabase_db_query + arquivo em supabase/migrations/ (nunca supabase_apply_migration). Carregar com TanStack Query e gravar com useMutation em Configuracoes.tsx, movendo o `useState` (linha 83) para estado inicializado pelo servidor; o toast de sucesso (linhas 104-109) passa a ser emitido só no onSuccess da mutation, e erro vira toast destructive.
(b) Ligar o switch de tema ao contexto real: em SistemaTab.tsx:75-78, usar `setTheme` de `useTheme()` ('@/components/theme/ThemeContext', o mesmo usado em Header.tsx:63) em vez de só `set('temaEscuro', v)`.
(c) Remover os 7 Switches decorativos (SistemaTab.tsx:97,104,113,132,141,232,241) ou marcá-los `disabled` com badge "Em breve" — hoje são controles que não respondem ao clique e sugerem funcionalidade inexistente. Este item é diff mínimo e independe de banco.

ENTREGA 2 — tornar a antecedência de alerta real (DDL em produção, deixar PR aberta e chamar o dono):
(d) `CREATE OR REPLACE FUNCTION public.gerar_alertas_vencimento(p_dias integer DEFAULT 7)` trocando os três literais (`CURRENT_DATE + 7` ×2 e `CURRENT_DATE + 3` da prioridade) por `CURRENT_DATE + p_dias` / limiar derivado, resolvendo a antecedência por usuário a partir de `user_preferencias_sistema` no CTE `destinos` (join por `ue.user_id`, COALESCE para 7 quando não houver preferência), mantendo a assinatura sem argumentos funcionando para o cron jobid 22 e para supabase/functions/gerar-alertas/index.ts:59.
(e) Regenerar src/integrations/supabase/types.ts (arquivo gerado, não editar à mão) para refletir o novo Args.

Cobertura: adicionar teste de componente que renderiza a aba Sistema, clica "Salvar Configurações" e exige a chamada de persistência (hoje nenhum teste toca esse caminho), e um teste SQL do novo parâmetro da RPC.

> **Ressalva na correção proposta** (achado do Codex na PR #422): `CREATE OR REPLACE FUNCTION gerar_alertas_vencimento(p_dias integer DEFAULT 7)` **não substitui** a função atual — cria uma sobrecarga. Em produção existe uma única assinatura, `gerar_alertas_vencimento()` sem argumentos (`SELECT oid::regprocedure FROM pg_proc WHERE proname LIKE 'gerar_alertas%'` → 1 linha), e é ela que o cron e `supabase/functions/gerar-alertas/index.ts:59` chamam. Com a sobrecarga, esses consumidores continuariam executando o corpo antigo, com os limites fixos. A correção tem de manter a assinatura sem argumentos e resolver a antecedência por usuário dentro do corpo; se o parâmetro for mesmo necessário, a migração precisa trocar os consumidores junto.

## 4. Cobrança Asaas é criada no provedor e nunca gravada no sistema: insert em asaas*payments falha sempre (uuid x id "cus*") e o erro só é logado

- **Gravidade:** alta · **Esforço estimado:** pequeno · **Frente:** falha-silenciosa
- **Onde:** `supabase/functions/asaas-proxy/index.ts:453`

**Cenário de falha**

Usuário abre /asaas (ou /pix-hub), seleciona um cliente, informa R$ 5.000 e vencimento, clica em criar cobrança. O boleto/PIX é efetivamente emitido no Asaas e o cliente é cobrado. O insert em asaas*payments morre com 22P02 (uuid recebendo "cus*..."), o erro vai só para o log, a função responde 200 e a UI mostra "Cobrança criada com sucesso!" (src/hooks/useAsaas.ts:85). A aba Cobranças continua vazia. Quando o cliente paga, o webhook PAYMENT_RECEIVED não encontra a linha, não faz nada e marca o evento como processado: a baixa nunca acontece.

**Impacto no negócio**

Cobrança emitida ao cliente sem nenhum registro no financeiro: o título a receber fica aberto para sempre, o recebimento não entra no caixa/DRE e a equipe pode emitir uma segunda cobrança do mesmo valor (cobrança em duplicidade do cliente). Todo o módulo Asaas está, na prática, não integrado, embora a tela afirme sucesso.

**Evidência confirmada pelo cético**

```text
supabase/functions/asaas-proxy/index.ts:453-476 — `const { error: dbError } = await supabase.from('asaas_payments').insert({ asaas_id: result.id, asaas_customer_id: data.asaas_customer_id, ... }); if (dbError) log.error('Erro DB criar_cobranca:', {...})` — sem return; segue para `result.pixData = pixData;` e `break` → 200.
supabase/functions/asaas-proxy/index.ts:199-206 e 355-359 — `empresaDoClienteAsaas` faz `.from('asaas_customers').select('empresa_id').eq('asaas_id', asaasId)`; usado como guard de criar_cobranca, prova que o parâmetro é o id texto do Asaas.
supabase/functions/asaas-proxy/index.ts:260-261 — criar_cliente grava `asaas_id: result.id` (texto do Asaas) em asaas_customers.
Banco bwwbeyolnnzppeuhgkcd (SELECT em information_schema.columns): asaas_payments.asaas_customer_id = uuid (nullable YES); asaas_payments.asaas_id = text; asaas_customers.id = uuid; asaas_customers.asaas_id = text. 1 FK com 'customer' no nome em asaas_payments.
Banco bwwbeyolnnzppeuhgkcd: `select 'cus_000005219613'::uuid` → 22P02 invalid input syntax for type uuid: "cus_000005219613".
Banco bwwbeyolnnzppeuhgkcd: pg_trigger em asaas_payments = apenas `set_updated_at_60e90ad3dec9516f2ca9 BEFORE UPDATE` (nenhuma coerção no INSERT).
Banco bwwbeyolnnzppeuhgkcd: asaas_payments 0 linhas, asaas_customers 0 linhas, asaas_config 0 linhas (módulo nunca usado → prejuízo ainda não consumado).
src/components/asaas/NovaCobrancaDialogVincularContaReceber.tsx:192 — `<SelectItem key={c.id} value={c.asaas_id}>`.
src/components/asaas/NovaCobrancaDialog.tsx:194 — `asaas_customer_id: customerId`.
src/hooks/useAsaas.ts:12-22 — customers vêm de `.from('asaas_customers').select('*')`; useAsaas.ts:85 — `toast.success('Cobrança criada com sucesso!')`.
src/routes/financeiroRoutes.tsx:132 + src/pages/Asaas.tsx:300 e src/routes/geralRoutes.tsx:127 + src/pages/PixHub.tsx:106 — caminho montado em produção.
supabase/functions/asaas-webhook/index.ts:100-133 — `.eq('asaas_id', payment.id).maybeSingle()` e `if (localPayment) {...}` sem else, dentro de processWithIdempotency (linha ~95): sem a linha local o evento é marcado processado sem efeito.
supabase/functions/asaas-proxy/index.test.ts (132 linhas) — zero ocorrências de criar_cobranca / asaas_payments / asaas_customer_id (grep).
src/hooks/useBoletos.ts:133 — `asaas_customer_id: data.sacado_cpf_cnpj` (segundo chamador, erro diferente e visível).
```

**Correção mínima (revisada na verificação)**

Em supabase/functions/asaas-proxy/index.ts, caso `criar_cobranca`: (1) resolver o uuid interno antes do insert — o guard da linha 357 já consulta asaas_customers por asaas_id, basta fazer esse select trazer `id, empresa_id` e usar o `id` em `asaas_customer_id`; (2) trocar o `log.error` da linha 472 por retorno de erro (ex.: `err('Cobrança criada no Asaas mas não registrada: ' + ..., 500)`) com o `result.id` no corpo, para a UI parar de dizer "sucesso" quando a cobrança não foi gravada — o dinheiro já foi cobrado, então o usuário precisa do id do Asaas para conciliar à mão; (3) no asaas-webhook/index.ts:100-133, quando `localPayment` for nulo, lançar RetryableError ou registrar em DLQ em vez de marcar o evento como processado, senão a baixa é perdida para sempre. Fora do escopo deste achado, mas listar em "Próximos passos": useBoletos.ts:133 manda CPF/CNPJ onde se espera o asaas_id.

## 5. Baixa automática por extrato marca o título como pago mas o lançamento bancário nunca é gravado (conta_bancaria_id vazio) e falhas no update são contadas como silêncio

- **Gravidade:** alta · **Esforço estimado:** medio · **Frente:** falha-silenciosa
- **Onde:** `src/components/contas-receber/BaixaAutomaticaDialog.tsx:154`

**Cenário de falha**

Usuário sobe o OFX em Contas a Receber > Baixa Automática, o sistema casa 12 créditos com 12 títulos e ele confirma. Os 12 títulos viram status 'pago', mas os 12 inserts em `transacoes_bancarias` falham com 22P02 e o erro é descartado — nenhum lançamento bancário conciliado é criado. A tela mostra "12 títulos liquidados com sucesso". Se algum update de título falhar (RLS, versão), ele é pulado em silêncio e a tela exibe 11 sem dizer que 1 ficou de fora.

**Impacto no negócio**

Título baixado sem contrapartida bancária: o mesmo crédito do extrato volta a aparecer como pendente na tela de Conciliação e pode ser conciliado de novo contra outro título (baixa em duplicidade), e o saldo/auditoria de `transacoes_bancarias` fica sem o recebimento. Além disso o usuário não tem como saber quais títulos do lote realmente foram baixados.

**Evidência confirmada pelo cético**

```text
src/components/contas-receber/BaixaAutomaticaDialog.tsx:148-163 (insert com `conta_bancaria_id: m.transacao.conta_bancaria_id || ''`, resultado descartado; `if (!error)` sem else) · linhas 208-210 e 326 (success screen com successCount) · linhas 59-99 (findMatches usa `t` cru; `.eq('empresa_id', empresaId)`).
src/components/contas-receber/BaixaAutomaticaDialog.types.ts:11 — `TransacaoBancaria = TransacaoOFX & { conta_bancaria_id?: string }`.
src/lib/ofx-parser/types.ts:3-13 — TransacaoOFX sem `conta_bancaria_id`; grep no diretório ofx-parser: zero ocorrências.
src/pages/ContasReceberConteudo.tsx:225-229 — montagem com `empresaId={empresaFilter !== 'all' ? empresaFilter : ''}`; src/hooks/useContasReceberLogic.ts:31 — default `'all'`; src/pages/ContasReceber.tsx:199-206 — botão que abre o diálogo.
src/components/contas-receber/RegistrarRecebimentoDialog.tsx:131-142 — padrão correto (guarda + `if (matchError) logger.warn`).
src/lib/financeiro/registrarEvento.ts:75-81 — `registrarEventoFinanceiroOrThrow` lança em falha.
Produção bwwbeyolnnzppeuhgkcd (somente SELECT): `transacoes_bancarias.conta_bancaria_id` = uuid, is_nullable YES, column_default NULL, 0 triggers não-internos; `select ''::uuid` → 22P02 invalid input syntax for type uuid: ""; contagens: total_transacoes=16, baixa_lote_rows=0, sem_conta=0, logs_baixa_automatica=0; `contas_receber.empresa_id` = uuid; triggers em contas_receber = update_updated_at_column, sincroniza_empresa_dos_anexos.
Ausência de teste: `ls src/components/contas-receber/__tests__/` (7 arquivos, nenhum de BaixaAutomatica) e `grep -rln BaixaAutomatica src/ e2e/` → só arquivos de produção.
```

**Correção mínima (revisada na verificação)**

Em src/components/contas-receber/BaixaAutomaticaDialog.tsx, dentro de handleConfirmBaixa:

1. Nunca enviar `''` em coluna uuid: trocar `conta_bancaria_id: m.transacao.conta_bancaria_id || ''` por um id real. Como o OFX não traz esse id, adicionar um `<Select>` de conta bancária no passo 'preview' (lista de `contas_bancarias` da empresa, já disponível na página via `contasBancarias`) e usar o valor escolhido; enquanto nenhuma conta estiver escolhida, seguir o padrão do irmão RegistrarRecebimentoDialog.tsx:131 e NÃO inserir (`if (contaBancariaId) { ... }`), em vez de gravar lixo.
2. Ler o erro do insert: `const { error: txError } = await supabase.from('transacoes_bancarias').insert({...})` e, em falha, contar como falha parcial + `toast.error`/log (remover o `eslint-disable local/no-floating-supabase-write`, que hoje só silencia o gate).
3. Fechar o silêncio do update: adicionar `else { failCount++; falhas.push(m.contaId) }` ao `if (!error)` da linha 148 e exibir falhas na tela de sucesso (linha 326) — "{processados} liquidados, {falhas} não processados" — para a tela parar de afirmar sucesso total.
4. Pré-condição: bloquear/avisar quando `empresaId === ''` (filtro "Todas as empresas"), porque findMatches silenciosamente retorna 0 correspondências nesse estado.
5. Adicionar teste unitário em src/components/contas-receber/**tests**/BaixaAutomaticaDialog.test.tsx cobrindo: insert com erro → contador de falha e toast; update com erro → não entra em successCount e aparece na tela.

## 6. Quorum de aprovação é salvo mas nunca exigido: 1 clique libera pagamento configurado para 2–5 aprovadores

- **Gravidade:** alta · **Esforço estimado:** medio · **Frente:** fluxo-incompleto
- **Onde:** `src/components/aprovacoes/ConfiguracaoAprovacaoCard.tsx:173`

**Cenário de falha**

O dono abre /configuracoes de aprovações, coloca "Quorum de Aprovação" = 2 (ou 3), salva e vê o toast "Configuração atualizada — As configurações de aprovação foram salvas." (useAprovacoes.ts:245-248). Um título de R$ 80.000 entra na fila. UM único aprovador clica "Aprovar" em AprovacoesPendentes: a RPC marca `status='aprovado'`, grava `contas_pagar.aprovado_por` e dispara o toast com confete "O pagamento foi aprovado e liberado para execução." (useAprovacoes.ts:460). RegistrarPagamentoDialog.tsx:112 passa a considerar a conta aprovada e o pagamento é liberado — com uma assinatura, não duas. A tela continua exibindo "Quorum: 2", então ninguém percebe que a segunda assinatura nunca foi pedida.

**Impacto no negócio**

A alçada de dupla aprovação — principal controle contra pagamento fraudulento ou errado a fornecedor — não existe, embora a tela afirme que existe. Qualquer usuário com permissão de aprovar libera sozinho pagamentos de qualquer valor. Hoje as 6 linhas de configuracoes_aprovacao em produção estão com `aprovadores_obrigatorios = 1`, então o prejuízo é latente; no instante em que o dono subir o quorum para 2 (a ação que a tela convida a fazer) ele passa a confiar num controle inexistente, e o rastro de auditoria registra um aprovador onde a política pede dois.

**Evidência confirmada pelo cético**

```text
(1) UI oferece e explica o quorum — src/components/aprovacoes/ConfiguracaoAprovacaoCard.tsx:172-193: Label "Quorum de Aprovação (Etapa 1)" (linha 178), Input type=number min="1" max="5" (180-188), texto "Define quantos aprovadores independentes são necessários para liberar o pagamento no nível inicial." (189-192); handleSave envia `aprovadores_obrigatorios: parseInt(aprovadores) || 1` (linha 74).
(2) Persistência real — src/hooks/useAprovacoes.ts:213-217 (`const patch = { valor_minimo_aprovacao, aprovadores_obrigatorios: config.aprovadores_obrigatorios, ativo }`) + toast "Configuração atualizada / As configurações de aprovação foram salvas." (useAprovacoes.ts:248-251).
(3) Zero consumo — `grep -rn "aprovadores_obrigatorios" src/ supabase/ e2e/ scripts/` retorna apenas: o card (49/58/74/242), o tipo + patch do hook (11/56/215), types.ts gerado, fixtures de teste (todas com valor 1, duas com 2 em testes de colisão de faixa) e DDL/seed de migrations. Nenhuma leitura em lógica de decisão. `grep -rn "quorum|nivel_atual|total_niveis|assinaturas"` em src/, supabase/functions e supabase/migrations não encontra nenhum contador de assinaturas no fluxo de aprovação.
(4) RPC em PRODUÇÃO (bwwbeyolnnzppeuhgkcd, `pg_get_functiondef` de public.aprovar_solicitacao_pagamento) é idêntica à migration supabase/migrations/20260913140000_rpcs_atomicas_fluxos_multi_passo.sql:115-180: trava a solicitação com FOR UPDATE, grava `contas_pagar.aprovado_por = auth.uid()` e `solicitacoes_aprovacao SET status='aprovado', aprovado_por=v_uid, aprovado_em=now()` e retorna. Não há SELECT em configuracoes_aprovacao, não há COUNT de aprovadores, não há verificação de nível.
(5) Tabela não comporta quorum — `information_schema.columns` de solicitacoes_aprovacao em produção: 13 colunas, um único `aprovado_por uuid`; NÃO existem nivel_atual, total_niveis nem assinaturas, apesar de supabase/migrations/20260509163954_a42bcd0a-1b48-423e-be5e-ba67d42a6422.sql:50-52 adicioná-las e de src/hooks/useAprovacoes.ts:28-30 declará-las no tipo (trabalho multi-nível abandonado no meio).
(6) Sem trigger supletivo — `pg_get_triggerdef` em produção para solicitacoes_aprovacao/contas_pagar/configuracoes_aprovacao devolve só `set_updated_at_*` e `trg_anexos_sync_empresa`; nenhum trigger em solicitacoes_aprovacao.
(7) Caminho alcançável — rota montada em src/routes/financeiroRoutes.tsx:106 → src/pages/Aprovacoes.tsx:51 (ConfiguracaoAprovacaoCard) e :62 (AprovacoesPendentes); o botão "Aprovar" (src/components/aprovacoes/AprovacoesPendentes.tsx:249-255) chama handleAprovar → aprovarMutation (linha 42) → useAprovarSolicitacao → RPC, com toast de confete "O pagamento foi aprovado e liberado para execução." (useAprovacoes.ts:467).
(8) Um clique libera o pagamento — src/components/contas-pagar/RegistrarPagamentoDialog.tsx:108-116: `estaAprovado` usa a solicitação mais recente (`solicitacaoPendente.status === 'aprovado'`, linha 111) e `aprovacaoBloqueada = requerAprovacao && !estaAprovado` (115); com status='aprovado' após UMA assinatura, o bloqueio em updateMutation (linha 143-145) não dispara e o pagamento é efetuado.
(9) Segundo call site idêntico — src/hooks/expert-actions/financial-actions.ts usa a mesma RPC (sem quorum).
(10) Nenhum teste de enforcement: o único arquivo de teste da RPC é src/hooks/expert-actions/__tests__/financial-actions.aprovacao.test.ts (atomicidade/erros) e src/hooks/__tests__/useAprovacoes.test.tsx só cobre a gravação da faixa; nenhuma asserção de que 2 assinaturas são exigidas.
(11) Estado de produção: `select ... from configuracoes_aprovacao` → 6 linhas (3 ativas em 5.000/50.000/999.999 + 3 inativas), todas com aprovadores_obrigatorios = 1.
```

**Correção mínima (revisada na verificação)**

Dois níveis. (a) Parar a mentira agora, imediato e de baixo risco: travar o campo em 1 em ConfiguracaoAprovacaoCard.tsx:180-192 (readOnly/max=1) com o texto dizendo que múltiplas assinaturas ainda não são exigidas, e recusar no useUpdateConfiguracaoAprovacao qualquer `aprovadores_obrigatorios > 1` com mensagem explícita — assim a tela deixa de prometer controle que não existe. (b) Entregar o controle de verdade: criar `aprovacao_assinaturas (solicitacao_id, user_id, assinado_em)` com UNIQUE(solicitacao_id, user_id) e RLS por empresa_acessivel, e reescrever public.aprovar_solicitacao_pagamento para, dentro da mesma transação com o FOR UPDATE que já existe, inserir a assinatura do auth.uid(), ler `aprovadores_obrigatorios` da faixa efetiva (a MENOR faixa ativa da empresa com valor_minimo <= valor da conta, mesmo critério de useConfiguracaoAprovacao) e só então gravar status='aprovado' + contas_pagar.aprovado_por/aprovado_em quando COUNT(DISTINCT user_id) >= quorum; abaixo disso retornar `{status:'pendente', assinaturas:N, quorum:Q}` para a UI mostrar "1 de 2" em vez de confete. Exibir N/Q em AprovacoesPendentes e cobrir com teste que 1 assinatura de quorum 2 NÃO libera o pagamento. Observação de escopo: a RPC também não grava contas_pagar.aprovado_em, o que deixa o fallback legado de RegistrarPagamentoDialog.tsx:112 inalcançável — corrigir junto no mesmo UPDATE.

## 7. Painel de obrigações acessórias marca tudo como atrasado e nunca sai de 0% concluído: status vem só do calendário e os botões não têm handler

- **Gravidade:** alta · **Esforço estimado:** pequeno · **Frente:** fluxo-incompleto
- **Onde:** `src/components/reforma-tributaria/ObrigacoesAcessorias.tsx:66`

**Cenário de falha**

Hoje (17/11/2026), com o mês corrente pré-selecionado, o painel carrega as 9 obrigações mensais do catálogo (ObrigacoesAcessorias.helpers.ts: EFD-Contribuições dia 10, EFD-Reinf 15, DCTF 15, GIA 15, NF-e de Serviço 10, EFD-IBS/CBS 20, EFD ICMS/IPI 25, DARF Unificado 25, DeSTDA 28) e, como 10 e 15 já passaram, mostra 5 delas com badge vermelho "Atrasada" e o card "Atrasadas: 5 — Requer ação imediata", mesmo que o contador já tenha entregado todas. Ao mesmo tempo os cards dizem "Transmitidas: 0" e "0% concluído". O usuário clica no botão vermelho de enviar (único botão de ação da linha) para transmitir ou marcar como entregue: nada acontece — sem request, sem toast, sem erro. Não existe nenhum caminho nessa tela para o número sair de 0%.

**Impacto no negócio**

O painel de compliance fiscal informa ao dono, todo mês e de forma permanente, que ele está em atraso com EFD-Contribuições, EFD-Reinf, DCTF, GIA e NF-e de Serviço e que 0% das obrigações foram cumpridas — um alarme falso sobre multa e malha fiscal. O efeito colateral é pior que o susto: como o painel grita "atrasado" para tudo, ele perde qualquer valor de sinal e uma obrigação de fato não entregue passa indistinguível no meio dos falsos positivos. A informação verdadeira está em entregas_obrigacoes e é mostrada em /tributario/obrigacoes, então as duas telas do mesmo assunto se contradizem.

**Evidência confirmada pelo cético**

```text
1) STATUS SÓ PELO CALENDÁRIO — src/components/reforma-tributaria/ObrigacoesAcessorias.tsx:66-71:
`let status: StatusObrigacao = 'pendente'; if (isBefore(vencimento, hoje)) { status = 'atrasada'; } else if (diasRestantes <= 5) { status = 'em_andamento'; }`
O vencimento é fabricado da data, não lido do banco (:63): `const vencimento = new Date(anoSelecionado, mesSelecionado - 1, ob.diaVencimento || 15);`

2) 'transmitida' É INALCANÇÁVEL — `grep -rn "transmitida" src/components/reforma-tributaria/` devolve só: ObrigacoesAcessorias.types.ts:4 (definição do tipo), :16 (campo transmitidaEm), ObrigacoesAcessorias.tsx:92/93/95 (leitura/cálculo), :100 (badge), :270 (render) e EmptyStateTributario.tsx:56 (string de texto). Nenhuma atribuição em lugar nenhum do repositório.
ObrigacoesAcessorias.tsx:92-93: `const transmitidas = obrigacoesStatus.filter((o) => o.status === 'transmitida').length; const percentualConcluido = total > 0 ? (transmitidas / total) * 100 : 0;`
Exibidos em :270-273 (`{stats.transmitidas}` + `{stats.percentualConcluido.toFixed(0)}% concluído`) e :227 (`<Progress value={stats.percentualConcluido} />`).

3) BOTÕES MORTOS — `grep -n "<form\|onClick\|onSubmit" src/components/reforma-tributaria/ObrigacoesAcessorias.tsx` → ZERO resultados nas 379 linhas. Os dois botões da linha, :322-324 (`<Button size="sm" variant="outline"><Download/></Button>`) e :325-330 (`<Button size="sm" variant={ob.status === 'atrasada' ? 'destructive' : 'default'}><Send/></Button>`), não têm handler e não estão dentro de <form> (hierarquia: Card > CardContent > Table). Clicar não dispara nada.

4) ALCANÇÁVEL EM PRODUÇÃO (ponto que tentei derrubar e não consegui) — a hipótese de refutação era o routeMap desviar a aba para a página boa. NÃO desvia: DashboardReformaTributaria.tsx:57-70 lista split-payment, conciliacao, incentivos, auditoria, comparativo, cashback, importacao-xml, exportacao, relatorios, per-dcomp, retencoes, fechamento-mensal — 'obrigacoes' NÃO está lá, então cai no else :75 `navigate(`/reforma-tributaria/${tabId}`)` e renderiza o componente quebrado em :208-209 (`case 'obrigacoes': return <ObrigacoesAcessorias />`). A aba está no menu visível: NavigationTributaria.tsx:78 `{ id: 'obrigacoes', label: 'Obrigações', icon: Clock }` (grupo Compliance). Cadeia de rota: src/routes/reformaTributariaRoutes.tsx:22-29 (`/reforma-tributaria/:tab`, dentro de ProtectedRoute) → src/pages/ReformaTributaria.tsx:14 (`<DashboardReformaTributaria initialTab={tab} />`).

5) CENÁRIO NUMÉRICO CONFERIDO PARA HOJE (17/11/2026, mês 11/2026 pré-selecionado em :42-43) — recontei pelo catálogo src/components/reforma-tributaria/ObrigacoesAcessorias.helpers.ts: as anuais (ECF mês 7, ECD mês 5, DIRF mês 2) são filtradas em :56-58 e a eventual (PER/DCOMP) em :59. Sobram 9 mensais: EFD-Contribuições 10, EFD-Reinf 15, DCTF 15, GIA 15, NF-e de Serviço 10 → vencimento anterior a hoje → 5 'atrasada'; EFD-IBS/CBS 20 → 3 dias → 'em_andamento'; EFD ICMS/IPI 25, DARF Unificado 25, DeSTDA 28 → 'pendente'. Resultado na tela: "Atrasadas: 5 — Requer ação imediata", "Transmitidas: 0", "0% concluído". Exatamente o alegado.

6) PERSISTÊNCIA IGNORADA — src/hooks/useEntregasObrigacoes.ts:14 (`StatusEntrega = 'pendente'|'entregue'|'dispensada'|'retificada'`), :16-30 (EntregaObrigacao com data_entrega, protocolo, valor_multa), :54-76 (useEntregasObrigacoes lendo `entregas_obrigacoes`), :79 (useRegistrarEntregaObrigacao, upsert idempotente por (empresa_id, obrigacao_id, competencia) conforme doc :1-8). `grep -rn "ObrigacoesAcessorias" src/` mostra que o único consumidor desse hook é a OUTRA tela, src/pages/tributario/ObrigacoesAcessorias.tsx:30-33,77-79, roteada em src/routes/tributarioRoutes.tsx:319-326 como `/tributario/obrigacoes` — essa sim lê entregas, calcula conformidade, exporta CSV e simula multa. O componente auditado não importa esse hook nem o client do Supabase.

7) BANCO REAL (SELECT, somente leitura, projeto bwwbeyolnnzppeuhgkcd) — `SELECT ... FROM public.entregas_obrigacoes`: tabela_existe=1, total_entregas=0, entregues=0, empresas=0. A infraestrutura está pronta e sem uso.

8) SEM COBERTURA — `grep -rln "Transmitidas|ObrigacoesAcessorias|Obrigações Acessórias"` em *.test.ts(x)/*.spec.ts(x)/*.e2e.ts sob src/ e e2e/ → nenhum arquivo. `grep -rn "obrigac|Obrigaç" e2e/` → nenhum resultado. Nenhum teste detectaria a regressão.
```

**Correção mínima (revisada na verificação)**

Duas opções, por custo crescente.

(A) Diff de 1 linha, risco quase nulo — eliminar a tela duplicada quebrada: adicionar `obrigacoes: '/tributario/obrigacoes',` ao routeMap em src/components/reforma-tributaria/DashboardReformaTributaria.tsx:57-70 (mesmo padrão já usado para auditoria, conciliacao, retencoes, fechamento-mensal). A aba "Obrigações" passa a abrir a página que já funciona ponta a ponta (lê e grava entregas_obrigacoes, conformidade, CSV, multa). Opcionalmente remover depois o import/case :22 e :208-209 e o componente morto. Essa é a correção que eu recomendo: resolve o prejuízo sem escrever lógica nova.

(B) Se o dono quiser manter o painel dentro do dashboard, aí é desenvolvimento de verdade (não cabe em "correção mínima"): importar useEntregasObrigacoes/useRegistrarEntregaObrigacao em ObrigacoesAcessorias.tsx, mapear status 'entregue'/'dispensada' → 'transmitida' no useMemo :62-82 (chave obrigacao_id + competencia 'YYYY-MM' — atenção: o componente monta competencia como 'MM/YYYY' em :77, formato incompatível com o hook, que usa 'YYYY-MM'), dar onClick ao botão Send chamando o registrar com toast, e trocar os códigos do catálogo local pelos ids de src/lib/tributario/obrigacoes/catalogo.ts (os dois catálogos são distintos — OBRIGACOES local usa 'EFD-CONTRIBUICOES' etc.). Sem isso, a persistência não casa.

Em qualquer caso: enquanto nada for feito, não deixe o card "Transmitidas / % concluído" no ar — ele afirma 0% de conformidade como fato.

## 8. Relatórios tributários agendados nunca são enviados: edge function sem nenhum invocador e sem job no pg_cron

- **Gravidade:** alta · **Esforço estimado:** pequeno · **Frente:** orfaos
- **Onde:** `supabase/functions/enviar-relatorios-tributarios-agendados/index.ts:3`

**Cenário de falha**

O usuário abre o Dashboard Tributário, cadastra um agendamento mensal do relatório anual com destinatários (ex.: financeiro@ e ti@), recebe o toast 'Agendamento criado' e vê no card 'Próximo: 04/08/2026 às 18:44'. Nenhum e-mail chega, nunca — e a data de 'Próximo envio' fica congelada no passado, porque só a própria edge function atualiza `proximo_envio_em`. No banco de produção há hoje 2 agendamentos ativos vencidos desde 2026-08-03 e 2026-08-04 (consulta na tabela `relatorios_tributarios_agendados`), ou seja, mais de 3 meses de relatórios prometidos e não entregues, sem nenhuma mensagem de erro na tela.

**Impacto no negócio**

Relatório tributário anual que diretoria e contabilidade acreditam receber por e-mail automaticamente nunca sai. O card mostra uma data futura de envio, então ninguém desconfia: o usuário assume que está coberto e deixa de gerar o relatório manualmente. Risco de decisão e de prestação de contas em cima de um relatório que não existe.

**Evidência confirmada pelo cético**

```text
CÓDIGO (lido por mim):
- supabase/functions/enviar-relatorios-tributarios-agendados/index.ts:3 — `// Cron diário 06:00 — drena agendamentos vencidos, gera PDF e envia por e-mail.`
- index.ts:108 — `const guard = await exigirChamadaInterna(req, 'relatorios_tributarios_cron');`
- index.ts:121-126 — query `.eq('ativo', true).lte('proximo_envio_em', now)`; index.ts:181-188 — só a própria função faz `update({ ultimo_envio_em, proximo_envio_em: calcularProximoEnvio(...) })`, confirmando que sem ela a data congela.
- supabase/functions/_shared/auth-guard.ts:274-303 — guard aceita service_role (linha 282) OU segredo em integration_secrets via x-cron-secret (linhas 286-292).
- grep em todo o repo por 'enviar-relatorios-tributarios-agendados': únicas referências fora do próprio diretório são .github/workflows/functions-deploy.yml:47 (deploy), supabase/migrations/20260902250000_fix_storage_view_audit_trail_gaps.sql:14 (comentário), graphify-out/manifest.json e docs/ (ESTADO_ATUAL.md:535 já lista a função como "sem chamador algum"). Zero `functions.invoke` em src/.
- src/routes/tributarioRoutes.tsx:79-86 e 111-117 — rotas `/tributario` e `/tributario/dashboard` -> <DashboardTributario /> dentro de <ProtectedRoute>.
- src/pages/tributario/DashboardTributario.tsx:329-331 — <RelatoriosAgendadosCard empresaId={empresaId} /> montado sem feature flag nem condicional.
- src/hooks/useRelatoriosTributariosAgendados.ts:44-58 — insert direto na tabela + `toast.success('Agendamento criado')`.
- src/components/tributario/dashboard/RelatoriosAgendadosCard.tsx:164-166 — `Próximo: {format(parseISO(a.proximo_envio_em), "dd/MM/yyyy 'às' HH:mm", ...)}`.
- TESTES: grep -rln por RelatoriosAgendadosCard|useRelatoriosTributariosAgendados|relatorios_tributarios_agendados|relatorios-tributarios-agendados em *.test.ts(x)/*.e2e.ts/*.spec.ts => 0 arquivos.

BANCO DE PRODUÇÃO bwwbeyolnnzppeuhgkcd (somente SELECT, rodados por mim):
- `SELECT jobid, jobname, schedule, left(command,160) FROM cron.job` => 33 linhas; nenhuma menciona a função. Existem net.http_post para sefaz-dfe-dispatcher (jobid 32), webhook-retry-worker (33), monitorar-erros-frontend (36), gerar-snapshots-conformidade (40), monitor-health (44) — nenhum para enviar-relatorios-tributarios-agendados.
- `SELECT ... FROM pg_proc WHERE prosrc ILIKE '%relatorios-tributarios-agendados%' OR prosrc ILIKE '%relatorios_tributarios_agendados%' OR prosrc ILIKE '%relatorios_tributarios_cron%'` => 0 linhas.
- `SELECT chave FROM integration_secrets` => conformidade_cron, internal_jobs, monitor_health_cron, send_push_notification. NÃO existe relatorios_tributarios_cron.
- `SELECT * FROM relatorios_tributarios_agendados` => 3 linhas, empresa 610db558-22b8-45e9-821f-f203cca01c3a: (a) ativo=true, mensal, destinatarios [ti@, financeiro@], proximo_envio_em 2026-08-04T18:44:48Z; (b) ativo=true, trimestral, [ti@], proximo_envio_em 2026-08-03T18:44:48Z; (c) ativo=false, anual, proximo_envio_em 2026-12-31. Todas com created_at 2026-07-29T18:44:48.527648Z (seed).
- `SELECT policyname, cmd, with_check FROM pg_policies WHERE tablename='relatorios_tributarios_agendados'` => 6 policies; rel_trib_agend_admin_fin_insert permite INSERT a admin/financeiro com empresa_acessivel(empresa_id) — ou seja, o cadastro pela UI realmente grava e o usuário realmente vê o toast de sucesso.
```

**Correção mínima (revisada na verificação)**

Criar o acionador que falta, copiando o padrão já em produção (jobid 32/44): (1) inserir o segredo `relatorios_tributarios_cron` em integration_secrets OU trocar a chave em index.ts:108 para 'internal_jobs' (que já existe); (2) criar job pg_cron `enviar-relatorios-tributarios-agendados-diario` em `0 6 * * *` com net.http_post para https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/enviar-relatorios-tributarios-agendados enviando o header x-cron-secret, via supabase_db_query + arquivo em supabase/migrations/ (regra 4). Como é DDL/migration em produção, a PR fica aberta para o dono (regra 6.6). Fora de escopo, mas registrar em Próximos passos: index.ts:181-188 avança proximo_envio_em mesmo quando o e-mail falha (ok=false), o que mascara falha de envio; e não há teste algum cobrindo a função.

> **Ressalva na correção proposta** (achado do Devin na PR #422): esta função tem `verify_jwt = true` em `supabase/config.toml`, então um job de `pg_cron` que envie apenas `x-cron-secret` é rejeitado pelo gateway antes de chegar ao guard interno. Ou o job manda `Authorization: Bearer <service_role>`, ou o bloco da função no `config.toml` passa a `verify_jwt = false` — e aí o guard interno é a única defesa, o que precisa ser decidido junto.

## 9. Alertas tributários nunca são gerados e o painel de Configurações afirma que o job 'roda diariamente às 06:00'

- **Gravidade:** alta · **Esforço estimado:** medio · **Frente:** orfaos
- **Onde:** `src/components/admin/CronJobsStatus.tsx:155`

**Cenário de falha**

O admin abre Configurações, vê o cartão 'Observabilidade do cron tributário' e lê 'Nenhuma execução registrada ainda. O job roda diariamente às 06:00' — conclui que o monitoramento está ligado e apenas sem histórico retido. Na verdade a detecção de sublimite do Simples, Fator R, vencimentos e desvios setoriais (o que a função calcula, cabeçalho linhas 3) nunca rodou: `alertas_tributarios` está parada em 28/07/2026. Os consumidores no front (`src/hooks/useAlertasTributarios.ts`, `src/components/tributario/dashboard/ConformidadeTendenciaWidget.tsx`) exibem a lista vazia/estagnada como se não houvesse risco tributário a reportar.

**Impacto no negócio**

Ausência de alerta é lida como ausência de problema. Estouro de sublimite do Simples, perda de janela do Fator R e vencimento de obrigação acessória passam sem aviso, com multa e juros como consequência direta; e o painel que deveria denunciar a falha é exatamente o que afirma que o job roda todo dia às 06:00, o que impede o diagnóstico.

**Evidência confirmada pelo cético**

```text
CÓDIGO (lido por mim): /home/user/Promo_Finance_V2/src/components/admin/CronJobsStatus.tsx:24 `const TRIBUTARIO_JOB = 'gerar-alertas-tributarios-diario';`; :36-42 `supabase.rpc('get_cron_run_history', { p_job_name: TRIBUTARIO_JOB, p_limit: 10 })`; :51 `if (!isAdmin) return null;` (admin-only); :69 CardDescription "execução automática via {TRIBUTARIO_JOB}"; :153-157 `{(!history || history.length === 0) && (<p>Nenhuma execução registrada ainda. O job roda diariamente às 06:00.</p>)}`. Montagem: /home/user/Promo_Finance_V2/src/pages/Configuracoes.tsx:24 (import) e :334 `<CronJobsStatus />`. BANCO (SELECTs meus em bwwbeyolnnzppeuhgkcd): dump completo de `cron.job` = 33 jobs, NENHUM chamado 'gerar-alertas-tributarios-diario'; `count(*) FROM cron.job WHERE command ILIKE '%gerar-alertas-tributarios%' OR '%gerar-alertas-dispatcher%'` = 0; `count(*) FROM pg_proc WHERE prosrc ILIKE '%gerar-alertas-tributarios%'...` = 0; `cron.job_run_details` JOIN `cron.job` para esse jobname = 0. POR QUE A FRASE APARECE (verificação própria, não assumida): `pg_get_functiondef('get_cron_run_history')` = STABLE SECURITY DEFINER, `WHERE (p_job_name IS NULL OR j.jobname = p_job_name)` e `RETURN COALESCE(runs, '[]'::jsonb)` — admin + jobname inexistente => `[]`, sem exceção => ramo 153-157. PROVA DE QUE NUNCA RODOU: tipos emitidos pela função em supabase/functions/gerar-alertas-tributarios/index.ts:124 `sublimite_simples`, :158 `fator_r_baixo`, :186 `vencimento_darf`, :251 `desvio_benchmark`, :284 `irpfm_2026`; `SELECT count(*) FROM alertas_tributarios WHERE tipo IN ('sublimite_simples','fator_r_baixo','vencimento_darf','desvio_benchmark','irpfm_2026')` = 0. Conteúdo real da tabela: 6 linhas, tipos `obrigacao`/`credito`/`nfe`, em dois lotes idênticos (2026-07-28 19:09:01 e 19:16:39), todas `resolvido=false` — dado de seed, não geração. SEGREDO AUSENTE (agravante secundário): `SELECT chave FROM integration_secrets` = exatamente 4 chaves — conformidade_cron, internal_jobs, monitor_health_cron, send_push_notification; não existe `gerar_alertas_tributarios`, exigido por index.ts:71 `exigirChamadaInterna(req, 'gerar_alertas_tributarios')`. Ressalva que eu mesmo levantei lendo supabase/functions/_shared/auth-guard.ts:274-292: o guard aceita também o service_role key (linhas 282-284), então o segredo ausente só bloqueia a via `x-cron-secret` — o bloqueio real é não haver invocador algum. SEM INVOCADOR: o único consumidor do nome em src/ é a constante do painel; `gerar-alertas-dispatcher/index.ts:22` mapeia `tributario: 'gerar-alertas-tributarios'` e o próprio dispatcher não tem cron nem chamador (0 em cron.job e 0 em pg_proc). SEM TESTE: `find` por *CronJobsStatus* retorna só o próprio .tsx; nenhum arquivo .test.ts/.test.tsx/.e2e.ts menciona CronJobsStatus ou get_cron_run_history; os testes existentes (supabase/functions/gerar-alertas-tributarios/index.test.ts:32,48,67) só exercitam rejeição do guard e passariam igual com a função nunca executando. RUNBOOK: /home/user/Promo_Finance_V2/docs/RUNBOOK.md:13 manda inspecionar `get_cron_run_history('gerar-alertas-tributarios-diario', 20)` — job inexistente. Confirmação cruzada no próprio repo: ESTADO_ATUAL.md:418 já registra `alertas_tributarios (0)` e :535 lista `gerar-alertas-dispatcher` entre as 17 Edge Functions sem chamador.
```

**Correção mínima (revisada na verificação)**

Separar as duas coisas, porque só uma é corrigível sem tocar produção. (A) Parar de mentir (front, sem DDL, cabe em PR comum): em src/components/admin/CronJobsStatus.tsx, deixar de afirmar um agendamento que o componente não verifica. Trocar o ramo 153-157 por um estado que distinga "job não agendado" de "sem histórico" — consultar a existência/agendamento do job (ex.: RPC admin que leia `cron.job` e devolva jobname+schedule+active) e, quando não houver job, renderizar alerta destrutivo "Job 'gerar-alertas-tributarios-diario' NÃO está agendado — nenhum alerta tributário está sendo gerado", não um texto tranquilizador. Remover o literal "às 06:00" ou derivá-lo do `schedule` real retornado; o texto fixo está errado contra todos os 33 jobs existentes. Mesmo tratamento na CardDescription (:69), que hoje afirma "execução automática via <job>" sem checar nada. (B) Ligar a geração de fato (requer aprovação do dono — regra 6.6: DDL/cron em produção): criar o job via `supabase_db_query` + arquivo em supabase/migrations/ com timestamp estritamente crescente, fazendo `net.http_post` para /functions/v1/gerar-alertas-tributarios com header `x-cron-secret`, no padrão já usado pelos jobids 32/33/36/40/44; e inserir a chave `gerar_alertas_tributarios` em `integration_secrets`, hoje ausente. Decidir também se o dispatcher (`gerar-alertas-dispatcher`, igualmente sem invocador) entra no caminho ou é removido, para não deixar dois órfãos. (C) Fechar o buraco de teste que permitiu isso passar: um teste que garanta que todo nome de cron job referenciado em src/ existe em `cron.job` — hoje nada liga a constante do painel à realidade do banco. (D) Corrigir docs/RUNBOOK.md:13, que manda o operador diagnosticar um job inexistente. Ordem: (A) primeiro, isolada — ela remove a mentira ao usuário hoje, sem risco em produção e sem esperar aprovação; (B) depois, em branch própria e PR aberta para o dono.

## 10. SPED EFD-Contribuições nunca gera: coluna empresas.inscricao_municipal não existe em produção

- **Gravidade:** alta · **Esforço estimado:** pequeno · **Frente:** schema-divergente
- **Onde:** `supabase/functions/exportar-sped-contribuicoes/index.ts:108`

**Cenário de falha**

Usuário abre o módulo tributário, escolhe empresa + competência (ex.: 2026-07, que tem apuração em apuracoes_tributarias) e clica em gerar SPED. A query da empresa falha com 42703, o código interpreta como 'Empresa não encontrada' e o catch converte em 500. A tela mostra o toast 'Falha ao gerar SPED: Erro interno ao exportar SPED'. Nenhum arquivo é gerado, em nenhuma competência, para nenhuma empresa — o erro real (coluna inexistente) nunca aparece.

**Impacto no negócio**

A exportação do EFD-Contribuições — arquivo de entrega obrigatória à Receita Federal — está 100% inoperante em produção e a mensagem de erro aponta para a causa errada ('Empresa não encontrada'), levando o dono a procurar problema no cadastro da empresa. Funcionalidade entregue como pronta sem nunca ter rodado contra o schema real.

**Evidência confirmada pelo cético**

```text
1) Código existe e diz isso. /home/user/Promo_Finance_V2/supabase/functions/exportar-sped-contribuicoes/index.ts:106-110: `const { data: empresa, error: empErr } = await admin.from('empresas').select('cnpj, razao_social, inscricao_estadual, inscricao_municipal').eq('id', empresa_id).maybeSingle(); if (empErr || !empresa) throw new Error('Empresa não encontrada');`. O catch (mesmo arquivo, ~linhas 168-179) responde `status: 500` com `JSON.stringify({ error: 'Erro interno ao exportar SPED' })`.

2) Banco de produção bwwbeyolnnzppeuhgkcd (SELECT, via MCP): `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='empresas' AND column_name LIKE 'inscricao%'` -> 1 linha, só `inscricao_estadual` (text). `SELECT table_schema, table_name FROM information_schema.columns WHERE column_name='inscricao_municipal'` -> 0 linhas (não existe em NENHUM schema). Reproduzi a lista exata do código: `SELECT cnpj, razao_social, inscricao_estadual, inscricao_municipal FROM public.empresas LIMIT 1` -> `{"code":"42703","message":"column \"inscricao_municipal\" does not exist"}`. Confirmação cruzada no repo: /home/user/Promo_Finance_V2/src/integrations/supabase/types.ts:6299/6325/6351 (arquivo gerado do banco) só tem `inscricao_estadual`, sem `inscricao_municipal`.

3) Migration marcada como aplicada mas sem efeito: /home/user/Promo_Finance_V2/supabase/migrations/20260317124844_96993a1e-2350-4a46-8a81-21125e50deef.sql:73 `ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS inscricao_municipal TEXT;` e `SELECT version, array_length(statements,1), array_to_string(statements,' ~~ ') LIKE '%inscricao_municipal%' FROM supabase_migrations.schema_migrations WHERE version='20260317124844'` -> `{n:190, tem_im:true}`. Mesmo bloco: de `inscricao_municipal, bairro, numero, complemento, logo_url`, o banco só tem `bairro` e `logo_url`.

4) Caminho alcançável em produção: /home/user/Promo_Finance_V2/src/routes/tributarioRoutes.tsx:83 e :115 renderizam `<DashboardTributario />`; /home/user/Promo_Finance_V2/src/pages/tributario/DashboardTributario.tsx:89 `const exportarSped = useExportarSped();` e :152-162 o botão chama `exportarSped.mutate({ empresaId, periodo: new Date().toISOString().slice(0, 7) })`; /home/user/Promo_Finance_V2/src/hooks/useExportarSped.ts:9 `supabase.functions.invoke('exportar-sped-contribuicoes', ...)` e :26 `onError: (e: Error) => toast.error(`Falha ao gerar SPED: ${e.message}`)` — o toast mostra exatamente "Falha ao gerar SPED: Erro interno ao exportar SPED". Função declarada em /home/user/Promo_Finance_V2/supabase/config.toml:175 (`[functions.exportar-sped-contribuicoes] verify_jwt = true`).

5) Nada protege adiante e nenhum teste cobre: a pasta da função tem só `index.ts`, `layout.ts`, `layout_test.ts`, `__fixtures__/`; o único teste (layout_test.ts) chama `buildEfdContribuicoesLinhas` com fixture que já inclui `inscricao_municipal: '987654321'` (__fixtures__/efd-contribuicoes-fixture.ts:14), nunca executando o select de index.ts. `grep -rln "exportar-sped" src/ tests/ e2e/` só retorna src/hooks/useExportarSped.ts — zero teste de integração/e2e.
```

**Correção mínima (revisada na verificação)**

Duas opções, ambas de poucas linhas; layout.ts usa o campo com fallback (`empresa.inscricao_municipal ?? ''` nas linhas 75 e 92, registros 0000 e 0140), então nenhuma das duas quebra o arquivo gerado:

(A) Sem DDL, resolve hoje: em supabase/functions/exportar-sped-contribuicoes/index.ts:108 remover `, inscricao_municipal` do select e passar o campo como null/'' para `buildEfdContribuicoesLinhas` (o tipo em layout.ts:8 já é `string | null`). O SPED sai com IM vazio nos registros 0000/0140 — mesmo resultado que hoje se a coluna existisse e estivesse nula.

(B) Causa raiz do desvio banco-vs-repo: criar nova migration em supabase/migrations/ com timestamp estritamente crescente contendo `ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS inscricao_municipal TEXT;` (e avaliar `numero`/`complemento`, do mesmo bloco, também ausentes). É DDL em produção, então pela regra 6.6 do AGENTS.md a PR fica aberta para o dono aprovar.

Recomendado: (A) para desbloquear a geração do SPED imediatamente + (B) numa PR separada para reconciliar o schema. Fora do escopo mas registrado: a migration 20260317124844 está marcada como aplicada sem ter criado as colunas — vale auditar se outras colunas daquele arquivo (276 declaradas) também faltam.

## 11. DRE Tributária sempre diz 'sem faturamento no período' porque faturamento_mensal.total_tributos não existe

- **Gravidade:** alta · **Esforço estimado:** pequeno · **Frente:** schema-divergente
- **Onde:** `supabase/functions/gerar-dre-tributaria/index.ts:61`

**Cenário de falha**

Usuário seleciona 2026-07 (competência com receita_bruta lançada em faturamento_mensal) no painel DRE Tributária. O select falha com 42703, `fat` vem null, o erro é descartado, receitaBruta fica 0 e a edge responde 200 com `dre: null`. A tela mostra 'Sem dados para o período.' e o botão CSV fica desabilitado — para todas as 19 competências lançadas.

**Impacto no negócio**

A DRE Tributária está permanentemente vazia e afirma ao dono que não há faturamento lançado quando há. Ele é instruído pela própria mensagem a 'lançar o faturamento mensal' que já está lançado. Decisão de carga tributária, comparativo de regime e export CSV ficam indisponíveis sem nenhum sinal de erro (HTTP 200).

**Evidência confirmada pelo cético**

```text
CÓDIGO (lido por mim, /home/user/Promo_Finance_V2):
- supabase/functions/gerar-dre-tributaria/index.ts:59-65 → `const { data: fat } = await supa.from('faturamento_mensal').select('receita_bruta, total_tributos').eq('empresa_id', empresaId).eq('ano', ano).eq('mes', mes).maybeSingle();` (sem `error`)
- index.ts:67-69 → `if (fat) { receitaBruta = Number(fat.receita_bruta || 0); }`
- index.ts:86-97 → `if (receitaBruta === 0) return jsonComCors({ dre: null, motivo: 'sem_faturamento_no_periodo', detalhe: 'Nao ha faturamento lancado para o periodo informado...' }, 200, req);`
- `total_tributos` nunca é usado no cálculo (linhas 100-157 só usam `receitaBruta` e `regime`)
- src/hooks/useDRETributaria.ts:37-40 → `invoke('gerar-dre-tributaria')`; `if (error) throw error; return (data as {dre?})?.dre ?? null;` (200 + dre:null não é erro)
- src/components/tributario/dashboard/DRETributariaPanel.tsx:19-22 (seletor de período + hook), :67 `disabled={!dre}` no botão CSV, :75 `{!isLoading && !dre && <p className="text-sm text-muted-foreground">Sem dados para o período.</p>}`
- src/pages/tributario/DashboardTributario.tsx:346 → `<DRETributariaPanel empresaId={empresaId} />`
- src/routes/tributarioRoutes.tsx:83 e :115 → `<DashboardTributario />` (rota real)

BANCO DE PRODUÇÃO bwwbeyolnnzppeuhgkcd (somente SELECT, executado por mim):
- Colunas reais de public.faturamento_mensal: ano, created_at, created_by, empresa_id, id, impostos_federais, impostos_municipais, mes, mes_referencia, observacoes, receita_bruta, receita_exportacao, receita_industria, receita_revenda, receita_servicos, receita_vendas, valor_faturamento, valor_impostos → NÃO existe `total_tributos`
- `SELECT receita_bruta, total_tributos FROM public.faturamento_mensal` → ERRO 42703 `column "total_tributos" does not exist` (reproduzido)
- `SELECT count(*), count(*) FILTER (WHERE coalesce(receita_bruta,0) > 0), min/max período, count(DISTINCT empresa_id)` → total=19, com_receita=19, min_per=2025-01, max_per=2026-07, empresas=1 → TODAS as 19 competências lançadas têm receita > 0 e nenhuma gera DRE
- Amostra: 2026-07 = 285000, 2026-06 = 275000, 2026-05 = 268000, 2026-04 = 255000, 2026-03 = 248000

TESTES: nenhum. `grep -rln "dre-tributaria|DRETributaria|gerar-dre" src/ supabase/ e2e/ tests/` retorna só o próprio código, `supabase/config.toml` e `contract-coverage_test.ts` (listas textuais de dívida, linhas 67 e 252, sem execução nem checagem de schema).

CENÁRIO DE FALHA CONFIRMADO: usuário abre Dashboard Tributário, seleciona 2026-07 (receita_bruta=285000 no banco) → PostgREST recusa o select com 42703 → `error` descartado → `fat = null` → `receitaBruta = 0` → edge devolve 200 com `dre: null` → tela exibe "Sem dados para o período." e CSV desabilitado. Idêntico para as 19 competências de 2025-01 a 2026-07. O módulo DRE Tributária está 100% inoperante em produção e mente ao usuário dizendo que ele não lançou faturamento que ele lançou.
```

**Correção mínima (revisada na verificação)**

Em supabase/functions/gerar-dre-tributaria/index.ts:59-69, duas linhas:

1. Remover a coluna inexistente do select (ela nem é usada no cálculo): `.select('receita_bruta')`.
2. Parar de engolir o erro do banco, para que uma falha de leitura nunca mais seja apresentada como "sem faturamento": desestruturar `error` e devolver 500 explícito em vez de cair no ramo `receitaBruta === 0`:
   `const { data: fat, error: errFat } = await supa.from('faturamento_mensal').select('receita_bruta')...;`
   `if (errFat) return jsonComCors({ error: 'Falha ao ler faturamento do periodo' }, 500, req);`
   Não mexer no ramo `sem_faturamento_no_periodo` (linhas 86-97): ele está correto e passa a ser verdadeiro quando a competência realmente não tem lançamento. Nenhuma migration é necessária — `total_tributos` é código morto, não falta coluna no banco. Adicionar teste que trave o nome da coluna contra o schema (hoje `contract-coverage_test.ts` não cobre nada disso) evita a reincidência; é o que deixou esta função quebrada passar batido.

## 12. Consulta de CNPJ (onboarding tributário) retorna 503 em 100% das chamadas: RPC cnpja_check_rate_limit não existe em produção

- **Gravidade:** alta · **Esforço estimado:** pequeno · **Frente:** schema-divergente
- **Onde:** `supabase/functions/cnpja-lookup/index.ts:179`

**Cenário de falha**

Usuário abre o Onboarding Tributário, digita o CNPJ da empresa para preencher razão social/CNAE/regime automaticamente. Cache vazio -> cache_miss -> RPC inexistente -> PostgREST devolve PGRST202 -> rlError -> resposta 503 com 'Serviço de rate limit indisponível. Tente novamente em instantes.' O usuário tenta de novo indefinidamente e nunca recebe os dados; nada é gravado em cnpja_cache (0 linhas, consistente com nunca ter funcionado).

**Impacto no negócio**

O preenchimento automático de cadastro por CNPJ está morto em produção e a mensagem culpa um 'serviço indisponível' temporário, convidando o usuário a tentar novamente para sempre. O cadastro das empresas precisa ser digitado à mão, com risco de erro em dados fiscais (CNAE e regime alimentam cálculo de tributos).

**Evidência confirmada pelo cético**

```text
supabase/functions/cnpja-lookup/index.ts:179-196 — `const { data: allowed, error: rlError } = await admin.rpc('cnpja_check_rate_limit', { _user_id: userId, _max: RATE_LIMIT_MAX, _window_minutes: RATE_LIMIT_WINDOW_MIN });` e `if (rlError) { ... return new Response(JSON.stringify({ error: 'Serviço de rate limit indisponível. Tente novamente em instantes.' }), { status: 503, ... }) }`.
Banco de produção (bwwbeyolnnzppeuhgkcd, somente SELECT):
- `SELECT p.proname, n.nspname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.proname ILIKE '%cnpja%'` -> 0 linhas (a função não existe em nenhum schema).
- `SELECT c.relname, c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname LIKE 'cnpja%' AND n.nspname='public'` -> apenas {cnpja_cache, r} e {cnpja_cache_pkey, i}; public.cnpja_rate_limit e idx_cnpja_cache_expires_at AUSENTES.
- `SELECT count(*) FROM public.cnpja_cache` -> 0; migration 20260418121937 registrada em supabase_migrations.schema_migrations com 9 statements (o array `statements` começa com 'CREATE TABLE public.cnpja_cache ... | CREATE INDEX idx_cnpja_cache_expires_at ...'); max(version) = 20261117010000.
Migration de origem: supabase/migrations/20260418121937_7350e81b-f116-41a4-bb9b-af83af63c745.sql:20-35 (CREATE TABLE public.cnpja_rate_limit + RLS + policy) e :37-65 (CREATE OR REPLACE FUNCTION public.cnpja_check_rate_limit(_user_id UUID, _max INTEGER DEFAULT 10, _window_minutes INTEGER DEFAULT 60) RETURNS BOOLEAN ... SECURITY DEFINER). Nenhum DROP dessa função em migration alguma (grep em supabase/migrations/).
Deploy confirmado: supabase_functions_ping('cnpja-lookup') -> status 200, alive=true; supabase_functions_invoke POST {"cnpj":"11111111111111"} -> 401 {"error":"Token inválido"} (guard de `sub` em index.ts:117-118, commit c8f2a3206 de 2026-09-03, posterior ao commit 3ce83bb71 de 2026-07-30 que introduziu a chamada da RPC).
UI: src/hooks/useCnpjaLookup.ts:53 (supabase.functions.invoke('cnpja-lookup')), :71 (throw com a mensagem da function), :91 (toast.error); src/pages/tributario/OnboardingTributario.tsx:64 (useCnpjaLookup), :88 (lookup.mutateAsync), :231 (`<Button onClick={() => setStep(2)} disabled={!cnpjData}>`), :241 (`step === 2 && cnpjData`); src/routes/tributarioRoutes.tsx:135-142 (rota /tributario/onboarding em ProtectedRoute). supabase/config.toml:111 ([functions.cnpja-lookup] verify_jwt = false).
Testes: nenhum arquivo test/spec/e2e menciona 'cnpja' (grep -rl 'cnpja' --include=*.ts --include=*.tsx | grep -Ei 'test|spec|e2e' = vazio).
```

**Correção mínima (revisada na verificação)**

Criar em produção o DDL que ficou carimbado sem executar, via supabase_db_query (nunca supabase_apply_migration) + arquivo novo em supabase/migrations/ com timestamp estritamente maior que 20261117010000: (a) CREATE TABLE public.cnpja_rate_limit (user_id UUID NOT NULL, window_start TIMESTAMPTZ NOT NULL, request_count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (user_id, window_start)); (b) CREATE INDEX idx_cnpja_rate_limit_window ON public.cnpja_rate_limit(window_start) (simples, sem CONCURRENTLY); (c) ALTER TABLE ... ENABLE ROW LEVEL SECURITY + policy de SELECT `user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')`; (d) CREATE OR REPLACE FUNCTION public.cnpja_check_rate_limit(\_user_id UUID, \_max INTEGER DEFAULT 10, \_window_minutes INTEGER DEFAULT 60) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, com o corpo de 20260418121937:46-65. Nada muda na edge function nem no front. Verificar depois com SELECT em pg_proc e com um lookup real (deve gravar linha em cnpja_cache). Como é DDL em produção, a PR fica aberta para o dono (AGENTS.md 6.6). Observação para "Próximos passos" (fora do escopo do fix): a janela em 20260418121937:51 usa só EXTRACT(MINUTE) módulo \_window_minutes, o que com \_window_minutes=60 gera window_start = início do minuto, não da hora — o limite de 10/hora viraria 10/minuto; e não há nenhum teste cobrindo cnpja-lookup.

## 13. Open Finance devolve saldos e extratos inventados como sucesso e grava as transações falsas em transacoes_bancarias

- **Gravidade:** alta · **Esforço estimado:** pequeno · **Frente:** simulacao-em-producao
- **Onde:** `supabase/functions/open-finance/index.ts:430`

**Cenário de falha**

Qualquer usuário autenticado invoca a edge function `open-finance` com `action: 'import_transactions'` e o `conta_bancaria_id` de uma das 8 contas reais (não há checagem de consentimento nesse caminho). A função insere 5 lançamentos fabricados em `transacoes_bancarias`, com coluna `saldo` recalculada em cima do `saldo_atual` verdadeiro da conta, e responde `success: true`. Na tela Conciliação Bancária aparecem um PIX de R$ 5.000,00 de 'CLIENTE ABC' e uma TED de R$ 8.500,00 para 'PAGTO FORNECEDOR' que nunca existiram, prontos para serem conciliados contra títulos reais. Pela UI (Integrações > Open Finance), o botão 'Importar' só aparece com `consent.status === 'authorized'` (src/components/integracoes/open-finance/OpenFinanceConsentList.tsx:103) e nenhum trecho do código grava esse status — a URL de autorização é `https://openbanking.example.com/authorize` (L314) —, então hoje a porta de entrada é a invocação direta da função, não o clique.

**Impacto no negócio**

Extrato bancário contaminado com lançamentos inexistentes dentro do módulo de conciliação: títulos a pagar/receber podem ser baixados contra crédito que não entrou, e o saldo conciliado deixa de bater com o banco. O painel ainda promete 'sincronização automática de saldos e transações' (src/components/integracoes/OpenFinancePanel.tsx:103-105), e a consulta de saldo responde R$ 245.890,50 fixo para qualquer conta de qualquer empresa.

**Evidência confirmada pelo cético**

```text
CÓDIGO (lido por mim):
- /home/user/Promo_Finance_V2/supabase/functions/open-finance/index.ts:430 — `// Simulated transactions` + os 5 lançamentos fixos ('PIX Enviado - FORNECEDOR LTDA' -1500.00; 'PIX Recebido - CLIENTE ABC' 5000.00; 'TED - PAGTO FORNECEDOR' -8500.00; 'PGTO BOLETO - ENERGIA ELETRICA' -2350.00; 'DEP BOLETO - FATURA 12345' 12500.00), datas relativas a `Date.now()`, retorno `{ success: true, transactions, total: 5 }`.
- index.ts:392 — `// Simulated balances` (available 245890.50 / current 248500.00 / blocked 2609.50) com `success: true`.
- index.ts:348 — `// For demo, return simulated accounts`; index.ts:316 — `const baseUrl = \`https://openbanking.example.com/authorize\``.
- index.ts:535-545 — `const { data: contaBancaria } = await supabase.from('contas_bancarias').select('saldo_atual')...`; `let runningBalance = contaBancaria?.saldo_atual || 0;`
- index.ts:560-567 — `await supabase.from('transacoes_bancarias').insert({ conta_bancaria_id: contaBancariaId, data: txnDate, descricao: txn.description, valor: valorAbsoluto, tipo, saldo: runningBalance + amount, conciliada: false })`.
- index.ts:600 — `message: \`Importação concluída: ${imported} transações importadas, ${skipped} duplicadas ignoradas\``.
- index.ts:128-140 — guard de tenant que o achado não mencionou: `.from('contas_bancarias').select('empresa_id').eq('id', contaBancariaId)` + `await exigirVinculoEmpresa(user.id, contaBancariaAlvo.empresa_id, req)`; `_shared/auth-guard.ts:390-440` exige apenas vínculo (sem papel).
- index.ts:142-143 — `const inativaImport = respostaIntegracaoDesativada('open_finance', corsHeaders); if (inativaImport) return inativaImport;` → `_shared/resilience.ts:126-131` lê `Deno.env.get('INTEGRACOES_DESATIVADAS')`.
- index.ts:294 — `status: 'awaiting_authorization'` (único status gravado pelo código).
- src/hooks/useOpenFinance.ts:181-216 — mutation `import_transactions` e `toast.success('Transações importadas', { description: data.message })`.
- src/components/integracoes/open-finance/OpenFinanceConsentList.tsx:103-111 — gate `consent.status === 'authorized'`; botões "Saldos" e "Extrato" SEM `onClick`.
- src/components/integracoes/OpenFinancePanel.tsx renderizado em src/pages/Integracoes.tsx:195 e src/pages/Configuracoes.tsx:347.
- src/lib/conciliacao-page-helpers.ts:110-143 — `carregarTransacoesBanco`: `.from('transacoes_bancarias').select('*').eq('conta_bancaria_id', contaId)`, `tipo: t.tipo === 'receita' ? 'credito' : 'debito'`, `conciliada: !!t.conciliada`.
- supabase/config.toml:38-39 — `[functions.open-finance] verify_jwt = true`; .github/workflows/functions-deploy.yml:82 — `- open-finance`.
- Mock do front: src/components/conciliacao/ImportarExtratoDialog.tsx:47-116 (`// Mock de dados retornados pelo Open Finance`, L63) e ImportarExtratoDialogArquivoLocal.tsx:129-132 (botão "Conectar via Open Finance"); persistência em src/hooks/useConciliacao.ts:195-240 (`extrato_bancario`); falha da auto-conciliação em src/lib/conciliacao-page-helpers.ts:254-262 + src/hooks/useConciliacao.ts:44-47.
- Zero testes: `grep -rln "open-finance|open_finance"` em *.test.ts/*.spec.ts/*_test.ts/*.e2e.ts não retornou nada.

BANCO DE PRODUÇÃO bwwbeyolnnzppeuhgkcd (somente SELECT):
- `contas_bancarias` = 8; `transacoes_bancarias` = 16; `open_finance_consents` = 0 linhas (logo 0 com status 'authorized'). Nenhuma das 5 descrições falsas gravada hoje.
- `transacoes_bancarias` em uso real: 10 linhas `tipo='credito'` não conciliadas e 6 conciliadas, datas 2026-07-20 a 2026-07-27.
- Schema de `transacoes_bancarias`: NOT NULL apenas em id (default), data, descricao, valor, tipo e status (default 'pendente'); `conta_bancaria_id` nullable; `saldo` numeric default 0; `conciliada` boolean default false. Sem coluna `empresa_id`. `pg_constraint` só tem PK e 2 FKs (confirmado_por, regra_id) — nenhum CHECK em `tipo`. `pg_trigger` (não interno) = 0 linhas: o INSERT fabricado passa e não mexe em `contas_bancarias.saldo_atual`.
- `pg_policy` de `open_finance_consents`: uma única policy "Users can manage their own consents", `polcmd='*'` (ALL), `USING ((SELECT uid()) = user_id)`, `WITH CHECK` nulo → o próprio usuário pode gravar `status='authorized'` na sua linha.
```

**Correção mínima (revisada na verificação)**

Fechar as fontes simuladas em vez de implementar Open Finance (diff mínimo, ~3 arquivos):

1. `supabase/functions/open-finance/index.ts`: trocar os blocos simulados por erro explícito enquanto não houver integração real. Em `getTransactions` (:412-430) e `getBalances` (:380-392), e também em `getAccounts` (:348), lançar/retornar 501 `{ error: 'integracao_nao_implementada' }` quando não houver endpoint/credencial de instituição configurada (`OPEN_FINANCE_CLIENT_ID` vazio já é indicador suficiente hoje). Assim `importTransactionsToSystem` para de gravar e o front mostra erro em vez de `toast.success`.

2. No mesmo arquivo, aplicar em `import_transactions` o mesmo gate de consentimento que `getAccounts` já faz (:330-342): exigir `open_finance_consents` com `status='authorized'` e `user_id` do chamador antes de qualquer INSERT — hoje esse caminho não checa consentimento nenhum.

3. `src/components/conciliacao/ImportarExtratoDialog.tsx:47-116`: remover o `mockExtrato` e desabilitar a aba/botão "Conectar via Open Finance" (`ImportarExtratoDialogArquivoLocal.tsx:110-133`) com rótulo de indisponível, em vez de anunciar "Transações sincronizadas com sucesso" sobre dados fabricados no próprio navegador.

4. Cobrir com teste o que hoje não tem nenhum: `import_transactions` sem consentimento autorizado deve responder erro e não inserir em `transacoes_bancarias`.

Fora do escopo desta correção, mas vale registrar: a policy `FOR ALL` sem `WITH CHECK` em `open_finance_consents` deixa o próprio usuário promover seu consentimento a `authorized`.

## 14. Log de eventos SEFAZ é semeado com 7 eventos falsos a cada carregamento da página, e o histórico e o analytics exibem protocolos e taxas inventados

- **Gravidade:** alta · **Esforço estimado:** pequeno · **Frente:** simulacao-em-producao
- **Onde:** `src/lib/sefaz-event-logger.ts:238`

**Cenário de falha**

Usuário abre Notas Fiscais > aba Analytics e depois a aba Histórico, sem ter emitido nenhuma NF-e. A tela mostra 'Histórico de Eventos SEFAZ' com 7 eventos datados de 1 em 1 hora para trás, entre eles duas autorizações com protocolo 135240000123456/135240000123457 e chave de acesso 35240112345678000190550010000012341234567890, uma rejeição 204 'Duplicidade de NF-e' e um cancelamento homologado protocolo 135240000123460. O Analytics calcula taxa de autorização, principais códigos de rejeição e tempo médio de resposta (2340ms, 1890ms...) exclusivamente a partir desses 7 registros.

**Impacto no negócio**

O painel de conformidade fiscal da NF-e mostra número de documento, chave de acesso e protocolo de autorização que não existem na SEFAZ, e indicadores de desempenho (taxa de autorização, taxa de rejeição, tempo de resposta) derivados deles. Qualquer decisão ou conferência baseada nessa aba — inclusive provar que uma nota foi autorizada — parte de dado inventado.

**Evidência confirmada pelo cético**

```text
/home/user/Promo_Finance_V2/src/lib/sefaz-event-logger.ts:238 — `inicializarEventosDemo();` (topo do módulo, sem guarda; arquivo inteiro sem `import.meta.env`)
/home/user/Promo_Finance_V2/src/lib/sefaz-event-logger.ts:227-234 — `eventosDemo.forEach((evento, index) => { const novoEvento = { ...evento, id: gerarEventoId(), timestamp: new Date(Date.now() - index * 3600000) }; eventosLog.push(novoEvento); });`
/home/user/Promo_Finance_V2/src/lib/sefaz-event-logger.ts:153-161 — `tipo: 'AUTORIZACAO', chaveAcesso: '35240112345678000190550010000012341234567890', numeroNfe: '000001234', cStat: '100', xMotivo: 'Autorizado o uso da NF-e', protocolo: '135240000123456', tempoResposta: 2340`
/home/user/Promo_Finance_V2/src/lib/sefaz-event-logger.ts:35 — `const eventosLog: EventoSefaz[] = [];` (estado de módulo, re-semeado a cada carga da página)
/home/user/Promo_Finance_V2/src/components/nfe/EventosHistorico.tsx:23,31,32 — `import { getEventos, getEstatisticas, ... }` / `const eventos = getEventos();` / `const stats = getEstatisticas();`
/home/user/Promo_Finance_V2/src/components/nfe/EventosHistorico.tsx:34-45 — filtro só por `searchTerm` e `tipoFilter`; nenhum filtro por `ambiente`
/home/user/Promo_Finance_V2/src/components/nfe/EventosHistorico.tsx:71,84,97,110 — cards "Total Eventos" `{stats.total}`, "Autorizadas" `{stats.autorizadas}`, "Rejeitadas" `{stats.rejeitadas}`, "Tempo Médio" `{stats.tempoMedioResposta}ms`
/home/user/Promo_Finance_V2/src/components/nfe/EventoDetalhes.tsx:58-92 — renderiza `{evento.chaveAcesso}` e `{evento.protocolo}` com botões `handleCopy(evento.chaveAcesso!, 'Chave de acesso')` e `handleCopy(evento.protocolo!, 'Protocolo')`
/home/user/Promo_Finance_V2/src/components/nfe/SefazAnalytics.tsx:35,46,58-80 — `import { getEventos }`; `const eventos = getEventos();`; `taxaSucesso: total > 0 ? (autorizadas / total) * 100 : 0`, `taxaRejeicao`, `tempoMedio` calculados só sobre esses eventos
/home/user/Promo_Finance_V2/src/lib/sefaz-rejection-monitor.ts:3 — `import { getEventos, EventoSefaz } from './sefaz-event-logger';` (alimenta `AlertasRejeicao.tsx:33`, renderizado em NotasFiscaisAbas.tsx:329)
/home/user/Promo_Finance_V2/src/pages/NotasFiscaisAbas.tsx:84,90 — `<TabsTrigger value="analytics">` e `<TabsTrigger value="historico">` incondicionais
/home/user/Promo_Finance_V2/src/pages/NotasFiscaisAbas.tsx:318,326 — `<SefazAnalytics />` e `<EventosHistorico />`
/home/user/Promo_Finance_V2/src/pages/NotasFiscais.tsx:157 — `<NotasFiscaisAbas ... />`
/home/user/Promo_Finance_V2/src/routes/fiscalRoutes.tsx:11 + /home/user/Promo_Finance_V2/src/App.tsx:81 — rota `/notas-fiscais` montada em produção
/home/user/Promo_Finance_V2/src/components/nfe/ContingenciaNFe.tsx:66,76,119,137 — únicos `registrarEvento` reais do `src/`, todos `tipo: 'CONTINGENCIA'`
/home/user/Promo_Finance_V2/src/components/nfe/__tests__/sefaz-sem-protocolo-fabricado.test.tsx:1-11,23 — achado F12 ("protocolo gerado localmente") corrigido só nas outras abas; L23 `vi.mock('@/lib/sefaz-event-logger', ...)` deixa o semeador fora do contrato
Cobertura: grep `EventosHistorico|SefazAnalytics|inicializarEventosDemo|getEstatisticas` em `src/**/*.test.ts(x)` e `e2e/**/*.e2e.ts` → 0 resultados
```

**Correção mínima (revisada na verificação)**

Apagar a linha 238 de `src/lib/sefaz-event-logger.ts` e a função `inicializarEventosDemo` (L149-235), deixando `eventosLog` nascer vazio. Os consumidores já suportam log vazio: `EventosHistorico.tsx:235-238` tem estado vazio ("Nenhum evento encontrado") e `getEstatisticas` (L122-123) e `SefazAnalytics.tsx:76-78` já guardam `total > 0`. Dois complementos no mesmo diff: (a) estado vazio explícito em `SefazAnalytics` (hoje os gráficos ficariam em branco sem explicar por quê, o que troca a mentira por confusão); (b) um teste que fixe o contrato no mesmo estilo do F12 — importar `sefaz-event-logger` sem mock e asseverar `getEventos()).toHaveLength(0)` e `'inicializarEventosDemo' in mod === false`, mais um render de `EventosHistorico` esperando zero ocorrências de `135240000123456` e de `35240112345678000190550010000012341234567890`. Não mexer em `registrarEvento`/`getEventos`: a persistência real desses eventos (hoje só memória, perdida a cada reload) é escopo separado e deve ir para "Próximos passos", não para este fix.

## 15. Status da SEFAZ é decidido por Math.random, e a contingência automática pode trocar o modo de emissão fiscal com base nesse sorteio

- **Gravidade:** alta · **Esforço estimado:** medio · **Frente:** simulacao-em-producao
- **Onde:** `src/lib/sefaz-contingency/state.ts:111`

**Cenário de falha**

Usuário abre Notas Fiscais > aba Monitor ou Contingência e deixa a tela aberta. A cada 30s o sistema 'consulta' a SEFAZ: em ~10% das verificações ele sorteia offline e dispara toast 'SEFAZ ficou indisponível' com a SEFAZ perfeitamente no ar (e o inverso: declara 'SEFAZ está online e operacional' quando pode estar fora). Após 3 sorteios negativos seguidos, `runAutoContingencyCheck` ativa sozinho o modo de contingência offline, registra evento CONT_AUTO_ATIVADA e avisa 'Contingência automática ativada: Falhas consecutivas (3x)'. O gráfico de latência e o uptime % do Monitor são inteiros derivados do `setTimeout` aleatório de 300-1000ms.

**Impacto no negócio**

Decisão fiscal (emitir em contingência offline / FS-DA em vez de normal) tomada a partir de número aleatório, sem nenhuma consulta real à SEFAZ; e o painel de monitoramento que o usuário consulta para saber se pode emitir mostra disponibilidade, latência e falhas consecutivas totalmente fictícias. Alarme falso recorrente e risco de emitir em contingência sem necessidade.

**Evidência confirmada pelo cético**

```text
(1) TRECHO EXISTE, LITERAL — `src/lib/sefaz-contingency/state.ts:107-134`: `checkSefazHealth` faz `await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 700));` (L109), `const isOnline = Math.random() > 0.1;` (L111), `const latency = Date.now() - startTime;` (L112). Zero requisição de rede no arquivo. Persiste via `updateSefazHealthStatus(status)` (L125) e dispara `registerCommunicationFailure()` / `registerCommunicationSuccess()` (L127-131).

(2) ALCANÇÁVEL EM PRODUÇÃO — CONFIRMADO. Rota viva: `src/App.tsx:27` importa e `src/App.tsx:81` chama `fiscalRoutes()`; `src/routes/fiscalRoutes.tsx:10-16` registra `/notas-fiscais` sob `ProtectedRoute`. `src/pages/NotasFiscaisAbas.tsx:333-338` renderiza `<ContingenciaNFe />` e `<SefazMonitor />` sem nenhum flag/gate. Auto-execução ligada por padrão: `src/components/nfe/ContingenciaNFe.tsx:53` `useState(true)` e L59-86 `setInterval(... runAutoContingencyCheck(), autoConfig.checkIntervalSeconds * 1000)`; `src/components/nfe/SefazMonitor.tsx:45` `useState(true)` e L118-123 `performHealthCheck()` imediato + `setInterval(performHealthCheck, ...)`. Intervalo = 30s: `src/lib/sefaz-contingency/constants.ts:108` `checkIntervalSeconds: 30`.

(3) RESULTADO ERRADO ACONTECE — nada protege adiante. `src/components/nfe/SefazMonitor.tsx:106-107`: `if (prevHealth.online && !newHealth.online) addAlert('error', 'SEFAZ ficou indisponível')` — `addAlert` com `showAlerts` default true (L46) chama `toast.error` (L70). Com `Math.random() > 0.1`, ~10% das verificações de 30s sorteiam offline, ou seja um toast falso a cada ~5 min de tela aberta, com a SEFAZ no ar. Também fabricado: L110-111 `addAlert('warning', 'Latência alta detectada: ${newHealth.latency}ms')` e L112-113 `${newHealth.consecutiveFailures} falhas consecutivas de comunicação`; o gráfico/uptime vêm de `healthHistory` alimentado com `latency: newHealth.latency` (L96) e `status: newHealth.online ? 100 : 0` (L98), isto é, inteiros derivados do `setTimeout` aleatório de 300-1000ms. Em `ContingenciaNFe.tsx:98-103`, o botão manual responde `toast[newHealth.online ? 'success' : 'warning']('SEFAZ está online e operacional' | 'SEFAZ está indisponível')` — resposta errada em ~10% dos cliques.
Auto-ativação: confirmada por DOIS caminhos, não um. (a) `src/lib/sefaz-contingency/rules.ts:158-181` `runAutoContingencyCheck` → `checkSefazHealth()` (L163) → `evaluateContingencyRules()` → `activateContingency(..., 'Sistema (Automático)', undefined, true)` (L167-173); regra `rule_failures_3` vem `enabled: true` (`constants.ts:57-66`) e dispara em `rules.ts:110-113` com `health.consecutiveFailures >= 3`. (b) caminho que o achado não citou: `state.ts:46-62` `registerCommunicationFailure` ativa `'offline'` sozinho quando `failureCount >= 3 && mode === 'normal'` — logo a aba Monitor, que chama só `checkSefazHealth`, também ativa contingência. Ao ativar, `ContingenciaNFe.tsx:66-74` grava evento `CONT_AUTO_ATIVADA` e L75-76 mostra `toast.warning('Contingência automática ativada: ...')`. Ressalva honesta de frequência: 3 sorteios negativos seguidos a p=0,1 exigem ~1110 verificações (E=1/p+1/p²+1/p³), ~9h de tela aberta — raro por sessão, mas os toasts e o gráfico falsos são de ~5 em 5 minutos. O evento fabricado é só em memória (`src/lib/sefaz-event-logger.ts:35` `const eventosLog: EventoSefaz[] = []`, comentário "em produção seria um banco de dados"), então não contamina o banco — contamina a aba Histórico da sessão.

(4) TESTE: NÃO EXISTE. `grep -rn "checkSefazHealth" src --include=*.test.ts --include=*.test.tsx e2e` → zero resultados. `src/lib/__tests__/sefaz-contingency-state.test.ts` cobre todos os outros exports de `state.ts` (activate/deactivate/registerCommunicationFailure/addPendingNFe/stats) e pula justamente `checkSefazHealth`. E `src/components/nfe/__tests__/sefaz-sem-protocolo-fabricado.test.tsx:66` ("NF-e nao anuncia ato fiscal que nao aconteceu (F12)") fechou inutilização (:69), cancelamento (:82) e transmissão de pendentes (:92) — e deixou de fora a saúde da SEFAZ. O próprio código documenta a política em `src/components/nfe/InutilizacaoNFe.tsx:74-81` ("a tela RECUSA em vez de inventar protocolo... achado F12, P0") e `src/pages/NotasFiscaisAbas.tsx:131-135` desabilita a consulta com `title="Integração SEFAZ ainda não homologada"`. Este achado é o resíduo não terminado dessa mesma faxina.
```

**Correção mínima (revisada na verificação)**

Aplicar às abas Monitor/Contingência a MESMA regra já usada nas três telas vizinhas: recusar em vez de inventar. (1) `src/lib/sefaz-contingency/state.ts:107-134`: remover os dois `Math.random` e o `setTimeout`; `checkSefazHealth` passa a devolver estado desconhecido/não homologado e NÃO chamar `registerCommunicationFailure()`/`registerCommunicationSuccess()` com resultado fabricado (é isso que ativa contingência sozinho). (2) `src/components/nfe/SefazMonitor.tsx:45` e `src/components/nfe/ContingenciaNFe.tsx:53`: default `false` e desligar os `setInterval` (SefazMonitor.tsx:118-123, ContingenciaNFe.tsx:59-86), substituindo gráfico/uptime por aviso "Integração SEFAZ ainda não homologada" — mesmo texto de `NotasFiscaisAbas.tsx:134`. (3) Botão "Verificar" (`ContingenciaNFe.tsx:95-108`) desabilitado com o mesmo `title`, no padrão `NotasFiscaisAbas.tsx:131-135`. (4) Acrescentar caso em `src/components/nfe/__tests__/sefaz-sem-protocolo-fabricado.test.tsx` provando que nenhum status/latência de SEFAZ é fabricado e que a contingência não é ativada por verificação automática. Não mexer em `activateContingency` manual (emissão já está desligada em `NovaNFeForm.tsx:83`), para manter diff mínimo.

## 16. Conciliação automática do extrato conta e marca como conciliada antes de persistir: transação que falhou sai da fila de revisão e entra no relatório como conciliada

- **Gravidade:** media · **Esforço estimado:** pequeno · **Frente:** falha-silenciosa
- **Onde:** `src/lib/conciliacao-page-helpers.ts:241`

**Cenário de falha**

Importação de um OFX com 30 lançamentos, 10 com match de confiança alta e aceite automático ligado. Se 3 dessas conciliações falharem no `conciliacao-proxy` (erro do servidor/RLS), o relatório de importação ainda exibe "10 conciliadas automaticamente" com o valor somado das 10, as 3 aparecem na lista com selo de conciliada e, por serem de confiança alta, são removidas de `transacoesImportadas` — ou seja, desaparecem da fila de 'pendentes de revisão', cujo contador também já as descontou. No banco elas seguem com `conciliada = false` e os títulos seguem abertos.

**Impacto no negócio**

Entradas bancárias efetivamente não conciliadas saem da fila de trabalho e o relatório de importação informa um volume conciliado maior que o real: títulos a receber/pagar continuam abertos sem ninguém para tratá-los, e a diferença só aparece depois, como divergência de saldo na conciliação.

**Evidência confirmada pelo cético**

```text
src/lib/conciliacao-page-helpers.ts:240-251 — `matchesAlta.push(...)`, `autoConciliadas++`, `valorAutoConciliado += Math.abs(transacao.valor)`, `novasTransacoes[idx].conciliada = true` ANTES do `try` em :254 (`await confirmarConciliacao.mutateAsync({...})`). Catch em :266-300 = console.error + toast.error + insert em webhooks_log (:281, com eslint-disable local/no-floating-supabase-write); zero rollback.
ALCANÇABILIDADE: src/pages/Conciliacao.tsx:105 usa useConciliacaoPage(); :179 passa handleImportSuccess ao diálogo de importação; src/hooks/useConciliacaoPage.ts:179 chama aplicarConciliacoesAutomaticas. A mutação realmente rejeita: src/hooks/useConciliacao.ts:71 `await invokeEdge('conciliacao-proxy', { action: 'confirmar', ... })` e src/lib/edge-function-error.ts:173-178 `throw normalized` (também para erro em corpo 200, :180-187).
SEM CURA DOWNSTREAM: setTransacoes grava em queryKey ['conciliacao','transacoes-banco', selectedBanco] (src/hooks/useConciliacaoPageState.ts:218-229), mas todas as invalidações de useConciliacao.ts (:128, :158, :186, :259) usam ['transacoes-bancarias'] — chave distinta, logo nenhum refetch sobrescreve o estado otimista.
CONSUMO COMO VERDADE: src/hooks/useConciliacaoPage.ts:189 setTransacoes([...novasTransacoes, ...prev]); :190-196 setTransacoesImportadas filtra por confiança 'alta' (não por sucesso da persistência), removendo a falha da fila de revisão; :199 pendentesRevisao = total - autoConciliadas - duplicateCount (com Math.max(0,...) em :212); :207-217 setImportReport({ autoConciliadas, valorAutoConciliado, matchesAlta, ... }).
EXIBIÇÃO: src/components/conciliacao/RelatorioImportacaoDialog.tsx:77 mostra report.autoConciliadas, :105 valorAutoConciliado, :150-157 lista "Conciliadas automaticamente (N)" de matchesAlta.
VAZAMENTO PARA FORA DA TELA (não estava na evidência alegada): src/components/conciliacao/ConciliacaoExport.tsx:115 `status: tx.conciliada ? 'conciliada' : 'pendente'`, :197 e :305 escrevem "Conciliada" no CSV/PDF exportado — a conciliação que falhou sai como conciliada em arquivo de auditoria.
FILA: src/lib/conciliacao-page-helpers.ts:324-326 — aba 'pendentes' filtra `!t.conciliada`, então a falha também desaparece da aba.
TESTE: src/hooks/__tests__/useConciliacaoPage.importacao.test.tsx:137 `it('não marca localmente uma conciliação cuja persistência falhou')` — mocka rejeição em :145 e assere APENAS toast.error (:151-154) e webhooks_log reconciliation.failed (:155-158). Não assere conciliada/autoConciliadas/matchesAlta. Contraste: o teste de aceite desligado (:119) assere `transacoes.find(t=>t.id==='tx-1')?.conciliada === false` (:132-134). Caminho manual respeita a invariante oposta: src/hooks/useConciliacaoPage.ts:234-248.
```

**Correção mínima (revisada na verificação)**

Em src/lib/conciliacao-page-helpers.ts, mover `matchesAlta.push`, `autoConciliadas++`, `valorAutoConciliado +=` e a mutação de `novasTransacoes[idx]` (hoje :240-251) para DEPOIS do `await confirmarConciliacao.mutateAsync(...)` resolver (hoje :255-265), dentro do mesmo `try`; manter o catch como está (toast + log). Como `transacoesImportadas` é filtrado por confiança e não por persistência, a função deve passar a retornar também o conjunto de ids efetivamente persistidos (ou os que falharam) e src/hooks/useConciliacaoPage.ts:190-196 deve filtrar por esse conjunto em vez de `s[0].confianca !== 'alta'`, para que a falha permaneça na fila de revisão. Por fim, reforçar o teste src/hooks/**tests**/useConciliacaoPage.importacao.test.tsx:137 com as asserções que o nome dele já promete: `importReport.autoConciliadas === 0`, `valorAutoConciliado === 0`, `matchesAlta.length === 0`, `transacoes.find(t=>t.id==='tx-1')?.conciliada === false` e a transação ainda presente em `transacoesImportadas`.

## 17. Painel de SLO promete 'primeiro snapshot às 23:55' mas nada invoca calcular-slo-metrics-diario; tabela vazia em produção

- **Gravidade:** media · **Esforço estimado:** pequeno · **Frente:** orfaos
- **Onde:** `src/components/admin/SLOPanel.tsx:99`

**Cenário de falha**

O admin entra em System Health ou no SRE Command Center para ver uptime, latência p95 e taxa de erro dos últimos 30 dias. Vê a mensagem 'O primeiro será gerado às 23:55' e volta no dia seguinte — e no outro, e no outro. A tabela tem 0 linhas desde que a feature foi criada e continuará com 0, porque não há job às 23:55 nem em nenhum outro horário. Os quatro KPIs do painel (uptime médio 30d, p95, taxa de erro, requisições) nunca aparecem.

**Impacto no negócio**

O centro de comando de SRE promete medição de SLO que não existe: não há série histórica de uptime, latência nem taxa de erro para sustentar contrato de nível de serviço ou para detectar degradação. Pior que não ter o painel, porque a mensagem atribui a ausência de dados a uma espera de algumas horas e não a uma feature desligada — o problema nunca é escalado.

**Evidência confirmada pelo cético**

```text
(1) TRECHO — confirmado literalmente. `src/components/admin/SLOPanel.tsx:95-103`: `if (!metrics?.length) { return (<Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum snapshot SLO disponível ainda. O primeiro será gerado às 23:55.</CardContent></Card>); }` — a linha 99 é exatamente a frase alegada.

(2) ALCANÇÁVEL — confirmado. `SLOPanel` é montado em `src/pages/AdminSystemHealth.tsx:256` e `src/pages/admin/SRECommandCenter.tsx:128`; ambas as páginas estão roteadas em `src/routes/adminRoutes.tsx:109-122` (`/admin/system-health`) via lazy em `src/routes/adminPages.ts:11-12`. O hook `src/hooks/useSLOMetrics.ts:26-30` faz `.from('slo_metrics_diarias').select('*').gte('data', since)` com `refetchInterval` de 5 min, e a policy `slo_metrics_admin_select` (`supabase/migrations/20260825230000_initplan_rls_e67.sql:787`) libera SELECT para admin — logo o admin chega ao estado vazio, não a um erro de permissão.

(3) RESULTADO ERRADO — confirmado no banco de produção `bwwbeyolnnzppeuhgkcd`, com duas provas independentes mais fortes que a alegada:
  - `SELECT count(*) FROM public.slo_metrics_diarias` = 0.
  - `pg_stat_user_tables`: `n_tup_ins = 0`, `n_tup_del = 0`, `n_live_tup = 0`, `seq_scan = 10`. Nunca houve UMA inserção — não é caso de retenção de 90 dias ter limpado (`index.ts:80-84`); a tabela é lida (o painel consulta) e nunca escrita.
  - `public.edge_function_logs` para `function_name = 'calcular-slo-metrics-diario'`: 0 linhas, `max(created_at)` NULL. A função nunca executou.
  - `net._http_response` ⨝ `net.http_request_queue` com `url ILIKE '%calcular-slo%'`: 0 chamadas. Nenhum `net.http_post` do banco jamais a invocou.
  - `cron.job` tem 33 jobs; o único cujo command casa `ILIKE '%slo%'` é `capture-slow-queries` → `SELECT public.capture_slow_queries()` (falso positivo: "slow"). Nenhum job com schedule `55 23` (`jobs_2355 = 0`). Comparar com os jobs que de fato chamam edge functions por HTTP (jobid 32 `sefaz-dfe-dispatcher`, 33 `webhook-retry-worker`, 36 `monitorar-erros-frontend`, 44 `monitor-health-check`): nenhum equivalente para SLO.
  - `pg_proc` com `prosrc ILIKE '%slo_metrics_diarias%' OR '%calcular-slo-metrics-diario%'` = 0 linhas: nenhuma função de banco escreve a tabela nem chama a edge.
  - Nenhum workflow do GitHub agenda a função: a única menção em `.github/workflows/` é a lista de deploy em `functions-deploy.yml:25`.
  - A função é a única escritora (`supabase/functions/calcular-slo-metrics-diario/index.ts:63` `.from('slo_metrics_diarias').upsert(...)`) e é fechada por `exigirChamadaInterna(req)` (`index.ts:25-26`), que aceita só service role key ou `x-cron-secret`/`x-internal-secret` (`supabase/functions/_shared/auth-guard.ts:274-291`) — o front, com anon key, não tem como disparar o cálculo.
  Nada mais adiante protege: com `metrics = []`, `resumo` é `null` (`SLOPanel.tsx:69-80`) e o componente retorna cedo na linha 95, antes dos 4 KPIs, do gráfico de 30 dias e do CSV. O usuário vê só a promessa das 23:55, indefinidamente.

(4) TESTE — não existe. Nenhum arquivo de teste/spec/e2e referencia `SLOPanel`, `useSLOMetrics` ou `slo_metrics` (grep em `src/`, `e2e/`, `tests/` = 0 resultados). A única menção da função em teste é `src/lib/__tests__/edge-functions.security.test.ts:46`, que só checa a presença do regex `exigirChamadaInterna\s*\(` no arquivo — valida o guard, não o agendamento nem a existência de dados.

AGRAVANTE (trabalho de IA inacabado documentado como pronto): `.lovable/memory/features/p14-copilot-onboarding-slo.md:9` afirma "Edge `calcular-slo-metrics-diario` (cron 55 23 * * *) → tabela `slo_metrics_diarias`" e `docs/FUNCIONALIDADES_SEM_UI.md:99` registra "Cron 23:55 · 🔵 OK" — o cron nunca foi criado. Auditorias anteriores do próprio repo já tinham marcado a função como órfã (`docs/AUDITORIA_PLANEJADO_X_EXECUTADO_2026-10-12.md:894` "ÓRFÃ … nenhum cron/código chama; nome sugere job diário nunca agendado" e `ESTADO_ATUAL.md:535`), e nada foi feito. Pela `docs/agentes/definicao-de-pronto.md` o critério de integração ponta a ponta não é cumprido: a feature não está pronta, está mentindo para o admin.

RESSALVA: não há nenhum achado meu que enfraqueça a alegação — a única imprecisão do texto original é cosmética (ele cita `SELECT count(*) = 0` como prova; `n_tup_ins = 0` prova mais: nunca escreveu, não é retenção).
```

**Correção mínima (revisada na verificação)**

Migration nova em `supabase/migrations/` (timestamp > max(version)) agendando o job que nunca existiu, copiando o padrão já validado de `supabase/migrations/20261101200000_monitor_health_cron.sql:25-42`: `cron.unschedule` idempotente + `cron.schedule('calcular-slo-metrics-diario','55 23 * * *', $$ SELECT net.http_post(url := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/calcular-slo-metrics-diario', headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(SELECT valor FROM integration_secrets WHERE chave='internal_jobs' LIMIT 1)), body := '{"source":"pg_cron"}'::jsonb); $$)`. O header `x-cron-secret` com a chave default `internal_jobs` é exatamente o que `exigirChamadaInterna` aceita (`supabase/functions/_shared/auth-guard.ts:274-291`), então nada no guard precisa mudar. Pré-requisito: existir `integration_secrets.valor` para `chave='internal_jobs'` antes de aplicar. Como é DDL em produção (pg_cron), a PR fica aberta para o dono (regra 6.6) — não mergear sozinho. A alternativa (trocar o texto do painel) esconde o defeito sem entregar os KPIs e não deve ser usada isolada. Opcional no mesmo escopo: primeira execução manual via `supabase_functions_invoke` com o segredo, para o painel sair de 0 linhas no mesmo dia em vez de esperar 23:55.

# Promo Finance V2 — Plano de Melhorias de Cadastro Fiscal e Resiliência (100 etapas)

**Base:** avaliações de 21/11/2026 dos repositórios `aphonsoar/Receita_Federal_do_Brasil_-_Dados_Publicos_CNPJ` (rejeitado), `DeHor-Labs/mcp-fiscal-brasil@9fefc1c` (6 padrões aproveitáveis) e org `nfe` / NFE.io (decisão de negócio pendente), confrontadas com `adm01-debug/Promo_Finance_V2@aeefe2fe`.
**Escopo:** o que está **fora** do `PLANO_100_ETAPAS_RT_RFB.md` (Reforma Tributária). Este plano cuida de cadastro (CNPJ), consulta de terceiros, resiliência das integrações, chave NF-e, risco de fornecedor e indexadores econômicos. Nenhuma etapa aqui toca motor de IBS/CBS.
**Ordem:** primeiro o que hoje rejeita cadastro válido (Fase 1), depois o que faz a tela cair quando um parceiro falha (Fases 2 e 4), depois o que falta de funcionalidade (Fases 3, 5, 6, 7), por fim decisão de emissor e encerramento.

## Convenções (valem para todas as etapas)

- 1 etapa = 1 branch `claude/<tipo>-<slug>-<AAMMDD-HHMM>` a partir de `main` atualizado = 1 PR. Commit PT-BR com prefixo (`fix:`, `feat:`, `chore:`, `infra:`).
- Checklist de conclusão é critério objetivo; a evidência é o que vai no corpo da PR (saída de comando, arquivo:linha, request real).
- **⚠️ = regra 8** do `docs/agentes/fluxo-git.md` (migration/DDL em produção, CI/workflows, segredos, Dockerfile/stack/Swarm/Traefik, deleção de dado, mudança de arquitetura ou custo, conflito com PR de outro agente): PR fica aberta aguardando o Joaquim. A marcação ⚠️ é um lembrete, não a regra: qualquer etapa que cair em um desses casos durante a execução segue a regra 8 mesmo sem ⚠️. As demais: squash-merge automático com CI verde.
- Gates por PR: `npm run type-check`, `npm run lint`, `vitest run` dos arquivos tocados; edge function → `deno test`; migration → `supabase db lint` + `schema-drift.yml`.
- Nenhuma etapa reescreve módulo inteiro; cada uma é diff mínimo. Nada de "aproveitei e também…".
- Fontes normativas: IN RFB 2.229/2024 (CNPJ alfanumérico, vigência jul/2026); NT SEFAZ 2011.002 (DV da chave de acesso, módulo 11 pesos 2-9); Res. BCB (séries SGS 11 Selic e 433 IPCA; PTAX OData); Lei 9.430/96 art. 61 (multa de mora 0,33%/dia até 20% + juros Selic).
- Origem dos padrões: `[DeHor]` = adaptado de `mcp-fiscal-brasil` (MIT); `[NFE.io]` = da avaliação `AVALIACAO_NFE_IO_GITHUB.md`; sem marca = achado próprio na auditoria do repo.

---

## Fase 0 — Governança (1-5)

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 1 | Registrar as 3 avaliações como ADR | `docs/receitafederal/ADR-005-AVALIACAO-REPOS-TERCEIROS-2026-11-21.md` | [ ] veredito por repo (aphonsoar: não; DeHor: não como runtime, 6 padrões; NFE.io: decisão de negócio) [ ] tabela "padrão × onde entra no nosso código" [ ] link para este plano | PR mergeada |
| 2 | Inventário do estado atual de CNPJ no código | `docs/receitafederal/INVENTARIO_CNPJ_2026-11-21.md` | [ ] `grep -rn "replace(/\\D/g" src/lib/brazilian-validators src/lib/masks* supabase/functions/cnpja-lookup` listado [ ] colunas de CNPJ em `clientes`, `fornecedores`, `empresas`, `cnpja_cache` via `information_schema` (tipo, tamanho, constraints) [ ] onde `useCnpjaLookup` é chamado (hoje: só `OnboardingTributario*`) | doc com saídas de comando |
| 3 | Inventário das integrações externas e sua proteção | `docs/receitafederal/INVENTARIO_INTEGRACOES.md` | [ ] tabela: edge function · parceiro · tem `withRetry` · tem `createCircuitBreaker` · tem `withTimeout` · tem kill-switch [ ] hoje: `bling-proxy` e `asaas-proxy` usam breaker; `cnpja-lookup`, `nfe-vinculo-proxy`, `sefaz-dfe-puxar`, `sefaz-manifestar` não | `grep -rln createCircuitBreaker supabase/functions` |
| 4 | Snapshot de regressão dos validadores atuais | `src/lib/__tests__/brazilian-validators.pre-alfanumerico.test.ts` | [ ] 20 CNPJs numéricos válidos/inválidos + 5 CPFs gravados [ ] marcado `describe.skip` com motivo "baseline histórica" | `vitest run` verde |
| 5 | Feature flag `cnpj_alfanumerico` global com override por empresa (reutiliza tabela de flags da etapa 5 do plano RT) ⚠️ | `supabase/migrations/<ts>_feature_flag_cnpj_alfanumerico.sql`, `src/hooks/useFeatureFlag.ts` | [ ] linha global (`empresa_id IS NULL`) default `false`; linha por empresa sobrepõe [ ] resolução: empresa informada → override ou global; **sem empresa (onboarding, consulta avulsa) → global** [ ] `useFeatureFlag(nome, empresaId?)` aceita `empresaId` opcional [ ] RLS herdada [ ] se a tabela de flags ainda não existir, esta etapa cria (mesma migration do plano RT, não duplicar) | PR aberta p/ Joaquim |

## Fase 1 — CNPJ alfanumérico (6-20) `[DeHor]`

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 6 | `normalizarCNPJ()` preservando letras | `src/lib/brazilian-validators/cnpj.ts` | [ ] remove só `.`, `/`, `-` e espaços; mantém `A-Z`; upper-case [ ] `normalizarCNPJ('12.ABC.345/01DE-35') === '12ABC34501DE35'` | teste unitário |
| 7 | `validateCNPJAlfanumerico()` | mesmo arquivo | [ ] 12 posições `[A-Z0-9]`, 2 DVs numéricos [ ] valor do caractere = `charCode − 48` (`'A'=17 … 'Z'=42`) [ ] pesos `[5,4,3,2,9,8,7,6,5,4,3,2]` e `[6,5,4,3,2,9,8,7,6,5,4,3,2]` [ ] rejeita 14 caracteres iguais | teste com o exemplo da IN RFB 2.229 e 10 casos gerados |
| 8 | `validateCNPJ()` vira dispatcher controlado pela flag, **mantendo retorno booleano** | mesmo arquivo | [ ] assinatura `validateCNPJ(cnpj, { alfanumerico?: boolean } = {})` → `boolean` (default `false`; quem chama passa o valor da flag) [ ] só dígitos → algoritmo atual [ ] com letras e `alfanumerico: true` → alfanumérico [ ] com letras e `alfanumerico: false` → `false` [ ] motivo exposto por função separada `motivoCNPJInvalido(cnpj, opts): 'dv' \| 'formato_nao_habilitado' \| 'tamanho' \| null` — nunca no lugar do booleano, para `documento.ts:4-9` e demais `if (validateCNPJ(...))` continuarem corretos [ ] `replace(/\D/g,'')` removido da entrada | teste com `alfanumerico` true/false; `grep -n "\\D" cnpj.ts` só em `formatCNPJ` legado |
| 9 | `formatCNPJ()` aceita letras | mesmo arquivo | [ ] `12ABC34501DE35` → `12.ABC.345/01DE-35` [ ] `generateCNPJ()` inalterado (continua numérico) | teste |
| 10 | `validateCPFOrCNPJ` / `formatCPFOrCNPJ` | `src/lib/brazilian-validators/documento.ts` | [ ] usa `normalizarCNPJ` antes de decidir 11 × 14 [ ] CPF continua só dígitos | teste |
| 11 | Máscara de input aceita letras | `src/lib/masks*` (`maskCnpjCpf`) | [ ] quando o valor tem letra, aplica máscara CNPJ alfanumérica; não apaga letras [ ] `maxLength` 18 mantido | teste + `tsc` |
| 12 | Edge `cnpja-lookup` e hook `useCnpjaLookup`: parar de apagar letras | `supabase/functions/cnpja-lookup/index.ts:22-30`, `src/hooks/useCnpjaLookup.ts:48` (`cleaned = cnpj.replace(/\D/g,'')`) | [ ] hook e edge usam a normalização da etapa 6 [ ] hook envia `empresa_id` opcional no payload (`OnboardingTributario.tsx:87-96` ainda não tem empresa → omite) [ ] edge valida DV (hoje só checa `length === 14`) e resolve a flag conforme etapa 5: `empresa_id` presente → override/global; ausente → global; desligada → 400 `formato_nao_habilitado` [ ] mensagem PT-BR distinta para "DV inválido" | `deno test` (com e sem `empresa_id`) + teste do hook verificando que o payload enviado contém o CNPJ alfanumérico |
| 13 | Schema zod do payload (executar **junto** com a etapa 12, mesma PR: o schema é `.strict()` em `validation.ts:229-233` e rejeitaria `empresa_id`) | `supabase/functions/_shared/validation.ts` (`CnpjaLookupSchema`) | [ ] `cnpj` regex `^[A-Z0-9.\-/ ]{14,18}$` [ ] `empresa_id: z.string().uuid().optional()` [ ] `force: z.boolean().optional()` (usado na etapa 41) [ ] teste de contrato existente ajustado | `deno test validation_test.ts` |
| 14 | Chamada à CNPJá com CNPJ alfanumérico | `cnpja-lookup/index.ts` (`fetchCnpjaWithRetry`) | [ ] URL monta com o CNPJ normalizado (letras preservadas) [ ] request real a 1 CNPJ alfanumérico de homologação ou documentado "CNPJá não suporta" com a resposta | corpo da PR com status/resposta |
| 15 | Constraints de banco ⚠️ | migration conforme inventário da etapa 2 | [ ] colunas de CNPJ sem `CHECK (cnpj ~ '^\d{14}$')` ou equivalente [ ] `cnpja_cache.cnpj` aceita `[A-Z0-9]{14}` [ ] sem perda de dado | `supabase db lint` + query antes/depois |
| 16 | Payloads para parceiros | `supabase/functions/asaas-proxy/index.ts`, `bling-proxy/index.ts` | [ ] CNPJ enviado ao Asaas/Bling sem `replace(/\D/g,'')` que apague letras [ ] se o parceiro não aceitar alfanumérico, retornar erro claro e registrar em "Próximos passos" | `deno test` + grep |
| 17 | Form de cliente aceita alfanumérico | `src/components/clientes/ClienteFormFields.tsx` | [ ] validação do campo usa `validateCPFOrCNPJ` novo [ ] mensagem de erro PT-BR | E2E `clientes` |
| 18 | Form de fornecedor aceita alfanumérico | `src/components/fornecedores/form/FornecedorDadosBasicos.tsx` | [ ] idem | E2E `fornecedores` |
| 19 | Form de empresa aceita alfanumérico | `src/components/empresas/EmpresaForm.tsx` | [ ] idem [ ] `MatrizCNPJBanco.tsx` e `ConsolidacaoMultiCNPJ.tsx` não quebram com letras | E2E |
| 20 | Remover snapshot pré-alfanumérico (etapa 4) | `brazilian-validators.pre-alfanumerico.test.ts` | [ ] apagado após Fase 1 verde | diff |

## Fase 2 — Cadeia de provedores de CNPJ (21-32) `[DeHor]`

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 21 | Extrair provedor CNPJá para módulo | `supabase/functions/_shared/cnpj/provedor-cnpja.ts` | [ ] `consultarCnpja(cnpj, apiKey): Promise<CnpjNormalizado>` [ ] `fetchCnpjaWithRetry` movido sem mudança de comportamento | `deno test` + diff só move |
| 22 | Tipo `CnpjNormalizado` único | `_shared/cnpj/types.ts` | [ ] campos atuais do `normalized` + `origem: 'cnpja' \| 'brasilapi' \| 'receitaws'` + `consultadoEm` | `tsc` |
| 23 | Provedor BrasilAPI | `_shared/cnpj/provedor-brasilapi.ts` | [ ] `GET https://brasilapi.com.br/api/cnpj/v1/{cnpj}` [ ] mapeia `razao_social`, `descricao_situacao_cadastral`, `cnae_fiscal`, `cnaes_secundarios`, `opcao_pelo_simples`, `opcao_pelo_mei`, endereço [ ] timeout 10 s | fixture JSON + teste |
| 24 | Provedor ReceitaWS (último recurso) | `_shared/cnpj/provedor-receitaws.ts` | [ ] `GET https://receitaws.com.br/v1/cnpj/{cnpj}` [ ] **pula quando CNPJ tem letras** (sem suporte documentado) [ ] respeita 3 req/min | teste: alfanumérico → não chamado |
| 25 | Orquestrador de cadeia | `_shared/cnpj/consultar.ts` | [ ] ordem: CNPJá (se `CNPJA_API_KEY`) → BrasilAPI → ReceitaWS [ ] cada falha logada com `provider` e `error_message` [ ] erro final agrega as 3 causas | teste: CNPJá 429 → BrasilAPI 200 |
| 26 | `cnpja-lookup` usa o orquestrador | `cnpja-lookup/index.ts` | [ ] diff remove a chamada direta e chama `consultar()` [ ] resposta ganha `origem` | request real |
| 27 | Rate limit só conta chamada paga | `cnpja-lookup/index.ts`, `cnpja_check_rate_limit` | [ ] contador incrementa só quando a CNPJá é efetivamente chamada [ ] fallback grátis não consome cota do usuário | teste |
| 28 | Cache registra origem | migration ⚠️ `cnpja_cache.origem text` | [ ] backfill `'cnpja'` [ ] TTL por origem: CNPJá 30 d, BrasilAPI 7 d (dados D-1 do dump RFB) | lint + query |
| 29 | Kill-switch por provedor | `_shared/resilience.ts` (`integracaoDesativada`) | [ ] `INTEGRACOES_DESATIVADAS=cnpja` pula direto para BrasilAPI | teste |
| 30 | Hook mostra origem | `src/hooks/useCnpjaLookup.ts` | [ ] toast nomeia o provedor que respondeu: `cnpja` → "CNPJá", `brasilapi` → "BrasilAPI (gratuito)", `receitaws` → "ReceitaWS (gratuito)" — mapa por valor, sem `!== 'cnpja'` [ ] tipo `CnpjaData.origem` | `tsc` + teste dos 3 valores |
| 31 | Métrica de fallback | `_shared/edge-observability.ts` + `slo_metrics` | [ ] evento `cnpj_fallback_used` com `from`/`to` [ ] painel `CatalogosTributariosHealthPanel` ou telemetria existente mostra % por origem nos últimos 7 d | linha em `slo_metrics` |
| 32 | Renomear edge function? **Não.** | — | [ ] decisão registrada: manter nome `cnpja-lookup` para não quebrar clientes; README da função explica a cadeia | `supabase/functions/cnpja-lookup/README.md` |

## Fase 3 — Lookup de CNPJ nos cadastros (33-42)

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 33 | Componente `BotaoBuscarCnpj` | `src/components/shared/BotaoBuscarCnpj.tsx` | [ ] recebe `cnpj`, `onResultado(CnpjaData)` [ ] estados loading/erro/429 [ ] desabilitado se CNPJ inválido | teste de componente |
| 34 | Mapeador `CnpjaData → campos de cliente` | `src/lib/cadastro/mapear-cnpj-cliente.ts` | [ ] razão social, nome fantasia, endereço (logradouro, número, complemento, bairro, cidade, UF, CEP), regime | teste |
| 35 | Mapeador `CnpjaData → campos de fornecedor` | `src/lib/cadastro/mapear-cnpj-fornecedor.ts` | [ ] idem + `situacaoCadastral`, `cnaePrincipal` | teste |
| 36 | Botão no form de cliente | `src/components/clientes/ClienteFormFields.tsx` | [ ] ao lado do campo CNPJ/CPF, só quando 14 caracteres [ ] preenche campos vazios, **não sobrescreve** preenchidos sem confirmação | E2E `clientes` |
| 37 | Botão no form de fornecedor | `src/components/fornecedores/form/FornecedorDadosBasicos.tsx` + `FornecedorContatoEndereco.tsx` | [ ] idem [ ] endereço preenchido na aba de contato | E2E `fornecedores` |
| 38 | Badge de situação cadastral | `src/components/shared/SituacaoCadastralBadge.tsx` | [ ] ATIVA verde; SUSPENSA/INAPTA laranja; BAIXADA/NULA vermelho [ ] tooltip com data da consulta e origem | screenshot E2E |
| 39 | Badge na lista de fornecedores | `src/pages/fornecedores/FornecedoresTableRow.tsx` | [ ] lê de `cnpja_cache` via join ou campo denormalizado (decidir na etapa 68) | E2E |
| 40 | Badge no detalhe do cliente | `src/components/clientes/ClienteDetailDialog.tsx` | [ ] idem | E2E |
| 41 | Reconsulta manual (ponta a ponta) | `BotaoBuscarCnpj.tsx`, `src/hooks/useCnpjaLookup.ts`, `supabase/functions/cnpja-lookup/index.ts` | [ ] botão "Atualizar" chama o hook com `{ force: true }` [ ] hook repassa `force` no body [ ] edge: `force === true` pula a leitura de `cnpja_cache`, **mantém** o rate limit e sobrescreve o cache ao gravar | request real com `cached:false`; teste da edge: `force` → provedor chamado mesmo com cache válido |
| 42 | Onboarding tributário usa o componente | `src/pages/tributario/OnboardingTributario.parts.tsx` | [ ] substitui chamada direta ao hook pelo componente; comportamento igual | E2E `onboarding` |

## Fase 4 — Resiliência das integrações (43-54) `[DeHor]`

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 43 | Circuit breaker com janela deslizante | `supabase/functions/_shared/resilience.ts` (`CircuitBreaker`) | [ ] falhas contadas em janela de 60 s (hoje: contador sem janela) [ ] `cooldown` configurável (padrão 120 s; hoje fixo 30 s) [ ] HALF_OPEN permite **1** tentativa; sucesso → CLOSED, falha → OPEN | `deno test resilience_test.ts` |
| 44 | Falha de negócio não abre circuito | mesmo | [ ] 4xx exceto 429 não conta como falha [ ] 429, 5xx, timeout, erro de rede contam | teste |
| 45 | Estado do breaker persistido entre isolates ⚠️ | migration `integracao_circuit_state (servico pk, status, open_until, failures_json)` | [ ] leitura no início da request, escrita no fim; falha de leitura → assume CLOSED [ ] RLS service_role | lint + teste |
| 46 | Breaker em `cnpja-lookup` por provedor | `_shared/cnpj/consultar.ts` | [ ] um breaker por provedor (`cnpja`, `brasilapi`, `receitaws`) [ ] breaker OPEN → pula provedor sem rede | teste: 5 falhas → próximo provedor em < 5 ms |
| 47 | Breaker em `nfe-vinculo-proxy` | `supabase/functions/nfe-vinculo-proxy/index.ts` | [ ] envolve chamada externa [ ] 503 com `Retry-After` quando OPEN | `deno test index_test.ts` |
| 48 | Breaker em `sefaz-dfe-puxar` por UF/ambiente | `supabase/functions/sefaz-dfe-puxar/index.ts` | [ ] chave `sefaz:{uf}:{ambiente}` [ ] OPEN não derruba as outras UFs | teste com `soap-mock` |
| 49 | Breaker em `sefaz-manifestar` | `supabase/functions/sefaz-manifestar/index.ts` | [ ] idem | teste |
| 50 | Timeout padronizado | `_shared/resilience.ts` (`withTimeout`) | [ ] todas as funções da etapa 3 passam `signal` do `withTimeout` ao `fetch` [ ] padrão 10 s, SEFAZ 30 s | grep: `fetch(` sem `signal` = 0 nessas funções |
| 51 | Resposta padronizada de indisponibilidade | `_shared/erros.ts` | [ ] `{ error: 'integracao_indisponivel', servico, retry_after_s }` [ ] usado por breaker OPEN e kill-switch | teste de contrato |
| 52 | UI trata `integracao_indisponivel` | `src/lib/api-errors.ts` (ou equivalente existente), hooks `useCnpjaLookup`, `useBlingNFe`, `useNfeRecebidas` | [ ] toast "Serviço X indisponível, tente em N s" [ ] sem erro genérico 500 na tela | E2E com mock 503 |
| 53 | Health agregado das integrações | `supabase/functions/integracoes-health/index.ts` + cron ⚠️ | [ ] lê `integracao_circuit_state` [ ] grava em `slo_metrics` [ ] alerta após 2 ciclos OPEN | linha em `slo_metrics` |
| 54 | Painel de integrações | `src/components/admin/telemetry/IntegracoesHealthPanel.tsx` | [ ] estado por serviço (CLOSED/OPEN/HALF_OPEN), falhas na janela, próximo probe | screenshot |

## Fase 5 — Chave de acesso NF-e (55-64) `[DeHor]`

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 55 | Validador de DV da chave | `src/lib/nfe/chave-acesso.ts` | [ ] 44 dígitos [ ] módulo 11, pesos 2-9 da direita para a esquerda (NT 2011.002) [ ] resto 0 ou 1 → DV 0 | teste com 10 chaves reais anonimizadas |
| 56 | Decomposição da chave | mesmo | [ ] `cUF(2) AAMM(4) CNPJ(14) mod(2) serie(3) nNF(9) tpEmis(1) cNF(8) cDV(1)` [ ] `cUF` → sigla via `brazilian-validators/estados.ts` [ ] modelo 55/65/57 | teste |
| 57 | Espelho para Deno | `supabase/functions/_shared/nfe/chave-acesso.ts` | [ ] mesmo algoritmo; teste de paridade com 50 chaves geradas | `deno test` |
| 58 | Importação de XML valida chave | `src/hooks/useImportacaoXMLNFe.ts` | [ ] chave do `infNFe@Id` validada; DV inválido → erro antes de gravar [ ] CNPJ da chave = CNPJ do `emit` ou aviso | teste `useImportacaoXMLNFe.*.test.tsx` |
| 59 | NF-e recebidas valida chave | `src/hooks/useNfeRecebidas.ts` | [ ] chave digitada/colada validada antes de consultar | teste |
| 60 | `nfe-vinculo-proxy` valida chave | `supabase/functions/nfe-vinculo-proxy/index.ts` | [ ] 400 PT-BR para DV inválido antes de chamar fora | `deno test` |
| 61 | `sefaz-dfe-puxar` valida chaves recebidas | `sefaz-dfe-puxar/index.ts` + `_shared/sefaz/parser.ts` | [ ] `resNFe`/`procNFe` com chave inválida → log `chave_invalida` e descarte, não exceção | teste com fixture alterada |
| 62 | Campo de chave na UI com validação inline | componente de input de chave usado em `ImportacaoXMLPanel.tsx` e vínculo | [ ] formata em grupos de 4 [ ] mostra UF/emitente/número decodificados ao validar | E2E |
| 63 | Constraint de chave no banco ⚠️ | migration `notas_fiscais.chave_acesso CHECK (chave_acesso ~ '^\d{44}$')` (se ainda não existir) | [ ] inventário prévio: 0 linhas violando | query antes/depois |
| 64 | SPED C100 usa a chave validada | `src/lib/sped-generator/*` onde C100 é montado | [ ] chave inválida bloqueia geração com linha/motivo | teste `sped-generator.test.ts` |

## Fase 6 — Score de risco de fornecedor (65-78) `[DeHor]`

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 65 | Catálogo de achados | `src/lib/fornecedores/risco/achados.ts` | [ ] **um único achado por situação cadastral**, mutuamente exclusivos: `BAIXADA/NULA` (crítico), `SUSPENSA/INAPTA` (alto), qualquer outra ≠ ATIVA (médio) — sem regra genérica "≠ ATIVA" sobreposta [ ] demais achados independentes: abertura < 6 meses (médio), MEI em compra > R$ X (médio), CNAE sem relação com brindes/gráfica/logística (baixo), sem dado de Simples (info) [ ] cada achado com `severidade`, `titulo`, `fundamento` | teste: empresa BAIXADA gera exatamente 1 achado de situação (score 60, não 20) |
| 66 | Função pura de score | `src/lib/fornecedores/risco/score.ts` | [ ] base 100; crítico −40, alto −15, médio −5 [ ] clamp 0-100 [ ] faixas: ≥80 aprovar · 60-79 ressalvas · 30-59 investigar · <30 recusar [ ] **teto por situação cadastral**, aplicado depois do score: `BAIXADA/NULA` → faixa máxima `recusar`; `SUSPENSA/INAPTA` → faixa máxima `investigar`; outra ≠ ATIVA → faixa máxima `ressalvas` (decisão: cadastro irregular nunca cai em `aprovar`, mesmo sem outros achados) | teste de propriedade: monotônico; teste: INAPTA sem outros achados → score 85, faixa `investigar` |
| 67 | Lista de CNAEs "compatíveis" configurável | `src/config/fornecedores-cnae-compativeis.ts` | [ ] prefixos CNAE de brindes, gráfica, têxtil, embalagem, transporte [ ] override por env/flag | teste |
| 68 | Colunas de risco no fornecedor ⚠️ | migration `fornecedores.risco_score int, risco_faixa text, risco_avaliado_em timestamptz, risco_achados jsonb` | [ ] nullable [ ] RLS existente cobre | lint |
| 69 | Hook `useRiscoFornecedor` | `src/hooks/useRiscoFornecedor.ts` | [ ] usa `cnpja_cache` + score puro [ ] grava colunas da etapa 68 | teste |
| 70 | Score no form de fornecedor | `FornecedorDadosBasicos.tsx` | [ ] após lookup (etapa 37) mostra faixa + achados [ ] `recusar` exige confirmação para salvar (não bloqueia) | E2E |
| 71 | Coluna de risco na lista | `FornecedoresTableRow.tsx`, `FornecedoresFiltersPanel.tsx` | [ ] badge por faixa [ ] filtro por faixa | E2E |
| 72 | KPI de carteira | `src/components/fornecedores/FornecedoresKPIs.tsx` | [ ] % por faixa; contagem "não avaliado" | E2E |
| 73 | Reavaliação em lote | `supabase/functions/fornecedores-reavaliar-risco/index.ts` | [ ] percorre fornecedores com `risco_avaliado_em` > 30 d ou null [ ] concorrência 4 [ ] respeita rate limit/cadeia da Fase 2 | log: N avaliados, 0 erros |
| 74 | Cron mensal da reavaliação ⚠️ | `supabase/migrations/<ts>_cron_reavaliar_risco.sql` + `expected-crons` baseline | [ ] dia 1, 03:00 BRT [ ] baseline de crons atualizado (PR #489 define o padrão) | PR aberta p/ Joaquim |
| 75 | Alerta de mudança de situação | `supabase/functions/gerar-alertas-tributarios/index.ts` (regra nova) | [ ] fornecedor ATIVA → não-ATIVA entre avaliações → alerta alto | fixture |
| 76 | Bloqueio opcional em contas a pagar | `src/components/contas-pagar/*Form*` (onde o fornecedor é escolhido) | [ ] aviso inline se fornecedor `recusar`; flag por empresa decide se bloqueia | E2E |
| 77 | Score de cliente reaproveita achados cadastrais | `src/hooks/useScoringClientes.ts`, `src/lib/fornecedores/risco/achados.ts` → mover para `src/lib/cadastro/risco/` | [ ] achados de situação cadastral entram como fator no scoring de clientes existente, com peso configurável [ ] nenhum teste atual de scoring quebra | `vitest run scoring` |
| 78 | Relatório PDF de due diligence | `supabase/functions/gerar-pdf-tributario/index.ts` (template novo) | [ ] 1 página: dados cadastrais, achados, score, origem e data da consulta | PDF gerado |

## Fase 7 — Indexadores BCB e correção monetária (79-90) `[DeHor]`

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 79 | Edge function `bcb-indexadores` | `supabase/functions/bcb-indexadores/index.ts` | [ ] rotas: `selic?inicio&fim` (SGS 11), `ipca?inicio&fim` (SGS 433), `ptax?data&moeda` (OData `CotacaoMoedaDia`) [ ] auth `exigirInternaOuUsuario` [ ] `withRetry` + `withTimeout` + breaker `bcb` | `deno test` + request real |
| 80 | Parser SGS | `_shared/bcb/sgs.ts` | [ ] datas `dd/MM/yyyy` → ISO; `valor` com vírgula → número; ignora linhas vazias | teste com fixture real |
| 81 | Tabela de cache ⚠️ | migration `indexadores_bcb (serie text, data date, valor numeric, pk(serie,data))` | [ ] RLS leitura authenticated, escrita service_role | lint |
| 82 | Sync diário ⚠️ | cron 06:30 BRT chamando `bcb-indexadores?sync=1` | [ ] upsert dos últimos 60 dias [ ] idempotente | log: linhas upsert |
| 83 | Fator acumulado | `src/lib/financeiro/correcao-monetaria.ts` | [ ] `fator = Π(1 + taxa/100)` sobre a série do período [ ] IPCA mensal × Selic diária tratados corretamente (Selic diária já é fator diário) [ ] arredondamento 8 casas no fator, 2 no valor | teste com período conhecido (ex.: jan-dez/2025 IPCA oficial) |
| 84 | Multa e juros de tributo em atraso | `src/lib/tributario/atraso.ts` | [ ] multa 0,33%/dia até 20% (Lei 9.430 art. 61) [ ] juros = Selic acumulada do mês seguinte ao vencimento até o mês anterior ao pagamento + 1% no mês do pagamento [ ] fonte normativa no retorno | teste com exemplo da RFB |
| 85 | Hook `useIndexadores` | `src/hooks/useIndexadores.ts` | [ ] lê `indexadores_bcb`; fallback para a edge function se faltar período | teste |
| 86 | Contas a receber vencidas: valor atualizado | `src/components/contas-receber/row/*` + `ContaReceberDetail*` | [ ] coluna "Atualizado (IPCA/Selic)" opcional, índice escolhido por empresa | E2E |
| 87 | Calendário tributário: multa+juros estimados | `src/lib/tributario/obrigacoes/*`, painel de obrigações vencidas | [ ] mostra custo do atraso por obrigação vencida | E2E |
| 88 | PTAX em notas/compras em moeda estrangeira | `src/hooks/useImportacaoXMLNFe.ts` (quando `moeda != BRL` em DI) ou cadastro de compra internacional | [ ] converte pela PTAX venda da data [ ] origem BCB registrada | teste |
| 89 | Painel de indexadores | `src/components/admin/telemetry/IndexadoresPanel.tsx` | [ ] última data por série, idade do sync, alerta > 3 dias úteis | screenshot |
| 90 | Simulador de cenários usa IPCA real | `SimuladorCenariosTributarios.tsx` | [ ] inflação do cenário default = IPCA 12 m real (selo "BCB") em vez de constante | E2E |

## Fase 8 — Emissor de NF-e: decisão e correções (91-95) `[NFE.io]`

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 91 | ADR Bling × NFE.io × Focus ⚠️ (custo) | `docs/receitafederal/ADR-006-EMISSOR-NFE.md` | [ ] pergunta de negócio: "a Promo Brindes emite pelo Bling hoje?" [ ] custo mensal de cada opção [ ] decisão do Joaquim registrada | ADR aprovado |
| 92 | Corrigir C14N na manifestação | `supabase/functions/_shared/sefaz/manifestacao.ts:108-121` | [ ] DigestValue sobre `infEvento` canonicalizado (C14N 1.0 com `xmlns` herdado) [ ] teste compara com digest de evento real autorizado | `deno test manifestacao_test.ts` |
| 93 | `bling_tokens` em produção: verificar e documentar | `docs/receitafederal/ESTADO_BLING.md` | [ ] contagem real via SQL [ ] se 0: passo a passo do OAuth (já codificado) | saída da query |
| 94 | Se Bling: ativar OAuth e teste em homologação | `useBlingNFe.ts`, `bling-proxy` | [ ] 1 NF-e em homologação autorizada [ ] XML guardado em `xml-storage.ts` | protocolo |
| 95 | Se NFE.io: `nfeio-proxy` + webhook ⚠️ (segredo) | `supabase/functions/nfeio-proxy/index.ts`, `nfeio-webhook/index.ts` | [ ] payload v3 com `IBSCBS.calculationMode='OfficialService'` [ ] webhook com `webhook-auth.ts` [ ] stubs `sefaz-simulator` desligados | request real em sandbox |

## Fase 9 — Qualidade e encerramento (96-100)

| # | Etapa | Arquivos | Checklist de conclusão | Evidência |
|---|---|---|---|---|
| 96 | E2E: cadastro de fornecedor com CNPJ alfanumérico → lookup → score | `e2e/fornecedor-cnpj-alfanumerico.e2e.ts` | [ ] Playwright verde em CI [ ] usuário E2E padrão | run |
| 97 | Chaos: CNPJá fora | `e2e/cnpj-fallback.e2e.ts` | [ ] mock 503 → BrasilAPI → cadastro conclui com toast de origem | run |
| 98 | Runbook | `docs/RUNBOOK.md` seções "Integrações (breaker/kill-switch)", "Provedores de CNPJ", "Indexadores BCB" | [ ] como abrir/fechar circuito manualmente, trocar provedor, forçar sync | doc |
| 99 | Ligar flag `cnpj_alfanumerico` em produção ⚠️ | update na tabela de flags | [ ] 1 semana sem erro de validação em `console-persist` [ ] rollback = flag off | query + log |
| 100 | Encerramento | `CHANGELOG.md`, `docs/receitafederal/README.md`, ADR-005 | [ ] cada padrão `[DeHor]` marcado "implementado em PR #" [ ] branches órfãs apagadas | `gh pr list` limpo |

---

## Dependências entre fases

```
0 → 1 → 2 → 3 → 6
     └→ 4 (43-45, 47-54 só precisam de 0; a etapa 46 depende da 25)
     └→ 5 (independente)
     └→ 7 (independente)
8 depende só da decisão do Joaquim (etapa 91)
9 fecha tudo
```
Paralelismo: fases podem andar em paralelo **exceto** nos pares abaixo, que compartilham arquivo e por isso seguem a regra 3 do `docs/agentes/fluxo-git.md` (PR aberta tocando o mesmo arquivo → parar e avisar; **a segunda etapa só começa depois da primeira mergeada** — rebase não substitui a espera): `nfe-vinculo-proxy/index.ts` (47 → 60), `sefaz-dfe-puxar/index.ts` (48 → 61), `useImportacaoXMLNFe.ts` (58 → 88), `useNfeRecebidas.ts` (59 → 52), `useCnpjaLookup.ts` (12 → 30 → 52), `cnpja-lookup/index.ts` (12+13 → 14 → 26 → 27), `_shared/resilience.ts` (29 → 43 → 44 → 50). Antes de **iniciar** qualquer etapa (não só antes de abrir a PR), o agente consulta os arquivos das PRs abertas via `github_graphql` (`pullRequests(states: OPEN) { files { path } }`), conforme `docs/agentes/fluxo-git.md:14-19`; se algum arquivo da etapa aparecer, para e avisa. Fase 3 depende de 1 e 2; Fase 6 depende de 3; etapa 46 só começa depois da 25 mergeada.

## Riscos registrados

| Risco | Mitigação |
|---|---|
| CNPJá não aceitar CNPJ alfanumérico | etapa 14 documenta; cadeia da Fase 2 cai para BrasilAPI, que aceita |
| BrasilAPI (dump RFB) atrasada D-1/D-30 | TTL menor (etapa 28) + badge de origem (etapa 30) |
| Breaker em memória reabre a cada isolate | etapa 45 persiste estado |
| Lista de CNAEs "compatíveis" gerar falso positivo | severidade baixa (etapa 65) e override configurável (etapa 67) |
| Série SGS do BCB fora do ar | cache em tabela (etapa 81) + breaker `bcb` |
| Decisão de emissor atrasar | Fases 1-7 não dependem dela |

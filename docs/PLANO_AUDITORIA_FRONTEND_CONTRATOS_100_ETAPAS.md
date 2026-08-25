# Auditoria Front-End e Contratos — Plano de 100 Etapas

Data: 25/08/2026\
Escopo auditado: React/Vite, UI/UX, acessibilidade, SEO, performance, segurança,
integrações, 102 Supabase Edge Functions e webhooks.\
Método: revisão documental, inspeção estática, grafo de dependências e pareceres
paralelos de cinco especialistas.

## Resumo executivo

O projeto tem boa base técnica, mas a documentação superestima a uniformidade
atual. Existem 102 Edge Functions, enquanto o catálogo registra 87. Das funções
que consomem body, a maioria usa Zod, porém coexistiam dois helpers
compartilhados, `safeParse` inline, erros 400/422 incompatíveis e somente uma
pequena fração de testes de contrato no CI.

Esta entrega implementa a fundação: erro 422 canônico
`{ code, message, fields }`, campos Zod normalizados, compatibilidade v1 por
padrão, opt-in v2 nos quatro webhooks principais, schemas v2, casos ausente/tipo
incorreto/vazio e um gate que impede Edge Function com body sem validação. O
rollout completo permanece organizado abaixo; itens concluídos nesta entrega
estão marcados.

## Problemas críticos priorizados

| Prioridade | Problema                            | Impacto                                                      | Evidência principal                                                                          | Ação                                      |
| ---------- | ----------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ----------------------------------------- |
| P0         | Erros de contrato divergentes       | Clientes não conseguem tratar falhas de forma determinística | `_shared/validation.ts` e `_shared/contract-validator.ts` respondiam 400 e shapes diferentes | Helper único 422 e migração progressiva   |
| P0         | Cobertura comportamental incompleta | Falso verde: presença de Zod sem garantir resposta HTTP      | 102 handlers; poucos testes locais e CI Deno com lista fixa                                  | Gate de cobertura + testes parametrizados |
| P0         | Webhook Bling sem prova de origem   | Spoofing com escrita via service role                        | `bling-webhook/index.ts` só aplica rate limit e schema                                       | HMAC/token fail-closed antes do parse     |
| P0         | Jobs internos expostos              | Invocação não autorizada de rotinas privilegiadas            | funções cron/service-role sem guard uniforme                                                 | `auth-guard`/`x-cron-secret` obrigatório  |
| P1         | Sem versionamento contratual real   | Mudanças podem quebrar provedores externos                   | inexistência de `x-contract-version` e testes v1/v2                                          | coexistência v1/v2 e política de sunset   |
| P1         | Replay/idempotência heterogêneos    | Duplicidade, corrida e efeitos financeiros repetidos         | apenas Asaas usa claim transacional completo                                                 | pipeline claim/success/failure/DLQ comum  |
| P1         | Acessibilidade do shell             | Navegação por teclado/leitor de tela quebrada                | skip links duplicados, alvo ausente, botões sem nome                                         | corrigir landmarks, foco e testes axe     |
| P1         | SEO com marca/domínio incorretos    | Compartilhamento e indexação incorretos                      | `index.html` referencia PromoBrindes/Lovable                                                 | metadados globais e por rota              |
| P1         | Prefetch inoperante e silencioso    | custo sem aquecimento real do cache                          | `prefetchQuery` sem `queryFn`, erros engolidos                                               | corrigir/remover e instrumentar           |
| P2         | Subscriptions recriadas por rota    | churn de canais e listeners                                  | `MainLayout` montado em dezenas de páginas                                                   | elevar providers para shell persistente   |

## Riscos de rollout

- Alterar 400 para 422 pode afetar consumidores que codificaram o status legado;
  por isso v1 fica aceito e marcado como depreciado.
- Autenticar o Bling sem provisionar segredo antes causará indisponibilidade
  fail-closed; o segredo e o smoke test devem anteceder o deploy.
- Schemas `.strict()` podem rejeitar campos novos enviados por provedores;
  fixtures reais anonimizadas devem integrar a suíte.
- O grafo encontrou 218 arestas pendentes e 15 colapsos de relação; todo achado
  do grafo foi tratado como pista e confirmado no código.
- Código no repositório não equivale a pronto: a conclusão exige deploy, tráfego
  real, métricas e janela de observação.

## Plano de 100 etapas

### Contratos e webhooks (1–20)

-
  1. [ ] Inventariar todos os pontos de entrada HTTP; aceite: 100% dos
         `index.ts` classificados. P0.
-
  2. [ ] Conciliar contagem real e catálogos; aceite: documentação registra 102
         funções ou a contagem vigente. P0.
-
  3. [ ] Mapear helper e schema de cada endpoint; aceite: nenhuma célula sem
         classificação. P0.
-
  4. [ ] Catalogar status e shape atual por falha; aceite: 400/401/403/422/500
         diferenciados. P0.
-
  5. [x] Definir erro canônico `{ code, message, fields }`; aceite: helper
         compartilhado implementado. P0.
-
  6. [x] Normalizar issues Zod em `path/message/code`; aceite: testes de raiz e
         campos passam. P0.
-
  7. [x] Fazer os dois validadores compartilhados emitirem o mesmo 422; aceite:
         ambos delegam ao helper canônico. P0.
-
  8. [ ] Fechar primeira onda nos seis ingressos externos; aceite: Asaas,
         Bitrix, Bling, WhatsApp e n8n cobertos. P0.
-
  9. [ ] Garantir autenticação antes da validação; aceite: credencial inválida
         nunca revela schema. P0.
-
  10. [x] Cobrir ausente, tipo incorreto e vazio; aceite: matriz automatizada
          verde. P0.
-
  11. [ ] Converter schema-only em teste HTTP real; aceite: status e body
          verificados por webhook. P0.
-
  12. [x] Atualizar contratos de Conciliacao e NFe para 422; aceite: asserts
          legados removidos. P1.
-
  13. [ ] Separar 422 de schema e regras de negócio; aceite: taxonomia
          documentada. P1.
-
  14. [x] Definir `x-contract-version`, default v1 e suporte v2; aceite: helper
          publicado. P1.
-
  15. [x] Testar v1, v2 e versão não suportada; aceite: retrocompatibilidade
          automatizada. P1.
-
  16. [ ] Corrigir baseline do healthcheck; aceite: auth/status refletem
          runtime. P1.
-
  17. [ ] Cruzar contrato com prova de origem; aceite: nenhum webhook público
          sem credencial. P1.
-
  18. [x] Definir “sem endpoint sem validação”; aceite: gate inspeciona todo
          consumidor de body. P1.
-
  19. [x] Integrar gates de contrato ao workflow Deno; aceite: CI executa novos
          testes. P1.
-
  20. [ ] Publicar conformidade endpoint a endpoint; aceite: percentual
          calculado sobre inventário real. P0.

### Edge Functions e Zod (21–40)

-
  21. [ ] Classificar as 102 funções por exposição; aceite:
          webhook/JWT/cron/utilitária marcados. P0.
-
  22. [ ] Mapear body, texto, query e headers; aceite: todas as entradas
          registradas. P0.
-
  23. [ ] Consolidar uso de `validatePayload`, `validateContract` e inline;
          aceite: matriz única. P0.
-
  24. [ ] Remover imports Zod divergentes; aceite: apenas `_shared/zod.ts`
          fornece Zod. P1.
-
  25. [x] Eliminar consumers de body sem validação detectável; aceite: gate
          verde. P0.
-
  26. [ ] Mapear autenticação de cada webhook; aceite: evidência por
          arquivo/linha. P0.
-
  27. [ ] Auditar todo uso de service role; aceite: guard obrigatório ou exceção
          justificada. P0.
-
  28. [ ] Padronizar respostas manuais de `safeParse`; aceite: todas usam
          helper 422. P0.
-
  29. [ ] Separar falha sintática JSON (400) de schema (422); aceite: testes
          para ambas. P0.
-
  30. [ ] Validar body, query e headers relevantes; aceite: checklist completo
          por endpoint. P1.
-
  31. [ ] Catalogar testes existentes; aceite: fluxo feliz/auth/contrato
          identificados. P1.
-
  32. [ ] Criar backlog dos endpoints sem teste local; aceite: owner e
          prioridade definidos. P1.
-
  33. [ ] Completar matriz válido/ausente/tipo/vazio; aceite: quatro cenários
          por contrato. P0.
-
  34. [ ] Migrar autenticação manual para guards comuns; aceite: exceções
          documentadas. P1.
-
  35. [ ] Contratar query/header em endpoints sem body; aceite: entradas
          administrativas validadas. P1.
-
  36. [x] Selecionar webhooks candidatos a v1/v2; aceite: quatro webhooks
          principais integrados. P1.
-
  37. [x] Definir diferença v2 por identificador de evento obrigatório; aceite:
          schemas separados. P1.
-
  38. [ ] Migrar schemas em ondas por risco; aceite: nenhuma regressão de
          consumidores. P1.
-
  39. [ ] Executar lotes webhook → service role → negócio; aceite: gates verdes
          por lote. P1.
-
  40. [ ] Fechar matriz schema/422/teste/versão; aceite: 100% das funções
          classificadas. P0.

### Front-end, UX, a11y, SEO e performance (41–60)

-
  41. [ ] Remover `SkipLinks` duplicado; aceite: um conjunto no tab order. P1.
-
  42. [ ] Corrigir alvo `#main-nav`; aceite: destino existe e recebe foco. P1.
-
  43. [ ] Adicionar landmark navegacional; aceite: axe reconhece nome e região.
          P1.
-
  44. [ ] Rotular recolhimento da sidebar; aceite: nome muda com estado. P1.
-
  45. [ ] Rotular idioma, tema e notificações; aceite: nomes acessíveis nos
          triggers. P1.
-
  46. [ ] Tornar drawer mobile diálogo modal; aceite: role, título e Escape
          funcionam. P1.
-
  47. [ ] Implementar focus trap/restauração; aceite: foco não escapa e retorna
          ao gatilho. P1.
-
  48. [ ] Rotular botão “Fechar menu”; aceite: leitor de tela anuncia ação. P1.
-
  49. [ ] Rotular download/abrir no portal; aceite: ação inclui contexto do
          documento. P1.
-
  50. [ ] Testar shell real com axe; aceite: layout/header/sidebar/drawer
          cobertos. P1.
-
  51. [ ] Corrigir marca/domínio/social cards; aceite: remover PromoBrindes e
          Lovable. P1.
-
  52. [ ] Criar título por rota; aceite: página + marca em todas as rotas
          principais. P1.
-
  53. [ ] Definir description/canonical públicos; aceite: Auth, Status, Portal e
          convites cobertos. P2.
-
  54. [ ] Corrigir prefetch sem `queryFn`; aceite: cache aquecido ou recurso
          removido. P1.
-
  55. [ ] Instrumentar prefetch; aceite: teste/telemetria comprova execução
          útil. P2.
-
  56. [ ] Estabilizar canais realtime; aceite: não recriados em cada navegação.
          P2.
-
  57. [ ] Elevar listeners globais ao shell; aceite: uma montagem por sessão.
          P2.
-
  58. [ ] Corrigir `/centro-custos` no breadcrumb; aceite: rota e trilha
          coincidem. P2.
-
  59. [ ] Trocar `window.location.href` por router; aceite: navegação sem
          reload. P2.
-
  60. [ ] Validar shell em viewports móveis; aceite: sem overlays ou conteúdo
          sobrepostos. P2.

### Segurança, replay e versionamento (61–80)

-
  61. [ ] Inventariar endpoints públicos e `verify_jwt=false`; aceite: risco e
          credencial registrados. P0.
-
  62. [ ] Unificar autenticação de origem; aceite: helper comum em todos os
          webhooks. P0.
-
  63. [ ] Proteger Bling com HMAC/token; aceite: chamada sem credencial
          rejeitada. P0.
-
  64. [ ] Aplicar segredo fail-closed e comparação constante; aceite: ausência
          nunca libera tráfego. P0.
-
  65. [ ] Implementar timestamp/nonce/janela anti-replay; aceite: mensagens
          antigas/repetidas falham. P0.
-
  66. [ ] Deduplicar por chave canônica composta; aceite: duplicatas
          concorrentes não têm efeito. P0.
-
  67. [ ] Generalizar claim/success/failure/DLQ; aceite: todos os provedores
          rastreáveis. P0.
-
  68. [x] Implementar envelope 422 único; aceite: testes do helper passam. P0.
-
  69. [ ] Formalizar taxonomia HTTP; aceite: matriz e testes por classe de erro.
          P1.
-
  70. [x] Versionar contratos por header; aceite: v1/v2 detectáveis. P0.
-
  71. [x] Congelar v1 e criar schemas v2; aceite: exports distintos por webhook.
          P0.
-
  72. [x] Provar coexistência v1/v2; aceite: suíte de compatibilidade verde. P0.
-
  73. [ ] Definir sunset com data e telemetria; aceite: ciclo de vida publicado.
          P1.
-
  74. [ ] Incluir arrays vazios e campos extras; aceite: cinco categorias
          negativas por schema. P0.
-
  75. [ ] Logar correlation, auth e versão; aceite: agregação sem parsing de
          texto. P1.
-
  76. [ ] Reduzir enumeração e detalhes sensíveis; aceite: testes de respostas
          indistinguíveis. P1.
-
  77. [ ] Endurecer replay administrativo; aceite: RBAC, escopo e trilha de
          auditoria. P1.
-
  78. [ ] Cobrir todas as origens no retry worker; aceite: nenhum source ativo
          sem handler. P1.
-
  79. [x] Bloquear endpoint com body sem validação no CI; aceite: teste de
          cobertura falha em regressão. P0.
-
  80. [ ] Publicar matriz auth/replay/idempotência/DLQ/schema/versão; aceite:
          sem campos indefinidos. P1.

### Testes, CI, observabilidade e produção (81–100)

-
  81. [ ] Descobrir e executar todos os testes Deno no CI; aceite: nenhum teste
          existente omitido. P0.
-
  82. [ ] Versionar manifesto endpoint/schema/teste/auth; aceite: nova função
          sem entrada falha. P0.
-
  83. [ ] Exigir válido, JSON inválido, ausente, tipo e vazio; aceite: cinco
          cenários por endpoint. P0.
-
  84. [x] Criar helper único de asserção/envelope; aceite: testes independem de
          mensagens locais. P0.
-
  85. [ ] Cobrir cada `safeParse` inline no handler; aceite: sucesso e falha
          HTTP reais. P0.
-
  86. [ ] Separar gate sintático e comportamental; aceite: dois checks
          obrigatórios. P0.
-
  87. [ ] Publicar artefatos JSON de contrato; aceite: endpoint/status/body
          resumidos por cenário. P1.
-
  88. [ ] Testar auth/schema/idempotência dos quatro webhooks; aceite: três
          classes por webhook. P1.
-
  89. [ ] Cobrir proxies críticos; aceite: contrato e encaminhamento mockado
          verificados. P1.
-
  90. [ ] Cobrir funções cron e defaults; aceite: default válido e shape
          inválido por job. P1.
-
  91. [ ] Logar endpoint/motivo/campos/request-id; aceite: falhas agregáveis.
          P1.
-
  92. [ ] Medir success/invalid-json/schema/business-rule; aceite: dashboard
          consultável. P1.
-
  93. [ ] Criar smoke sem efeito colateral em staging/produção; aceite: 4xx
          estruturado pós-deploy. P1.
-
  94. [x] Adicionar fixtures/testes v1/v2; aceite: coexistência automatizada.
          P1.
-
  95. [ ] Bloquear rollout sem contrato/observabilidade; aceite: gate de deploy
          obrigatório. P1.
-
  96. [ ] Corrigir docs aspiracionais e referência “Freight Quest”; aceite: docs
          refletem runtime. P2.
-
  97. [ ] Publicar runbook de falha contratual; aceite: auth/schema/negócio
          diagnosticáveis. P2.
-
  98. [ ] Publicar inventário Vitest/Deno/Playwright; aceite: artifact por
          pipeline. P2.
-
  99. [ ] Fazer rollout progressivo em staging; aceite: smoke, observação e
          promoção documentados. P2.
-
  100. [ ] Documentar cada contrato público; aceite: versão, auth, request e
           respostas canônicas publicados. P2.

## Exemplos técnicos

Erro canônico:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Payload inválido",
  "fields": [
    { "path": "payment.id", "message": "Required", "code": "invalid_type" }
  ]
}
```

Seleção de versão:

```http
POST /functions/v1/asaas-webhook
X-Contract-Version: v2
Content-Type: application/json
```

Sem o header, o endpoint usa `v1` e devolve `Deprecation: true`. Uma versão
desconhecida retorna 422 com `UNSUPPORTED_CONTRACT_VERSION`.

## Critério de pronto

O plano só estará concluído quando os itens estiverem implementados, testados,
revisados, implantados em staging, promovidos para produção, observados com
tráfego real e sem regressão de SLO. Merge sem deploy não conta como conclusão.

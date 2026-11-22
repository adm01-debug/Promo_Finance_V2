# ADR-004 — Topologia da calculadora oficial da RFB (etapa 59)

**Status:** aceito (decisão do dono, 22/11/2026). **Contexto:** `docs/receitafederal/PLANO_CONFORMIDADE_RT_RECEITAFEDERAL_100_ETAPAS.md`, Fase 6 (etapas 59-68) e Fase 7 (etapas 69-78).

## Pergunta

A etapa 59 pedia uma escolha de infra para hospedar os containers Docker das calculadoras oficiais da RFB (`calculadora-rtc-regime-regular`, `calculadora-rtc-simples-nacional` — apps Java 25 com banco SQLite/H2 embarcado via Flyway): VPS própria (Swarm/Traefik) ou um provedor gerenciado (Fly.io/Render).

## Restrição técnica descoberta

Supabase Edge Functions rodam em runtime Deno (TypeScript/JavaScript) e não executam processos Java nem mantêm filesystem persistente para um banco embarcado. Não é possível rodar a calculadora oficial dentro do Supabase — qualquer opção (VPS, Fly, Render) exigiria infraestrutura nova e separada do Supabase+GitHub já usados pelo projeto.

## Decisão

Não hospedar a calculadora oficial da RFB. **Fase 6 (etapas 59-68, infra) e Fase 7 (etapas 69-78, delegar cálculo à calculadora oficial) ficam fora de escopo.**

O motor de cálculo próprio em TypeScript (Fases 1-2 do plano, etapas 7-30 — já implementadas e mergeadas em `main`) continua sendo a única fonte de cálculo de CBS/IBS/IS do sistema. Não há dependência de infraestrutura nova, nem custo recorrente adicional.

## Consequências

- Etapas 59-78 (Fases 6 e 7): não serão executadas. Removidas do caminho crítico do plano.
- Etapa 95 ("Suíte de paridade local × RFB") perde sua forma original (comparar contra a calculadora oficial via proxy). Sem acesso a essa segunda fonte, a validação de paridade — se o dono quiser mantê-la — passa a ser manual: comparar casos de exemplo publicados pela própria RFB (NT 2025.002, documentação da calculadora) contra o motor próprio, em vez de uma chamada automatizada.
- Fases 8-9 que dependiam de dados sincronizados via `rfb-proxy` (etapas 79-86, catálogos oficiais) precisam ser reavaliadas: os catálogos (`catalogo_cclasstrib`, NCM, alíquotas de referência) ainda podem ser sincronizados diretamente dos endpoints públicos de dados abertos da RFB (não dependem da calculadora Java), então não são automaticamente descartados por esta decisão — só a integração de cálculo (Fase 7) é.
- Fase 3 (schema de banco, etapas 31-40) e Fase 4-5 (XML/NF-e) continuam no plano, sem alteração — não dependiam da calculadora oficial, só do modelo de dados.

- Etapa 5 (feature flag `rt_motor_v2` por empresa) fica descartada: existia só para alternar motor local × calculadora RFB na etapa 72. Sem a Fase 7 não há segundo motor a alternar, então a flag não teria estado válido. Nenhuma migration foi criada (`supabase/migrations/*feature_flag_rt_motor_v2*` não existe) e nenhum arquivo consome o nome no código. Rollback das Fases 1-2 é revert do commit, não flag.

## Alternativa considerada e descartada

Rodar a calculadora Java via Supabase Edge Function: tecnicamente impossível (runtime Deno, sem suporte a JVM nem a processos de longa duração com banco embarcado).

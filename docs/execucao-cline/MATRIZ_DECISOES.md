# Matriz de Decisões — Itens que Exigem o Proprietário

> **Fonte:** handoff de origem (PR #48), §16 — "Perguntas de decisão que o Cline deve preparar, não responder sozinho".
> **Base:** `origin/main` @ `5093a727` (2026-08-30). Este documento **prepara** cada decisão com opções, impacto, risco, recomendação e reversibilidade; **nenhuma decisão aqui foi executada**.
> Convenção: risco 🔴 alto · 🟡 médio · 🟢 baixo. Reversibilidade: R = reversível · PC = parcialmente custosa · I = irreversível.

---

## D1. Baseline por domínio quando origem, destino e migrations divergem

- **Contexto:** três fontes de verdade (banco de origem, banco de destino, migrations no repo) divergem entre si; o handoff registra 551 migrations no ledger atual e objetos só no destino.
- **Opções:** (a) destino é o baseline, repo congelado como histórico; (b) repo é o baseline, divergências do destino viram exceção documentada; (c) baseline híbrido por domínio, definido em `MATRIZ_DIVERGENCIAS_BD.md`.
- **Impacto:** define a régua de todos os diffs e testes dos lotes B–C.
- **Risco:** 🔴 régua errada valida drift como "oficial" ou descarta alteração de deploy real.
- **Recomendação:** (c) híbrido por domínio, com tabela por objeto e homologação explícita.
- **Reversibilidade:** PC — trocar de régua depois exige reclassificar tudo que já foi comparado.

## D2. Destino da origem: preservar, congelar ou descomissionar

- **Contexto:** a origem segrega dados reais; o programa opera no destino; MCP da origem está indisponível neste ambiente.
- **Opções:** (a) preservar viva; (b) congelar read-only por janela definida; (c) descomissionar após backup verificado.
- **Impacto:** custo de infraestrutura, risco de perda de dado real e janela de rollback do programa.
- **Risco:** 🔴 descomissionar cedo elimina a única cópia de dado real; preservar sem limite eterniza custo e ambiguidade.
- **Recomendação:** (b) congelar read-only por 30–90 dias após o aceite do lote J; revisar antes de descomissionar.
- **Reversibilidade:** I para (c) sem backup verificado; R entre (a) e (b).

## D3. `api-keys-manage` e `webhook-financeiro`: implementar ou retirar a promessa

- **Contexto:** funções prometidas pela UI/roteamento que não existem no `config.toml` (não estão entre as 103); etapas 044/045.
- **Opções:** (a) implementar ambas (segredo de API exibido uma única vez); (b) implementar só uma; (c) retirar/ocultar as duas promessas agora.
- **Impacto:** (a) cria superfície nova de segurança (rotação/revogação de chaves); (c) reduz alcance sem custo.
- **Risco:** 🟡 promessa visível sem backend = erro funcional 404; implementar sem cota/limite nasce inseguro.
- **Recomendação:** (c) agora + issue de produto para (a) com contrato (exibição única, escopo por tenant, revogação).
- **Reversibilidade:** R (UI) · PC (backend após adoção por clientes).

## D4. NF-e: homologação real agora ou marcar como demonstração

- **Contexto:** módulo NF-e existe (funções `nfe-*`, `sefaz-*`) sem emissão real homologada; etapa 058 exige nunca aparentar emissão fiscal real.
- **Opções:** (a) homologação real SEFAZ agora; (b) isolar visualmente como demonstração; (c) ocultar o módulo.
- **Impacto:** fiscal/legal — simulação sem rótulo claro induz erro do usuário final.
- **Risco:** 🔴 (a) exige certificado/credenciais SEFAZ e janela autorizada; 🟡 (b) rápido e honesto; 🟢 (c) remove valor demonstrável.
- **Recomendação:** (b) rótulo explícito de demonstração em todo o fluxo NF-e até homologação SEFAZ autorizada.
- **Reversibilidade:** R.

## D5. `useBudget`: backend/UI ou fora do roadmap

- **Contexto:** hook do frontend sem backend correspondente (funcionalidade parcial — lote E).
- **Opções:** (a) implementar domínio de orçamento (backend + UI); (b) remover o hook e referências; (c) congelar documentado como dívida.
- **Impacto:** (a) é um domínio de produto inteiro; (b) limpa código; (c) mantém dívida visível.
- **Risco:** 🟢 baixo em qualquer opção — não há fluxo financeiro ativo dependente.
- **Recomendação:** (c) congelar + registrar em `CANDIDATOS_HIGIENE.md`; (a)/(b) no planejamento de produto.
- **Reversibilidade:** R.

## D6. Páginas órfãs: integrar, arquivar ou remover

- **Contexto:** páginas roteadas sem entrada de menu ou consumidor (etapa 053).
- **Opções:** (a) integrar ao mapa de navegação; (b) arquivar em diretório `archive/`; (c) remover.
- **Impacto:** rotas públicas, SEO e dívida de manutenção.
- **Risco:** 🟡 remover página alvo de deep link externo quebra links indexados.
- **Recomendação:** triagem por página (nada de exclusão em bloco): (b) por padrão, (a) com caso de uso, (c) após verificação de referências.
- **Reversibilidade:** R via git · I para links externos quebrados (parcial).

## D7. Lockfile e gerenciador oficiais (npm continua suportado?)

- **Contexto:** coexistência de artefatos de múltiplos gerenciadores; CI/testes dependem disso (etapas 079/080/087).
- **Opções:** (a) um único lockfile oficial e remoção dos demais; (b) dois oficiais documentados; (c) manter como está.
- **Impacto:** reprodutibilidade de build, CI e segurança de supply chain.
- **Risco:** 🔴 múltiplos lockfiles divergentes = build não reproduzível e drift de dependências.
- **Recomendação:** (a) um oficial + CI validando o lockfile; remoção dos demais individualmente aprovada (etapa 087).
- **Reversibilidade:** R (restaurável do git).

## D8. Suíte E2E paralela (Dyad): cobertura exclusiva?

- **Contexto:** suíte E2E paralela/Dyad pode ter cobertura sobreposta à principal (etapa 088).
- **Opções:** (a) mesclar na suíte principal; (b) manter paralela com contrato documentado; (c) remover após provar zero cobertura exclusiva.
- **Impacto:** custo de manutenção duplicada × perda de testes únicos.
- **Risco:** 🟡 remover antes de medir apaga a única proteção de algum fluxo.
- **Recomendação:** medir cobertura por caso antes de decidir; padrão (a) mesclar, (c) só com prova de sobreposição.
- **Reversibilidade:** PC (merge cria histórico duplo).

## D9. Artefatos `sql/`, `db/functions/`, relatórios e snapshots

- **Contexto:** artefatos de diagnóstico/legado coexistem com migrations oficiais (etapas 017/089).
- **Opções:** manter · integrar ao fluxo oficial · arquivar · remover — individualmente.
- **Impacto:** clareza da fonte de verdade; risco de perder SQL de referência.
- **Risco:** 🔴 remoção em bloco pode descartar SQL nunca aplicado (a "perda de deploy" do handoff).
- **Recomendação:** matriz item a item em `CANDIDATOS_HIGIENE.md` com dependências; exclusão só após aprovação nominal.
- **Reversibilidade:** R via git · 🔴 se o artefato for a única cópia de SQL aplicado fora do git.

## D10. Policies/grants públicos que são requisito de negócio

- **Contexto:** policies literais verdadeiras e grants amplos (`GRANT ALL`, `TRUNCATE`, anon insert de telemetria) (etapas 028/029/030).
- **Opções:** (a) aceitar nominalmente com ADR; (b) reduzir ao escopo mínimo com antiabuso; (c) remover.
- **Impacto:** exposição de dados/abuso vs. funcionalidade que depende do grant.
- **Risco:** 🔴 aceitar sem registro vira superfície invisível; 🟡 reduzir sem teste cross-tenant quebra fluxo legítimo.
- **Recomendação:** (b) por padrão com testes cross-tenant; (a) apenas com ADR do proprietário.
- **Reversibilidade:** R (SQL), com custo operacional se quebrar fluxo em produção.

## D11. Política de orçamento/custo para IA e provedores externos

- **Contexto:** endpoints caros de IA rodam com service_role e sem cota/orçamento comprovado (etapas 005/047); ver os "sem guard" em `MATRIZ_AUTH_EDGE.md`.
- **Opções:** (a) orçamento global + alerta; (b) cota por tenant/usuário com corte; (c) sem política formal.
- **Impacto:** custo mensal direto; abuso anônimo em endpoints sem guard detectado.
- **Risco:** 🔴 (c) combina abuso gratuito com custo ilimitado; 🟡 (b) exige medição por tenant ainda inexistente.
- **Recomendação:** (a) imediato + (b) progressivo começando pelos endpoints IA sem guard.
- **Reversibilidade:** R.

## D12. Staging homologado e quem autoriza deploy/canário/produção

- **Contexto:** lotes I/J (087–100) dependem de staging representativo, backup, rollback e autorização explícita.
- **Opções:** (a) staging dedicado com gates formais; (b) canário direto em produção com rollback automático; (c) continuar sem staging formal.
- **Impacto:** todo deploy, migração remota e tráfego real.
- **Risco:** 🔴 (b)/(c) sem rollback comprovado sobre dados reais; (a) tem custo de infraestrutura.
- **Recomendação:** (a) staging dedicado + matriz de autorização nominal (deploy/canário/aceite) publicada no repositório.
- **Reversibilidade:** PC (rollback de dados reais é sempre delicado).

---

## Pendências de autorização já existentes (fora das 12)

| Item | Tipo de autorização necessária | Etapas relacionadas |
|------|-------------------------------|---------------------|
| Merge dos PRs #48/#49/#50 | decisão de código (proprietário) | 006/009/010 e demais |
| Rotação/revogação de segredos externos | operacional externa | 006 |
| Acesso MCP read-only à origem | infraestrutura/acesso | 011/012/019/020 |
| Aplicação remota de migrations | operação em produção | 025/032 e lote C |
| Deploy canário / rollout | operação em produção | 050/091–100 |

> Nenhuma das ações acima foi executada por este agente. Toda ação local foi reversível e limitada a este branch.


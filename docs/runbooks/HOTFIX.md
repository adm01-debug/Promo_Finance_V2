# Runbook: Hotfix em Produção

> Caminho rápido para correções urgentes sem furar os gates de qualidade.

## Quando usar

Bug em produção com impacto real (S1/S2 do runbook INCIDENTES). Para qualquer outra coisa, o fluxo normal de PR já é rápido.

## Fluxo

1. **Branch de emergência a partir de `main` estável**:
   ```bash
   git fetch origin && git checkout -b hotfix/<slug> origin/main
   ```
2. **Diff mínimo**: só a correção. Refatoração e limpeza ficam para PR separado.
3. **Commit convencional**: `fix(<escopo>): <o que corrige>` — hooks de husky rodam normalmente; `--no-verify` só se a emergência justificar e o PR documentar por quê.
4. **PR com label de urgência**: abrir para `main`, título começando com `fix:`.
   - CI obrigatório roda igual (unit tests + gates). **Não mergear com check vermelho** — se o check falhar por causa não relacionada e comprovada, documentar no PR.
   - Revisão: pedir no canal do time; em S1 e sem reviewer disponível, merge admin documentado no PR (motivo + quem autorizou).
5. **Deploy**: merge em `main` dispara deploy Vercel automático (~2-4min). Validar o sintoma original em https://app.promo-finance.com.
6. **Edge function**: se o fix é numa fn, rodar o workflow `functions-deploy` para ela após o merge — merge não publica fn sozinho.
7. **Migration de emergência**: usar workflow `prod-migrate` (approval gate) — nunca `db push` da máquina local.

## Pós-incidente

- Marcar no PR o incidente relacionado (link do registro).
- Se pulou algum gate (ex.: teste), abrir PR de follow-up no mesmo dia cobrindo.
- Atualizar o post-mortem com a correção aplicada.

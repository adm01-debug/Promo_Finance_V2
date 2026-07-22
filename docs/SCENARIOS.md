# Scenario Harness

Infraestrutura de **simulação exaustiva** do fluxo completo do sistema. Gera centenas de cenários por combinação `(domínio × falha × seed)` e verifica invariantes de banco ao final de cada execução.

- Nenhum I/O real (Supabase mockado in-memory).
- Determinístico por seed (PRNG mulberry32).
- Roda no Vitest e via CLI.

## Como rodar

### Vitest (padrão: 500 cenários)

```bash
bunx vitest run src/test/scenarios
```

Ajuste o volume pelo env:

```bash
SCENARIOS_COUNT=100 bunx vitest run src/test/scenarios   # local rápido
SCENARIOS_COUNT=2000 bunx vitest run src/test/scenarios  # CI exaustivo
```

### CLI (relatório Markdown + JSON)

```bash
bun run scripts/run-scenarios.ts --count 1000 --seed 7 \
  --domain webhooks --out /mnt/documents/scenarios.md
```

Parâmetros:

| Flag | Default | Descrição |
|---|---|---|
| `--count` | 500 | número de cenários |
| `--seed` | 42 | raiz do PRNG |
| `--domain` | `all` | `conciliacao,webhooks,cobranca,anomalias` (CSV) |
| `--out` | `/mnt/documents/scenarios-report.md` | caminho do relatório |

Sai com código `1` se qualquer invariante falhar.

## Domínios cobertos

- **conciliacao** — extrato + lançamentos + matching + saldo
- **webhooks** — Asaas / Bitrix / Bling / WhatsApp (idempotência, ordem causal)
- **cobranca** — régua de disparos sobre boletos vencidos
- **anomalias** — fila de revisão com transições de status

## Falhas injetadas

| `FaultKind` | Parâmetro | Semântica |
|---|---|---|
| `none` | — | baseline |
| `timeout` | após N ops | mutação estoura tempo |
| `flaky` | taxa 0..1 | falha aleatória |
| `reorder` | — | permuta parcial do stream |
| `duplicate` | k∈{2,3,5} | eventos repetidos |
| `latency` | jitter ms | modela atraso (sem I/O) |
| `partial_write` | taxa 0..1 | falha após primeira mutação ok |

## Invariantes (catálogo)

Definidos em `src/test/scenarios/invariants.ts`. Cada invariante é uma função pura `(state) => InvariantViolation | null`.

1. `idempotencyWebhook` — cada `event_id` gera **1** invocação efetiva.
2. `unicidadeTransacoes` — sem duplicidade de `(empresa_id, transacao_externa_id)`.
3. `monotonicidadeAnomalia` — nunca regride de `confirmada`/`falso_positivo` para `nova`.
4. `conservacaoSaldo` — `saldo_final == saldo_inicial + Σ transações` (±R$ 0,01).
5. `contagemConciliada` — `conciliadas + pendentes == total`.
6. `semOrfaos` — todo `lancamentoId` conciliado existe.
7. `ordemCausalEventos` — `PAYMENT_CREATED` sempre processado antes de `PAYMENT_CONFIRMED` por `paymentId`.
8. `reguaSemDuplicidade` — sem disparo duplicado `(boleto, etapa, janela)`.
9. `auditoriaCompleta` — toda transição de status gera exatamente 1 `audit_log`.

## Como adicionar um novo invariante

1. Adicione a função em `src/test/scenarios/invariants.ts` e registre no map `INVARIANTS`.
2. Adicione um teste unitário em `__tests__/invariants.spec.ts` cobrindo pelo menos: caso ok + caso violado.

## Como adicionar um novo domínio

1. Crie `src/test/scenarios/fixtures/<dominio>.ts` com factories `make…(rng, size)`.
2. Adicione o tipo em `Domain` (arquivo `types.ts`) e um branch no `switch` do `runScenario`.
3. Registre o domínio em `generator.ts` (`DOMAINS`).

## Reprodução de falha

O relatório lista `seed` de cada cenário que falhou. Reproduza com:

```bash
bun run scripts/run-scenarios.ts --count 1 --seed <SEED> --domain <DOMINIO>
```

Como o PRNG é determinístico, a execução é bit-a-bit igual.

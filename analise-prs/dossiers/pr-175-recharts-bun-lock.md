# Dossiê PR #175 — bump recharts 2.15.4 → 3.10.1

**Analisado em:** 2026-11-09  
**Veredito:** BLOQUEADA_AMBIENTE

## Estado da PR
- Dependabot PR com 2 arquivos: `bun.lock` (+22/-24) e `package.json` (+1/-1)
- `mergeStateStatus: UNKNOWN` (GitHub computando)
- Quality Gate: FAILURE (breaking API TypeScript em recharts 3.x)

## Tentativa 1 — resolver merge conflict em bun.lock
Main recebeu 11 merges com novas dependências após a criação desta PR; bun.lock ficou CONFLICTING. Para criar supersede:
1. Aplicar `package.json` change: `"recharts": "^2.15.4"` → `"recharts": "^3.10.1"`
2. Regenerar `bun.lock` via `bun install`

**Bloqueio no passo 2:** `bun install` falha com `ProxyConnectFailed 403` — registro npm/bun bloqueado neste ambiente cloud.

## Tentativa 2 — supersede sem bun.lock (bypass do lockfile)
Verificação de `.github/actions/setup-bun/action.yml:15`:  
`run: bun install --frozen-lockfile --ignore-scripts`

Sem `bun.lock` atualizado e consistente com `package.json`, o job `Install dependencies` falha antes de rodar qualquer teste. Impossível contornar sem atualizar o lockfile.

## Tentativa 3 — TS fixes necessários (causa da Quality Gate FAILURE)
Mesmo se bun.lock fosse resolvido, recharts 3.x tem breaking API TypeScript em 9+ arquivos:
- `Formatter<ValueType, NameType>` → inferência automática (remove type annotation)
- `ChartTooltipContent`/`ChartLegendContent` props redesenhadas em `src/components/ui/chart.tsx`
- Arquivos afetados conhecidos: `BenchmarkResultTabs.tsx`, `SimulacaoRegimes.parts.tsx`, `EvolucaoCargaChart.tsx`, `PrevisaoTributariaIA.tsx`, `EvolucaoChart.tsx`, `Asaas.parts.tsx`, `CentroCustos.tsx`, `Cobrancas.tsx`, `chart.tsx`

## Por que BLOQUEADA_AMBIENTE (não adianta mais ciclos)
O bloqueio está na etapa 2 de qualquer tentativa — anterior ao código TypeScript. Sem `bun install` funcional, nenhum commit chega a CI.

## Ação necessária
Humano com `bun install` funcional:
1. `git checkout -b fix/recharts-3 main`
2. Aplicar `package.json`: recharts `^3.10.1`
3. `bun install` (atualiza bun.lock)
4. Corrigir TypeScript em 9 arquivos (ver lista acima)
5. Push + PR

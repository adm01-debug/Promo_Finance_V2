# ADR-003 — Modelo de papéis e escopo de empresa

- **Status:** proposto (aguarda decisão do responsável pelo produto)
- **Data:** 2026-09-13
- **Escopo:** `user_roles`, `has_role()`, guards das Edge Functions, policies RLS
- **Origem:** Etapa 11 do plano de 50 etapas (`docs/PLANO_MELHORIAS_50_ETAPAS_2026-09-13.md`)

## Contexto

`has_role()` é **tenant-agnóstico**. A definição vigente no banco canônico filtra
apenas por usuário, papel e atividade:

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog' AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = _user_id
      AND user_roles.role    = _role
      AND user_roles.is_active = true
  );
END;
$$;
```

A tabela `user_roles` **não possui coluna `empresa_id`** — nenhuma migration a
adiciona. Não existe, portanto, forma de distinguir um administrador de
plataforma de um administrador de uma única empresa: o papel `admin` é global
por construção.

`user_empresas` é o único vínculo real entre usuário e empresa.

### Manifestação concreta

Nove Edge Functions validam o vínculo com `user_empresas`, mas **antes disso**
abrem um desvio por `has_role('admin')`:

```ts
const { data: isAdmin } = await supa.rpc('has_role', { _user_id: userId, _role: 'admin' });
if (!isAdmin) {
  const { data: vinculo } = await supa
    .from('user_empresas')
    .select('id')
    .eq('user_id', userId)
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .maybeSingle();
  if (!vinculo) return jsonComCors({ error: 'Sem permissão para esta empresa' }, 403);
}
```

Funções afetadas:

| Função                              | Dado alcançado pelo desvio                     |
| ----------------------------------- | ---------------------------------------------- |
| `calcular-health-score-operacional` | Indicadores operacionais                       |
| `comparar-benchmark-setorial`       | Faturamento e comparativo setorial             |
| `contabilizar-evento`               | Lançamentos contábeis                          |
| `gerar-acoes-recomendadas`          | Diagnóstico financeiro                         |
| `gerar-dre-tributaria`              | DRE tributária                                 |
| `gerar-heatmap-tributario`          | Carga tributária mensal                        |
| `gerar-pdf-tributario`              | Relatório fiscal (grava no Storage da empresa) |
| `gerar-resumo-executivo-semanal`    | Resumo executivo                               |
| `prever-carga-tributaria`           | Projeção tributária                            |

Todas usam cliente `service_role`, que ignora RLS. O efeito é que **qualquer
portador do papel `admin` lê dados fiscais de qualquer empresa**, inclusive de
empresas às quais nunca foi vinculado. Não é uma falha pontual de nenhuma das
nove: é a consequência direta do modelo de papéis.

O mesmo desvio aparece em policies RLS que usam `has_role(auth.uid(), 'admin')`
como condição de acesso.

## Opções

### (a) Tornar `has_role()` consciente de empresa

Adicionar `empresa_id` a `user_roles`, com backfill a partir de `user_empresas`,
e reescrever `has_role()` para exigir a empresa como argumento.

- **A favor:** resolve a raiz; permite papéis distintos por empresa, que é o
  modelo que o produto aparenta prometer.
- **Contra:** DDL em produção sobre tabela de autorização; toda policy e toda
  chamada de `has_role()` precisam ser revisadas na mesma janela; backfill
  ambíguo para usuários com papel mas sem vínculo. Alto risco, exige janela
  planejada.

### (b) Declarar `has_role()` inadequado para escopo de tenant

Manter `has_role()` como verificação de **capacidade** (o que o usuário pode
fazer) e nunca de **alcance** (sobre qual empresa). O alcance passa a ser sempre
`user_empresas`. Na prática: remover o desvio `if (!isAdmin)` das nove funções,
deixando a verificação de vínculo incondicional.

- **A favor:** implementável só em código, sem migration; fecha a leitura
  cross-tenant imediatamente; verificável por teste de contrato.
- **Contra:** um administrador de plataforma deixa de ler empresas às quais não
  está vinculado — passa a precisar de linha em `user_empresas`. Se algum fluxo
  de suporte depende do desvio, ele quebra com 403 explícito.

## Recomendação

**Adotar (b) agora e (a) como evolução planejada.**

(b) fecha a exposição sem tocar em produção no nível de schema, e o custo de
falha é um 403 legível — não corrupção nem perda de dado. Administradores de
plataforma que precisem de alcance total já podem obtê-lo por linha em
`user_empresas`, que é o vínculo que o resto do sistema respeita.

(a) continua desejável para expressar papéis por empresa, mas é mudança de
schema de autorização e pede janela própria, com revisão de todas as policies
que hoje chamam `has_role()`.

## Decisão pendente

A troca altera semântica de autorização em produção. **Requer aprovação
explícita do responsável** antes de ser aplicada às nove funções.

## Consequências, se (b) for aceita

1. As nove funções passam a exigir vínculo em `user_empresas` sem exceção.
2. `has_role()` fica proibido como critério de alcance de empresa. A regra é
   verificada pelo teste de contrato em
   `supabase/functions/_shared/contract-coverage_test.ts`, que falha o build
   quando o desvio reaparece.
3. Policies RLS que usam `has_role()` para alcance entram numa segunda rodada de
   revisão, fora do escopo desta ADR.

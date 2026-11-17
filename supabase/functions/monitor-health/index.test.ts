// Cobre o gate de notificação externa do monitor-health.
//
// O ponto sensível: `existeAlertaRecente` filtra `lido = false` (política antiga,
// que reabre o alerta na tela depois de o admin marcar como lido), enquanto
// `existeNotificacaoRecente` NÃO filtra por `lido`. Sem essa separação, marcar o
// alerta como lido liberaria um e-mail/Slack novo a cada 30 min durante o mesmo
// incidente. Cron e webhook passam pelo mesmo `inserirAlerta`, então os casos
// abaixo cobrem os dois caminhos.

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

Deno.env.set('DENO_TESTING', '1');

const { inserirAlerta } = await import('./index.ts');

interface Cenario {
  alertaNaoLidoRecente: boolean;
  alertaRecenteQualquerEstado: boolean;
}

// Mock mínimo do query builder do supabase-js, só com a cadeia que o módulo usa.
function makeDb(cenario: Cenario) {
  const inserts: Record<string, unknown>[] = [];

  function builder(tabela: string) {
    const eqs: Record<string, unknown> = {};
    const chain = {
      select: () => chain,
      eq: (campo: string, valor: unknown) => {
        eqs[campo] = valor;
        return chain;
      },
      is: () => chain,
      gte: () => chain,
      insert: (linha: Record<string, unknown>) => {
        inserts.push(linha);
        return Promise.resolve({ data: null, error: null });
      },
      // `.limit(1)` é usado de dois jeitos: aguardado direto em `alertas` e seguido
      // de `.maybeSingle()` em `profiles`. Devolve um thenable que atende os dois.
      limit: () => {
        // 'lido' presente => é existeAlertaRecente; ausente => existeNotificacaoRecente.
        const filtraPorLido = Object.prototype.hasOwnProperty.call(eqs, 'lido');
        const achou = filtraPorLido
          ? cenario.alertaNaoLidoRecente
          : cenario.alertaRecenteQualquerEstado;
        const resultado =
          tabela === 'profiles'
            ? { data: [{ id: 'admin-1' }], error: null }
            : { data: achou ? [{ id: 'alerta-1' }] : [], error: null };
        return {
          maybeSingle: () => Promise.resolve({ data: { id: 'admin-1' }, error: null }),
          then: (res: (v: typeof resultado) => unknown, rej?: (e: unknown) => unknown) =>
            Promise.resolve(resultado).then(res, rej),
        };
      },
    };
    return chain;
  }

  // deno-lint-ignore no-explicit-any
  const db = { from: (tabela: string) => builder(tabela) } as any;
  return { db, inserts };
}

Deno.test('problema novo: grava alerta e notifica', async () => {
  const { db, inserts } = makeDb({
    alertaNaoLidoRecente: false,
    alertaRecenteQualquerEstado: false,
  });

  const r = await inserirAlerta(db, '[MONITOR] teste', 'mensagem');

  assertEquals(r.inserido, true);
  assertEquals(r.deveNotificar, true);
  assertEquals(inserts.length, 1);
});

Deno.test('alerta não lido das últimas 2h: não grava e não notifica', async () => {
  const { db, inserts } = makeDb({
    alertaNaoLidoRecente: true,
    alertaRecenteQualquerEstado: true,
  });

  const r = await inserirAlerta(db, '[MONITOR] teste', 'mensagem');

  assertEquals(r.inserido, false);
  assertEquals(r.deveNotificar, false);
  assertEquals(inserts.length, 0);
});

Deno.test(
  'alerta já marcado como lido e incidente persistindo: grava de novo, mas NÃO notifica',
  async () => {
    const { db, inserts } = makeDb({
      alertaNaoLidoRecente: false, // o admin marcou como lido
      alertaRecenteQualquerEstado: true, // mas a notificação saiu nas últimas 2h
    });

    const r = await inserirAlerta(db, '[MONITOR] teste', 'mensagem');

    assertEquals(r.inserido, true);
    assertEquals(r.deveNotificar, false);
    assertEquals(inserts.length, 1);
  }
);

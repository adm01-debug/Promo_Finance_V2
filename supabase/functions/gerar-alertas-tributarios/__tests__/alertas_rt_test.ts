// Testa as regras RT/RFB (checks 6 e 7) de gerar-alertas-tributarios em
// isolamento: sem rede, sem banco real, sem segredos.
//
// Estrategia: o modulo exporta determinarAlertasRt — funcao pura que recebe
// os dados ja carregados do banco e devolve os alertas a inserir. Os testes
// passam fixtures diretamente, sem mockar o cliente Supabase.
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { determinarAlertasRt } from '../index.ts';

const BASE_EMPRESA_ID = '11111111-1111-4111-8111-111111111111';

Deno.test('CRT 3 (lucro_presumido) com NF-e sem IBS/CBS apos FG gera alerta alto', () => {
  const alertas = determinarAlertasRt({
    empresa_id: BASE_EMPRESA_ID,
    regime_tributario: 'lucro_presumido',
    countNfeSemIbscbsCrt3: 3,
    countNfeSemIbscbsSn: 0,
  });

  assertEquals(alertas.length, 1);
  assertEquals(alertas[0].tipo, 'nfe_sem_ibscbs_obrigatoria');
  assertEquals(alertas[0].prioridade, 'alta');
  assertEquals(alertas[0].empresa_id, BASE_EMPRESA_ID);
});

Deno.test('CRT 3 com todas as NF-e com IBS/CBS nao gera alerta', () => {
  const alertas = determinarAlertasRt({
    empresa_id: BASE_EMPRESA_ID,
    regime_tributario: 'lucro_real',
    countNfeSemIbscbsCrt3: 0,
    countNfeSemIbscbsSn: 0,
  });

  assertEquals(alertas.length, 0);
});

Deno.test('Simples Nacional com NF-e sem IBS/CBS apos 01/12/2026 gera alerta', () => {
  const alertas = determinarAlertasRt({
    empresa_id: BASE_EMPRESA_ID,
    regime_tributario: 'simples_nacional',
    countNfeSemIbscbsCrt3: 0,
    countNfeSemIbscbsSn: 5,
  });

  assertEquals(alertas.length, 1);
  assertEquals(alertas[0].tipo, 'nfe_sem_ibscbs_simples_pos_dez26');
  assertEquals(alertas[0].prioridade, 'alta');
});

Deno.test('Simples Nacional sem NF-e pendente nao gera alerta', () => {
  const alertas = determinarAlertasRt({
    empresa_id: BASE_EMPRESA_ID,
    regime_tributario: 'simples_nacional',
    countNfeSemIbscbsCrt3: 0,
    countNfeSemIbscbsSn: 0,
  });

  assertEquals(alertas.length, 0);
});

Deno.test('regime nao sujeito (mei) nao gera alerta RT', () => {
  const alertas = determinarAlertasRt({
    empresa_id: BASE_EMPRESA_ID,
    regime_tributario: 'mei',
    countNfeSemIbscbsCrt3: 0,
    countNfeSemIbscbsSn: 0,
  });

  assertEquals(alertas.length, 0);
});

Deno.test('mensagem cita o numero correto de notas (singular)', () => {
  const alertas = determinarAlertasRt({
    empresa_id: BASE_EMPRESA_ID,
    regime_tributario: 'lucro_real',
    countNfeSemIbscbsCrt3: 1,
    countNfeSemIbscbsSn: 0,
  });
  assertEquals(alertas[0].mensagem.includes('1 nota em'), true);
});

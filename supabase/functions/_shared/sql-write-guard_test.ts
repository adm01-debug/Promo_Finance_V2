import { assertEquals } from 'https://deno.land/x/std@0.208.0/assert/mod.ts';
import { validarEscritaEscopada } from './sql-write-guard.ts';

const ataques = [
  'DELETE FROM audit_logs',
  'DELETE FROM audit_logs WHERE true',
  'DELETE FROM audit_logs WHERE 1=1',
  'DELETE FROM audit_logs WHERE 2 > 1',
  'DELETE FROM audit_logs WHERE id = id',
  'DELETE FROM audit_logs WHERE (id = id)',
  'UPDATE profiles SET role = \'admin\' WHERE empresa_id = empresa_id',
  'DELETE FROM audit_logs WHERE id = id OR 1 = 0',
  'DELETE FROM audit_logs WHERE id IS NOT NULL',
  'DELETE FROM audit_logs WHERE id = id AND empresa_id = empresa_id',
  'DELETE FROM audit_logs WHERE id = 7 OR empresa_id = 9',
  'UPDATE profiles SET role = \'admin\' WHERE NOT false',
  'UPDATE profiles SET role = \'admin\' WHERE id = id OR 1 = 1',
  'DELETE FROM audit_logs WHERE NULL IS NULL',
  'DELETE FROM audit_logs WHERE now() = now()',
  'DELETE FROM audit_logs WHERE id = 7; DELETE FROM profiles',
  'DELETE FROM audit_logs WHERE id = 7 /* comentário não terminado',
];

const escritasLegitimas = [
  "UPDATE public.contas_pagar SET status = 'pago' WHERE id = '8a43b437-f3ec-4f33-8d25-2f1d458e8072' AND empresa_id = 'e8bca5ba-855f-437d-a9c5-d7ca98a0373f'",
  "DELETE FROM public.alertas WHERE user_id = '8a43b437-f3ec-4f33-8d25-2f1d458e8072' AND created_at < now() - interval '90 days'",
  'UPDATE public.push_subscriptions SET ativo = false WHERE id = $1',
  'DELETE FROM public.auditoria_financeira WHERE deleted_at < now() - interval \'90 days\'',
];

Deno.test('guard de escrita bloqueia tautologias e statements múltiplos', () => {
  for (const sql of ataques) {
    const motivo = validarEscritaEscopada(sql);
    assertEquals(typeof motivo, 'string', `deveria bloquear: ${sql}`);
  }
});

Deno.test('guard de escrita aceita predicados restritivos legítimos', () => {
  for (const sql of escritasLegitimas) {
    assertEquals(validarEscritaEscopada(sql), null, `não deveria bloquear: ${sql}`);
  }
});

Deno.test('leituras não são classificadas como escrita administrativa', () => {
  assertEquals(validarEscritaEscopada('SELECT * FROM public.empresas'), null);
});

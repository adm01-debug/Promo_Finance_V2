import { assertEquals } from 'https://deno.land/std@0.190.0/testing/asserts.ts';
import {
  achatarInstrumentosBoleto,
  lerConfigAsaas,
  pareceIdClienteAsaas,
  resolverEncargo,
} from './asaas-config.ts';

Deno.test('lerConfigAsaas: le os campos de dentro de configuracoes (onde a UI grava)', () => {
  const linha = {
    id: 'c1',
    empresa_id: 'e1',
    configuracoes: {
      retry_limit: 9,
      retry_interval_minutes: 45,
      backoff_multiplier: 3,
      alert_email_enabled: true,
      alert_email_address: 'financeiro@exemplo.com.br',
      failure_threshold: 2,
    },
  };
  const cfg = lerConfigAsaas(linha);
  assertEquals(cfg.retry_limit, 9);
  assertEquals(cfg.retry_interval_minutes, 45);
  assertEquals(cfg.backoff_multiplier, 3);
  assertEquals(cfg.alert_email_enabled, true);
  assertEquals(cfg.alert_email_address, 'financeiro@exemplo.com.br');
  assertEquals(cfg.failure_threshold, 2);
});

Deno.test('lerConfigAsaas: campo plano na raiz da linha continua sendo lido', () => {
  // Tolerância para quem já passa o objeto de configuracoes direto.
  const cfg = lerConfigAsaas({ retry_limit: 7 });
  assertEquals(cfg.retry_limit, 7);
});

Deno.test(
  'lerConfigAsaas: linha ausente, configuracoes nula ou invalida devolve objeto vazio',
  () => {
    assertEquals(lerConfigAsaas(null), {});
    assertEquals(lerConfigAsaas(undefined), {});
    assertEquals(lerConfigAsaas({ id: 'c1', configuracoes: null }), {});
    assertEquals(lerConfigAsaas({ configuracoes: 'texto' }), {});
    assertEquals(lerConfigAsaas({ configuracoes: [1, 2] }), {});
    assertEquals(lerConfigAsaas('texto'), {});
  }
);

Deno.test('lerConfigAsaas: sem alerta configurado os campos ficam undefined (nada dispara)', () => {
  const cfg = lerConfigAsaas({ id: 'c1', configuracoes: { retry_limit: 5 } });
  assertEquals(cfg.alert_email_enabled, undefined);
  assertEquals(cfg.alert_email_address, undefined);
  assertEquals(cfg.alert_whatsapp_number, undefined);
});

Deno.test('resolverEncargo: zero informado na cobranca nao cai no percentual padrao', () => {
  assertEquals(resolverEncargo(0, 2), undefined);
  assertEquals(resolverEncargo(0, undefined), undefined);
});

Deno.test('resolverEncargo: ausencia usa o padrao da configuracao', () => {
  assertEquals(resolverEncargo(undefined, 2), 2);
  assertEquals(resolverEncargo(null, 1.5), 1.5);
  assertEquals(resolverEncargo(undefined, undefined), undefined);
  assertEquals(resolverEncargo(undefined, 0), undefined);
});

Deno.test('resolverEncargo: valor informado manda sobre o padrao', () => {
  assertEquals(resolverEncargo(5, 2), 5);
  assertEquals(resolverEncargo(0.5, 2), 0.5);
});

Deno.test('resolverEncargo: valor invalido nao vira encargo', () => {
  assertEquals(resolverEncargo(Number.NaN, 2), undefined);
  assertEquals(resolverEncargo(-1, 2), undefined);
  assertEquals(resolverEncargo(undefined, Number.POSITIVE_INFINITY), undefined);
});

Deno.test('pareceIdClienteAsaas: aceita o id do provedor', () => {
  assertEquals(pareceIdClienteAsaas('cus_000005113026'), true);
  assertEquals(pareceIdClienteAsaas('  cus_abc  '), true);
});

Deno.test('pareceIdClienteAsaas: recusa uuid, CPF/CNPJ e vazio', () => {
  assertEquals(pareceIdClienteAsaas('1f1a2b3c-4d5e-6f70-8192-a3b4c5d6e7f8'), false);
  assertEquals(pareceIdClienteAsaas('12345678000199'), false);
  assertEquals(pareceIdClienteAsaas(''), false);
  assertEquals(pareceIdClienteAsaas(null), false);
  assertEquals(pareceIdClienteAsaas(undefined), false);
});

Deno.test('achatarInstrumentosBoleto: sobe linha digitavel e codigo de barras', () => {
  assertEquals(
    achatarInstrumentosBoleto({
      identificationField: '00190500954014481606906809350314337370000000100',
      barCode: '00193373700000001000500940144816060680935031',
      nossoNumero: '9876',
    }),
    {
      identificationField: '00190500954014481606906809350314337370000000100',
      barCode: '00193373700000001000500940144816060680935031',
      nossoNumero: '9876',
    }
  );
});

Deno.test('achatarInstrumentosBoleto: ausencia e campo vazio nao viram instrumento', () => {
  assertEquals(achatarInstrumentosBoleto(null), {});
  assertEquals(achatarInstrumentosBoleto({ identificationField: '   ', barCode: '' }), {});
  assertEquals(achatarInstrumentosBoleto('cus_1'), {});
});

/**
 * Contrato: toda forma de cobrança oferecida nas telas de Contas a Pagar e
 * Contas a Receber tem que ser um valor do enum public.tipo_cobranca do banco.
 *
 * O front usava 'cartao', que não existe no enum. Em contas_pagar e
 * contas_receber a coluna é text livre, então não falhava — mas
 * pagamentos_recorrentes usa o enum de verdade e grava 'cartao_credito' /
 * 'cartao_debito', e as duas metades do sistema ficavam com vocabulário
 * diferente para a mesma forma de cobrança. Qualquer relatório ou filtro que
 * cruzasse as duas veria dois valores para a mesma coisa.
 *
 * É o mesmo contrato que já protege Pagamentos Recorrentes
 * (pagamento-recorrente-model.test.ts), agora estendido ao resto.
 */
import { describe, expect, it } from 'vitest';
import { Constants } from '@/integrations/supabase/types';
import { tipoCobrancaOptions as tiposReceber } from '@/components/contas-receber/ContaReceberFormFields.helpers';
import { rotuloTipoCobranca } from '@/types/tipo-cobranca-rotulo';

const DO_BANCO = Constants.public.Enums.tipo_cobranca as readonly string[];

describe('vocabulário de tipo_cobranca', () => {
  it('as opções de Contas a Receber são todas valores do enum do banco', () => {
    const valores = tiposReceber.map((t) => t.value);
    expect(valores.length).toBeGreaterThan(0);
    for (const v of valores) {
      expect(DO_BANCO).toContain(v);
    }
  });

  it('nenhuma opção oferece o valor inexistente "cartao"', () => {
    expect(tiposReceber.map((t) => t.value)).not.toContain('cartao');
    expect(DO_BANCO).not.toContain('cartao');
  });

  it('cartão aparece dividido em crédito e débito, como no banco', () => {
    const valores = tiposReceber.map((t) => t.value);
    expect(valores).toContain('cartao_credito');
    expect(valores).toContain('cartao_debito');
  });

  it('a tela não mostra o valor cru do banco', () => {
    expect(rotuloTipoCobranca('cartao_credito')).toBe('Cartão de crédito');
    expect(rotuloTipoCobranca('cartao_debito')).toBe('Cartão de débito');
    expect(rotuloTipoCobranca(null)).toBe('Boleto');
    expect(rotuloTipoCobranca('cartao_credito')).not.toContain('_');
  });
});

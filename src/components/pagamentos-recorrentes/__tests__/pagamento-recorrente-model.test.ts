import { describe, expect, it } from 'vitest';
import { Constants } from '@/integrations/supabase/types';
import { tipoCobrancaOptions } from '../pagamento-recorrente-model';

describe('tipoCobrancaOptions', () => {
  it('oferece exatamente os valores do enum tipo_cobranca do banco', () => {
    const valores = tipoCobrancaOptions.map((o) => o.value).sort();
    expect(valores).toEqual([...Constants.public.Enums.tipo_cobranca].sort());
    expect(valores).not.toContain('cartao');
  });
});

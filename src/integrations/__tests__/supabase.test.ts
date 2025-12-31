import { describe, it, expect } from 'vitest';
import { supabase } from '@/lib/supabase';

describe('Supabase Integration', () => {
  it('deve conectar com Supabase', async () => {
    const { data, error } = await supabase.from('contas_pagar').select('count');
    expect(error).toBeNull();
  });

  it('deve inserir registro', async () => {
    const { data, error } = await supabase
      .from('contas_pagar')
      .insert({ descricao: 'Test', valor: 100 })
      .select()
      .single();
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});

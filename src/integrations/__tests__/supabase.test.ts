import { describe, it, expect } from 'vitest';
import { supabase } from '@/lib/supabase';

describe('Supabase Integration', () => {
  it('deve conectar ao Supabase', async () => {
    const { data, error } = await supabase.from('contas_pagar').select('count');
    expect(error).toBeNull();
  });
});

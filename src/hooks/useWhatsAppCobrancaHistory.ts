
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useWhatsAppCobrancaHistory(contaReceberId?: string) {
  return useQuery({
    queryKey: ['historico-cobranca-whatsapp', contaReceberId],
    queryFn: async () => {
      const baseQuery = supabase.from('historico_cobranca_whatsapp').select('*');
      
      let query = baseQuery.order('created_at', { ascending: false });

      if (contaReceberId) {
        // @ts-expect-error -- instanciação de tipos excessivamente profunda no client supabase
        query = query.eq('conta_receber_id', contaReceberId);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export function useCreateWhatsAppCobranca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      conta_receber_id: string;
      cliente_id?: string;
      telefone: string;
      mensagem: string;
      regua_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('historico_cobranca_whatsapp')
        .insert({
          ...input,
          status: 'enviado',
          enviado_em: new Date().toISOString(),
          created_by: (await supabase.auth.getUser()).data.user?.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['historico-cobranca-whatsapp'] });
      toast.success('Cobrança WhatsApp registrada!');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

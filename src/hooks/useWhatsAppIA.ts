import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppConversa {
  id: string;
  cliente_id: string;
  mensagem: string;
  direcao: 'entrada' | 'saida';
  status: string;
  sentimento: string;
  intencao_pagamento: boolean;
  resumo_ia: string;
  created_at: string;
}

export function useWhatsAppConversas(clienteId?: string) {
  return useQuery({
    queryKey: ["whatsapp-conversas", clienteId],
    queryFn: async () => {
      let query = supabase
        .from("whatsapp_conversas")
        .select("*")
        .order("created_at", { ascending: false });

      if (clienteId) {
        query = query.eq("cliente_id", clienteId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as WhatsAppConversa[];
    },
    enabled: !!clienteId || clienteId === undefined,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ clienteId, mensagem }: { clienteId: string; mensagem: string }) => {
      const { data, error } = await supabase
        .from("whatsapp_conversas")
        .insert([
          {
            cliente_id: clienteId,
            mensagem,
            direcao: 'saida',
            status: 'enviado'
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-conversas", variables.clienteId] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';

export interface ReguaCobranca {
  id: string;
  nome: string;
  descricao: string | null;
  dias_antes_vencimento: number | null;
  dias_apos_vencimento: number | null;
  canal: 'whatsapp' | 'email' | 'sms';
  template_mensagem: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
}

export interface HistoricoCobrancaWhatsapp {
  id: string;
  conta_receber_id: string;
  regua_id: string | null;
  cliente_id: string | null;
  telefone: string;
  mensagem: string;
  status: 'pendente' | 'enviado' | 'entregue' | 'lido' | 'erro';
  erro_mensagem: string | null;
  enviado_em: string | null;
  created_at: string;
}

export function useReguaCobranca() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reguas = [], isLoading } = useQuery({
    queryKey: ['regua-cobranca'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regua_cobranca')
        .select('*')
        .order('ordem');
      if (error) throw error;
      return data as ReguaCobranca[];
    },
    enabled: !!user,
  });

  const { data: historico = [], isLoading: isLoadingHistorico } = useQuery({
    queryKey: ['historico-cobranca-whatsapp'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historico_cobranca_whatsapp')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as HistoricoCobrancaWhatsapp[];
    },
    enabled: !!user,
  });

  const enviarCobrancaMutation = useMutation({
    mutationFn: async ({ 
      contaReceberId, 
      clienteNome, 
      telefone, 
      valor, 
      dataVencimento, 
      descricao,
      reguaId 
    }: { 
      contaReceberId: string;
      clienteNome: string;
      telefone: string;
      valor: number;
      dataVencimento: string;
      descricao: string;
      reguaId?: string;
    }) => {
      // Buscar template da régua ou usar padrão
      let template = 'Olá {{cliente_nome}}! Sua fatura de R$ {{valor}} vence em {{data_vencimento}}. Descrição: {{descricao}}';
      
      if (reguaId) {
        const regua = reguas.find(r => r.id === reguaId);
        if (regua) template = regua.template_mensagem;
      }

      // Substituir variáveis no template
      const mensagem = template
        .replace(/{{cliente_nome}}/g, clienteNome)
        .replace(/{{valor}}/g, valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
        .replace(/{{data_vencimento}}/g, format(new Date(dataVencimento), 'dd/MM/yyyy'))
        .replace(/{{descricao}}/g, descricao);

      // Formatar telefone para WhatsApp
      const telefoneLimpo = telefone.replace(/\D/g, '');
      const telefoneWhatsapp = telefoneLimpo.startsWith('55') ? telefoneLimpo : `55${telefoneLimpo}`;

      // Registrar no histórico
      const { data: historicoData, error: historicoError } = await supabase
        .from('historico_cobranca_whatsapp')
        .insert({
          conta_receber_id: contaReceberId,
          regua_id: reguaId || null,
          telefone: telefoneWhatsapp,
          mensagem,
          status: 'pendente',
          created_by: user?.id,
        })
        .select()
        .single();

      if (historicoError) throw historicoError;

      // Abrir WhatsApp Web com a mensagem
      const mensagemEncoded = encodeURIComponent(mensagem);
      const whatsappUrl = `https://wa.me/${telefoneWhatsapp}?text=${mensagemEncoded}`;
      
      window.open(whatsappUrl, '_blank');

      // Atualizar status para enviado
      await supabase
        .from('historico_cobranca_whatsapp')
        .update({ status: 'enviado', enviado_em: new Date().toISOString() })
        .eq('id', historicoData.id);

      return historicoData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historico-cobranca-whatsapp'] });
      toast.success('Cobrança enviada via WhatsApp!');
    },
    onError: (error) => {
      console.error('Erro ao enviar cobrança:', error);
      toast.error('Erro ao enviar cobrança');
    },
  });

  const updateReguaMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ReguaCobranca> & { id: string }) => {
      const { error } = await supabase
        .from('regua_cobranca')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regua-cobranca'] });
      toast.success('Régua atualizada!');
    },
  });

  return {
    reguas,
    historico,
    isLoading,
    isLoadingHistorico,
    enviarCobranca: enviarCobrancaMutation.mutate,
    updateRegua: updateReguaMutation.mutate,
    isEnviando: enviarCobrancaMutation.isPending,
  };
}

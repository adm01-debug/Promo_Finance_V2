import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { registrarEventoFinanceiro } from '@/lib/financeiro/registrarEvento';
import { useToast } from '@/hooks/use-toast';

export interface Boleto {
  id: string;
  numero: string;
  valor: number;
  vencimento: string;
  sacado_nome: string;
  sacado_cpf_cnpj: string | null;
  cedente_nome: string;
  cedente_cnpj: string | null;
  banco: string;
  agencia: string;
  conta: string;
  linha_digitavel: string;
  codigo_barras: string;
  status: 'gerado' | 'enviado' | 'pago' | 'vencido' | 'cancelado' | 'rastreio';
  asaas_id?: string | null;
  external_provider?: string | null;
  bitrix_id?: string | null;
  bitrix_status?: string | null;
  eventos_pagamento?: any[] | null;
  descricao: string | null;
  observacoes: string | null;
  conta_receber_id: string | null;
  conta_pagar_id: string | null;
  conta_bancaria_id: string | null;
  empresa_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface NovoBoletoData {
  sacado_nome: string;
  sacado_cpf_cnpj: string;
  valor: number;
  vencimento: string;
  empresa_id: string;
  conta_bancaria_id: string;
  descricao?: string;
  conta_receber_id?: string;
  conta_pagar_id?: string;
  provider?: 'system' | 'asaas';
}

function generateLinhaDigitavel(valor: number, _vencimento: string): string {
  const valorStr = Math.round(valor * 100).toString().padStart(10, '0');
  const random1 = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  const random2 = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  const random3 = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  
  return `00190.${random1} ${random2}.123456 ${random3}.789012 1 9999${valorStr}`;
}

function generateCodigoBarras(valor: number): string {
  const valorStr = Math.round(valor * 100).toString().padStart(10, '0');
  const random = Math.floor(Math.random() * 10000000000000000).toString().padStart(16, '0');
  
  return `00191999900000${valorStr}${random}`;
}

async function getNextBoletoNumber(): Promise<string> {
  const { data, error } = await supabase
    .from('boletos')
    .select('numero')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;

  if (data && data.length > 0) {
    const lastNumber = parseInt(data[0].numero, 10);
    return (lastNumber + 1).toString().padStart(5, '0');
  }
  
  return '00001';
}

export function useBoletos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  // Fetch boletos
  const { data: boletos, isLoading, error, refetch } = useQuery({
    queryKey: ['boletos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boletos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Boleto[];
    },
  });

  // Fetch empresas for form
  const { data: empresas } = useQuery({
    queryKey: ['empresas-boletos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, razao_social, cnpj')
        .eq('ativo', true);

      if (error) throw error;
      
      
      return data;
    },
  });

  // Fetch contas bancárias for form
  const { data: contasBancarias } = useQuery({
    queryKey: ['contas-bancarias-boletos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('id, banco, agencia, conta, empresa_id')
        .eq('ativo', true);

      if (error) throw error;
      
      
      return data;
    },
  });

  // Create boleto mutation
  const createBoletoMutation = useMutation({
    mutationFn: async (data: NovoBoletoData) => {
      setIsCreating(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get empresa and conta bancária info
      const empresa = empresas?.find(e => e.id === data.empresa_id);
      const contaBancaria = contasBancarias?.find(c => c.id === data.conta_bancaria_id);

      if (!empresa) throw new Error('Empresa não encontrada');
      if (!contaBancaria) throw new Error('Conta bancária não encontrada');

      const numero = await getNextBoletoNumber();
      let boletoData: any = {
        numero,
        valor: data.valor,
        vencimento: data.vencimento,
        sacado_nome: data.sacado_nome,
        sacado_cpf_cnpj: data.sacado_cpf_cnpj,
        cedente_nome: empresa.razao_social,
        cedente_cnpj: empresa.cnpj,
        banco: contaBancaria.banco,
        agencia: contaBancaria.agencia,
        conta: contaBancaria.conta,
        status: 'gerado',
        descricao: data.descricao || null,
        conta_receber_id: data.conta_receber_id || null,
        conta_pagar_id: data.conta_pagar_id || null,
        conta_bancaria_id: data.conta_bancaria_id,
        empresa_id: data.empresa_id,
        created_by: user.id,
        rastreio_status: [{ status: 'gerado', data: new Date().toISOString(), detalhe: 'Boleto gerado pelo sistema' }]
      };

      // Se o provedor for ASAAS, integrar via Edge Function
      if (data.provider === 'asaas') {
        const { data: asaasResult, error: asaasError } = await supabase.functions.invoke('asaas-proxy', {
          body: {
            action: 'criar_cobranca',
            data: {
              empresa_id: data.empresa_id,
              asaas_customer_id: data.sacado_cpf_cnpj, // Simplificação: assume que já existe ou deve ser criado
              valor: data.valor,
              data_vencimento: data.vencimento,
              tipo: 'boleto',
              descricao: data.descricao
            }
          }
        });

        if (asaasError) throw asaasError;

        boletoData = {
          ...boletoData,
          asaas_id: asaasResult.id,
          external_provider: 'asaas',
          linha_digitavel: asaasResult.identificationField || generateLinhaDigitavel(data.valor, data.vencimento),
          codigo_barras: asaasResult.barCode || generateCodigoBarras(data.valor)

        };
      } else {
        boletoData.linha_digitavel = generateLinhaDigitavel(data.valor, data.vencimento);
        boletoData.codigo_barras = generateCodigoBarras(data.valor);
      }

      const { data: newBoleto, error } = await supabase
        .from('boletos')
        .insert(boletoData)
        .select()
        .single();

      if (error) throw error;
      return newBoleto;
    },
    onSuccess: async (data) => {
      // Registrar evento de envio de boleto
      if (data?.conta_receber_id) {
        const evento = await registrarEventoFinanceiro('receber', {
          contaId: data.conta_receber_id,
          tipo: 'envio_boleto',
          mensagem: `Boleto #${data.numero} gerado e enviado para o cliente.`,
          metadata: { boleto_id: data.id, numero: data.numero },
        });
        if (!evento.ok) {
          toast({
            title: 'Boleto gerado, mas sem registro na trilha',
            description: evento.error ?? 'Não foi possível registrar o evento de auditoria.',
            variant: 'destructive',
          });
        }
      }

      if (data?.conta_pagar_id) {
        const evento = await registrarEventoFinanceiro('pagar', {
          contaId: data.conta_pagar_id,
          tipo: 'envio_boleto',
          mensagem: `Boleto #${data.numero} gerado para pagamento de fornecedor.`,
          metadata: { boleto_id: data.id, numero: data.numero },
        });
        if (!evento.ok) {
          toast({
            title: 'Boleto gerado, mas sem registro na trilha',
            description: evento.error ?? 'Não foi possível registrar o evento de auditoria.',
            variant: 'destructive',
          });
        }
      }


      queryClient.invalidateQueries({ queryKey: ['boletos'] });
      toast({
        title: 'Boleto gerado',
        description: 'O boleto foi criado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao gerar boleto',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsCreating(false);
    },
  });

  // Update boleto status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, bitrix_status, eventos_pagamento }: { id: string; status: Boleto['status']; bitrix_status?: string; eventos_pagamento?: any[] }) => {
      const { data: currentBoleto } = await supabase.from('boletos').select('rastreio_status, eventos_pagamento').eq('id', id).single();
      const currentRastreio = Array.isArray(currentBoleto?.rastreio_status) ? currentBoleto.rastreio_status : [];
      const currentEventos = Array.isArray(currentBoleto?.eventos_pagamento) ? currentBoleto.eventos_pagamento : [];
      
      const newRastreio = [
        ...currentRastreio,
        { status, data: new Date().toISOString(), detalhe: `Status alterado para ${status}${bitrix_status ? ` (Bitrix: ${bitrix_status})` : ''}` }
      ];

      const updateData: any = { status, rastreio_status: newRastreio };
      if (bitrix_status) updateData.bitrix_status = bitrix_status;
      if (eventos_pagamento) updateData.eventos_pagamento = [...currentEventos, ...eventos_pagamento];

      const { error } = await supabase
        .from('boletos')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Registrar no novo histórico de cobranças
      await supabase.from('historico_cobrancas_boletos').insert({
        boleto_id: id,
        tipo_evento: `status_${status}`,
        descricao: `Status do boleto atualizado para ${status}`,
        metadados: { bitrix_status, progress: newRastreio.length }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boletos'] });
      toast({
        title: 'Status atualizado',
        description: 'O status e rastreio do boleto foram atualizados.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Bitrix24 Integration
  const syncBitrixBoleto = useMutation({
    mutationFn: async (id: string) => {
      const { data: boleto, error: fetchError } = await supabase
        .from('boletos')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;

      // Invoke Bitrix24 sync edge function
      const { data: result, error: invokeError } = await supabase.functions.invoke('bitrix24-sync', {
        body: { action: 'sync_boleto', boleto }
      });

      if (invokeError) throw invokeError;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['boletos'] });
      toast({
        title: 'Sincronizado com Bitrix24',
        description: `Boleto vinculado ao Bitrix24 (ID: ${data.bitrix_id})`,
      });
    }
  });

  // Cancel boleto mutation
  const cancelBoletoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('boletos')
        .update({ status: 'cancelado' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boletos'] });
      toast({
        title: 'Boleto cancelado',
        description: 'O boleto foi cancelado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cancelar boleto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Calculate stats
  const stats = {
    totalGerado: boletos?.reduce((acc, b) => acc + Number(b.valor), 0) || 0,
    totalPago: boletos?.filter(b => b.status === 'pago').reduce((acc, b) => acc + Number(b.valor), 0) || 0,
    totalVencido: boletos?.filter(b => b.status === 'vencido').reduce((acc, b) => acc + Number(b.valor), 0) || 0,
    totalPendente: boletos?.filter(b => ['gerado', 'enviado'].includes(b.status)).reduce((acc, b) => acc + Number(b.valor), 0) || 0,
    countGerado: boletos?.filter(b => b.status === 'gerado').length || 0,
    countEnviado: boletos?.filter(b => b.status === 'enviado').length || 0,
    countPago: boletos?.filter(b => b.status === 'pago').length || 0,
    countVencido: boletos?.filter(b => b.status === 'vencido').length || 0,
  };

  return {
    boletos,
    isLoading,
    error,
    isCreating,
    stats,
    empresas,
    contasBancarias,
    createBoleto: createBoletoMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    cancelBoleto: cancelBoletoMutation.mutate,
    syncBitrixBoleto: syncBitrixBoleto.mutate,
    isSyncingBitrix: syncBitrixBoleto.isPending,
    refetch,
  };
}

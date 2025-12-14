import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  status: 'gerado' | 'enviado' | 'pago' | 'vencido' | 'cancelado';
  descricao: string | null;
  observacoes: string | null;
  conta_receber_id: string | null;
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
}

function generateLinhaDigitavel(valor: number, vencimento: string): string {
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
      const linhaDigitavel = generateLinhaDigitavel(data.valor, data.vencimento);
      const codigoBarras = generateCodigoBarras(data.valor);

      const boletoData = {
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
        linha_digitavel: linhaDigitavel,
        codigo_barras: codigoBarras,
        status: 'gerado',
        descricao: data.descricao || null,
        conta_receber_id: data.conta_receber_id || null,
        conta_bancaria_id: data.conta_bancaria_id,
        empresa_id: data.empresa_id,
        created_by: user.id,
      };

      const { data: newBoleto, error } = await supabase
        .from('boletos')
        .insert(boletoData)
        .select()
        .single();

      if (error) throw error;
      return newBoleto;
    },
    onSuccess: () => {
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
    mutationFn: async ({ id, status }: { id: string; status: Boleto['status'] }) => {
      const { error } = await supabase
        .from('boletos')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boletos'] });
      toast({
        title: 'Status atualizado',
        description: 'O status do boleto foi atualizado.',
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
    refetch,
  };
}

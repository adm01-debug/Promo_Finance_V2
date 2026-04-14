import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, DollarSign } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useClientes, useCentrosCusto, useContasBancarias, useEmpresas } from '@/hooks/useFinancialData';
import { useVendedoresAtivos } from '@/hooks/useVendedores';
import { toast } from '@/hooks/use-toast';
import { useConfetti } from '@/hooks/useConfetti';
import { sounds } from '@/lib/sound-feedback';
import { logger } from '@/lib/logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ContaReceberFormFields } from './ContaReceberFormFields';

const contaReceberSchema = z.object({
  cliente_id: z.string().optional(),
  cliente_nome: z.string().min(2, 'Nome do cliente é obrigatório').max(200, 'Nome muito longo'),
  descricao: z.string().min(3, 'Descrição é obrigatória').max(500, 'Descrição muito longa'),
  valor: z.number().positive('Valor deve ser maior que zero').max(999999999, 'Valor muito alto'),
  data_vencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  data_emissao: z.string().optional(),
  empresa_id: z.string().min(1, 'Empresa é obrigatória'),
  centro_custo_id: z.string().optional(),
  conta_bancaria_id: z.string().optional(),
  vendedor_id: z.string().optional(),
  tipo_cobranca: z.enum(['boleto', 'pix', 'cartao', 'transferencia', 'dinheiro']),
  numero_documento: z.string().max(50).optional(),
  codigo_barras: z.string().max(100).optional(),
  chave_pix: z.string().max(100).optional(),
  link_boleto: z.string().url('URL inválida').max(500).optional().or(z.literal('')),
  observacoes: z.string().max(1000).optional(),
  recorrente: z.boolean().optional(),
  frequencia_recorrencia: z.string().optional(),
  parcelado: z.boolean().optional(),
  numero_parcelas: z.number().min(2).max(120).optional(),
});

type ContaReceberFormData = z.infer<typeof contaReceberSchema>;

interface ContaReceber {
  id: string; cliente_id: string | null; cliente_nome: string; descricao: string;
  valor: number; data_vencimento: string; data_emissao: string; empresa_id: string;
  centro_custo_id: string | null; conta_bancaria_id: string | null; tipo_cobranca: string;
  numero_documento: string | null; codigo_barras: string | null; chave_pix: string | null;
  link_boleto: string | null; observacoes: string | null;
}

interface ContaReceberFormProps {
  open: boolean; onOpenChange: (open: boolean) => void; conta?: ContaReceber | null;
}

export function ContaReceberForm({ open, onOpenChange, conta }: ContaReceberFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const confetti = useConfetti();
  const [showClienteSelect, setShowClienteSelect] = useState(false);
  const isEditing = !!conta;

  const { data: clientes = [] } = useClientes();
  const { data: centrosCusto = [] } = useCentrosCusto();
  const { data: contasBancarias = [] } = useContasBancarias();
  const { data: empresas = [] } = useEmpresas();
  const { data: vendedores = [] } = useVendedoresAtivos();

  const form = useForm<ContaReceberFormData>({
    resolver: zodResolver(contaReceberSchema),
    defaultValues: {
      cliente_nome: '', descricao: '', valor: 0, data_vencimento: '',
      data_emissao: new Date().toISOString().split('T')[0], empresa_id: '',
      tipo_cobranca: 'boleto', recorrente: false, parcelado: false, numero_parcelas: 2,
    },
  });

  const isParcelado = form.watch('parcelado');
  const numParcelas = form.watch('numero_parcelas') || 2;

  useEffect(() => {
    if (conta && open) {
      form.reset({
        cliente_id: conta.cliente_id || undefined, cliente_nome: conta.cliente_nome,
        descricao: conta.descricao, valor: conta.valor, data_vencimento: conta.data_vencimento,
        data_emissao: conta.data_emissao, empresa_id: conta.empresa_id,
        centro_custo_id: conta.centro_custo_id || undefined, conta_bancaria_id: conta.conta_bancaria_id || undefined,
        tipo_cobranca: conta.tipo_cobranca as ContaReceberFormData['tipo_cobranca'],
        numero_documento: conta.numero_documento || undefined, codigo_barras: conta.codigo_barras || undefined,
        chave_pix: conta.chave_pix || undefined, link_boleto: conta.link_boleto || undefined,
        observacoes: conta.observacoes || undefined, recorrente: false, parcelado: false, numero_parcelas: 2,
      });
      if (conta.cliente_id) setShowClienteSelect(true);
    } else if (!conta && open) {
      form.reset({
        cliente_nome: '', descricao: '', valor: 0, data_vencimento: '',
        data_emissao: new Date().toISOString().split('T')[0], empresa_id: '',
        tipo_cobranca: 'boleto', recorrente: false, parcelado: false, numero_parcelas: 2,
      });
      setShowClienteSelect(false);
    }
  }, [conta, open, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ContaReceberFormData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      if (data.parcelado && data.numero_parcelas && data.numero_parcelas > 1) {
        const parcelas = [];
        const baseDate = new Date(data.data_vencimento);
        const valorParc = Math.round((data.valor / data.numero_parcelas) * 100) / 100;
        for (let i = 0; i < data.numero_parcelas; i++) {
          const venc = new Date(baseDate); venc.setMonth(venc.getMonth() + i);
          parcelas.push({
            cliente_id: data.cliente_id || null, cliente_nome: data.cliente_nome,
            descricao: `${data.descricao} (${i + 1}/${data.numero_parcelas})`,
            valor: i === data.numero_parcelas - 1 ? Math.round((data.valor - valorParc * (data.numero_parcelas - 1)) * 100) / 100 : valorParc,
            data_vencimento: venc.toISOString().split('T')[0],
            data_emissao: data.data_emissao || new Date().toISOString().split('T')[0],
            empresa_id: data.empresa_id, centro_custo_id: data.centro_custo_id || null,
            conta_bancaria_id: data.conta_bancaria_id || null, vendedor_id: data.vendedor_id || null,
            tipo_cobranca: data.tipo_cobranca, numero_documento: data.numero_documento || null,
            observacoes: data.observacoes || null, created_by: user.id,
            status: 'pendente' as const, etapa_cobranca: 'preventiva' as const,
            numero_parcela_atual: i + 1, total_parcelas: data.numero_parcelas,
          });
        }
        const { error } = await supabase.from('contas_receber').insert(parcelas);
        if (error) throw error; return;
      }
      const { error } = await supabase.from('contas_receber').insert({
        cliente_id: data.cliente_id || null, cliente_nome: data.cliente_nome, descricao: data.descricao,
        valor: data.valor, data_vencimento: data.data_vencimento,
        data_emissao: data.data_emissao || new Date().toISOString().split('T')[0],
        empresa_id: data.empresa_id, centro_custo_id: data.centro_custo_id || null,
        conta_bancaria_id: data.conta_bancaria_id || null, vendedor_id: data.vendedor_id || null,
        tipo_cobranca: data.tipo_cobranca, numero_documento: data.numero_documento || null,
        codigo_barras: data.codigo_barras || null, chave_pix: data.chave_pix || null,
        link_boleto: data.link_boleto || null, observacoes: data.observacoes || null,
        created_by: user.id, status: 'pendente', etapa_cobranca: 'preventiva',
        recorrente: data.recorrente || false,
        frequencia_recorrencia: data.recorrente ? data.frequencia_recorrencia || 'mensal' : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contas-receber'] }); sounds.success(); confetti.celebrateReceipt(); form.reset(); onOpenChange(false); },
    onError: (error: unknown) => { sounds.error(); logger.error('Error creating conta receber:', error); toast({ title: 'Erro ao criar conta', description: 'Tente novamente.', variant: 'destructive' }); },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ContaReceberFormData) => {
      if (!conta) throw new Error('Conta não encontrada');
      const { error } = await supabase.from('contas_receber').update({
        cliente_id: data.cliente_id || null, cliente_nome: data.cliente_nome, descricao: data.descricao,
        valor: data.valor, data_vencimento: data.data_vencimento,
        data_emissao: data.data_emissao || new Date().toISOString().split('T')[0],
        empresa_id: data.empresa_id, centro_custo_id: data.centro_custo_id || null,
        conta_bancaria_id: data.conta_bancaria_id || null, tipo_cobranca: data.tipo_cobranca,
        numero_documento: data.numero_documento || null, codigo_barras: data.codigo_barras || null,
        chave_pix: data.chave_pix || null, link_boleto: data.link_boleto || null,
        observacoes: data.observacoes || null,
      }).eq('id', conta.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contas-receber'] }); toast({ title: 'Conta atualizada', description: 'Alterações salvas.' }); onOpenChange(false); },
    onError: (error: unknown) => { logger.error('Error updating conta receber:', error); toast({ title: 'Erro ao atualizar', description: 'Tente novamente.', variant: 'destructive' }); },
  });

  const onSubmit = (data: ContaReceberFormData) => { isEditing ? updateMutation.mutate(data) : createMutation.mutate(data); };

  const handleClienteSelect = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId);
    if (cliente) { form.setValue('cliente_id', clienteId); form.setValue('cliente_nome', cliente.razao_social); }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", isEditing ? "bg-secondary/10" : "bg-success/10")}>
              {isEditing ? <Edit className="h-5 w-5 text-secondary" /> : <DollarSign className="h-5 w-5 text-success" />}
            </div>
            {isEditing ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ContaReceberFormFields
              form={form} isEditing={isEditing} clientes={clientes} empresas={empresas}
              centrosCusto={centrosCusto} contasBancarias={contasBancarias} vendedores={vendedores}
              showClienteSelect={showClienteSelect} setShowClienteSelect={setShowClienteSelect}
              onClienteSelect={handleClienteSelect}
            />
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <ActionButton type="submit" state={isPending ? 'loading' : 'idle'} loadingText="Salvando..." successText="Salvo!"
                className={cn("gap-2 shadow-lg", isEditing ? "bg-gradient-to-r from-secondary to-secondary/80 shadow-secondary/25" : "bg-gradient-to-r from-success to-success/80 shadow-success/25 text-success-foreground")}>
                {isEditing ? 'Salvar Alterações' : isParcelado ? `Criar ${numParcelas} Parcelas` : 'Criar Conta'}
              </ActionButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

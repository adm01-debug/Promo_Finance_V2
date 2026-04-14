import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, DollarSign, Edit, Scan } from 'lucide-react';
import { ActionButton, useActionState } from '@/components/ui/action-button';
import { LeitorCodigoBarras } from './LeitorCodigoBarras';
import { DadosBoleto } from '@/lib/barcode-parser';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFornecedores, useCentrosCusto, useContasBancarias, useEmpresas } from '@/hooks/useFinancialData';
import { toast } from '@/hooks/use-toast';
import { useCelebrations } from '@/components/wrappers/CelebrationActions';
import { sounds } from '@/lib/sound-feedback';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { ContaPagarFormFields } from './ContaPagarFormFields';

const contaPagarSchema = z.object({
  fornecedor_id: z.string().optional(),
  fornecedor_nome: z.string().min(2, 'Nome do fornecedor é obrigatório').max(200, 'Nome muito longo'),
  descricao: z.string().min(3, 'Descrição é obrigatória').max(500, 'Descrição muito longa'),
  valor: z.number().positive('Valor deve ser maior que zero').max(999999999, 'Valor muito alto'),
  data_vencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  data_emissao: z.string().optional(),
  empresa_id: z.string().min(1, 'Empresa é obrigatória'),
  centro_custo_id: z.string().optional(),
  conta_bancaria_id: z.string().optional(),
  tipo_cobranca: z.enum(['boleto', 'pix', 'cartao', 'transferencia', 'dinheiro']),
  numero_documento: z.string().max(50, 'Número muito longo').optional(),
  codigo_barras: z.string().max(100, 'Código muito longo').optional(),
  observacoes: z.string().max(1000, 'Observações muito longas').optional(),
  recorrente: z.boolean().default(false),
});

type ContaPagarFormData = z.infer<typeof contaPagarSchema>;

interface ContaPagar {
  id: string; fornecedor_id: string | null; fornecedor_nome: string; descricao: string;
  valor: number; data_vencimento: string; data_emissao: string; empresa_id: string;
  centro_custo_id: string | null; conta_bancaria_id: string | null;
  tipo_cobranca: 'boleto' | 'pix' | 'cartao' | 'transferencia' | 'dinheiro';
  numero_documento: string | null; codigo_barras: string | null; observacoes: string | null; recorrente: boolean;
}

interface ContaPagarFormProps {
  open: boolean; onOpenChange: (open: boolean) => void; conta?: ContaPagar | null;
}

export function ContaPagarForm({ open, onOpenChange, conta }: ContaPagarFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { celebrateSuccess } = useCelebrations();
  const [showFornecedorSelect, setShowFornecedorSelect] = useState(false);
  const [showLeitorCodigoBarras, setShowLeitorCodigoBarras] = useState(false);
  const isEditing = !!conta;

  const { data: fornecedores = [] } = useFornecedores();
  const { data: centrosCusto = [] } = useCentrosCusto();
  const { data: contasBancarias = [] } = useContasBancarias();
  const { data: empresas = [] } = useEmpresas();

  const form = useForm<ContaPagarFormData>({
    resolver: zodResolver(contaPagarSchema),
    defaultValues: { fornecedor_nome: '', descricao: '', valor: 0, data_vencimento: '', data_emissao: new Date().toISOString().split('T')[0], empresa_id: '', tipo_cobranca: 'boleto', recorrente: false },
  });

  useEffect(() => {
    if (conta && open) {
      form.reset({ fornecedor_id: conta.fornecedor_id || undefined, fornecedor_nome: conta.fornecedor_nome, descricao: conta.descricao, valor: conta.valor, data_vencimento: conta.data_vencimento, data_emissao: conta.data_emissao, empresa_id: conta.empresa_id, centro_custo_id: conta.centro_custo_id || undefined, conta_bancaria_id: conta.conta_bancaria_id || undefined, tipo_cobranca: conta.tipo_cobranca, numero_documento: conta.numero_documento || undefined, codigo_barras: conta.codigo_barras || undefined, observacoes: conta.observacoes || undefined, recorrente: conta.recorrente });
      if (conta.fornecedor_id) setShowFornecedorSelect(true);
    } else if (!conta && open) {
      form.reset({ fornecedor_nome: '', descricao: '', valor: 0, data_vencimento: '', data_emissao: new Date().toISOString().split('T')[0], empresa_id: '', tipo_cobranca: 'boleto', recorrente: false });
      setShowFornecedorSelect(false);
    }
  }, [conta, open, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ContaPagarFormData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      const { error } = await supabase.from('contas_pagar').insert({ fornecedor_id: data.fornecedor_id || null, fornecedor_nome: data.fornecedor_nome, descricao: data.descricao, valor: data.valor, data_vencimento: data.data_vencimento, data_emissao: data.data_emissao || new Date().toISOString().split('T')[0], empresa_id: data.empresa_id, centro_custo_id: data.centro_custo_id || null, conta_bancaria_id: data.conta_bancaria_id || null, tipo_cobranca: data.tipo_cobranca, numero_documento: data.numero_documento || null, codigo_barras: data.codigo_barras || null, observacoes: data.observacoes || null, recorrente: data.recorrente, created_by: user.id, status: 'pendente' });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contas-pagar'] }); sounds.success(); celebrateSuccess('Conta criada com sucesso!'); form.reset(); onOpenChange(false); },
    onError: (error: unknown) => { sounds.error(); logger.error('Error creating conta pagar:', error); toast({ title: 'Erro ao criar conta', description: 'Não foi possível criar a conta. Tente novamente.', variant: 'destructive' }); },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ContaPagarFormData) => {
      if (!conta) throw new Error('Conta não encontrada');
      const { error } = await supabase.from('contas_pagar').update({ fornecedor_id: data.fornecedor_id || null, fornecedor_nome: data.fornecedor_nome, descricao: data.descricao, valor: data.valor, data_vencimento: data.data_vencimento, data_emissao: data.data_emissao || new Date().toISOString().split('T')[0], empresa_id: data.empresa_id, centro_custo_id: data.centro_custo_id || null, conta_bancaria_id: data.conta_bancaria_id || null, tipo_cobranca: data.tipo_cobranca, numero_documento: data.numero_documento || null, codigo_barras: data.codigo_barras || null, observacoes: data.observacoes || null, recorrente: data.recorrente }).eq('id', conta.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contas-pagar'] }); sounds.success(); celebrateSuccess('Conta atualizada com sucesso!'); onOpenChange(false); },
    onError: (error: unknown) => { sounds.error(); logger.error('Error updating conta pagar:', error); toast({ title: 'Erro ao atualizar conta', description: 'Não foi possível salvar as alterações. Tente novamente.', variant: 'destructive' }); },
  });

  const onSubmit = (data: ContaPagarFormData) => { if (isEditing) updateMutation.mutate(data); else createMutation.mutate(data); };

  const handleFornecedorSelect = (fornecedorId: string) => {
    const fornecedor = fornecedores.find((f) => f.id === fornecedorId);
    if (fornecedor) { form.setValue('fornecedor_id', fornecedorId); form.setValue('fornecedor_nome', fornecedor.razao_social); }
  };

  const handleBoletoDetected = (dados: DadosBoleto) => {
    if (dados.valor > 0) form.setValue('valor', dados.valor);
    if (dados.dataVencimento) form.setValue('data_vencimento', dados.dataVencimento.toISOString().split('T')[0]);
    if (dados.codigoBarras) form.setValue('codigo_barras', dados.codigoBarras);
    form.setValue('tipo_cobranca', 'boleto');
    if (!form.getValues('descricao') && dados.banco) form.setValue('descricao', `Boleto ${dados.banco}`);
    toast({ title: 'Dados preenchidos automaticamente', description: `Boleto do ${dados.banco} no valor de R$ ${dados.valor.toFixed(2)}` });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <LeitorCodigoBarras open={showLeitorCodigoBarras} onOpenChange={setShowLeitorCodigoBarras} onBoletoDetected={handleBoletoDetected} />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-display">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", isEditing ? "bg-secondary/10" : "bg-primary/10")}>
                {isEditing ? <Edit className="h-5 w-5 text-secondary" /> : <DollarSign className="h-5 w-5 text-primary" />}
              </div>
              {isEditing ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
            </DialogTitle>
            {!isEditing && (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowLeitorCodigoBarras(true)} className="gap-2">
                <Scan className="h-4 w-4" />Ler Código de Barras
              </Button>
            )}
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Fornecedor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium">Fornecedor</FormLabel>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowFornecedorSelect(!showFornecedorSelect)} className="text-xs h-7">
                    {showFornecedorSelect ? 'Digitar manualmente' : 'Selecionar cadastrado'}
                  </Button>
                </div>
                <AnimatePresence mode="wait">
                  {showFornecedorSelect ? (
                    <motion.div key="select" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <Select onValueChange={handleFornecedorSelect} value={form.watch('fornecedor_id')}>
                        <SelectTrigger><SelectValue placeholder="Selecione um fornecedor" /></SelectTrigger>
                        <SelectContent>{fornecedores.map((f) => <SelectItem key={f.id} value={f.id}>{f.razao_social}{f.nome_fantasia && ` (${f.nome_fantasia})`}</SelectItem>)}</SelectContent>
                      </Select>
                    </motion.div>
                  ) : (
                    <motion.div key="input" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                      <FormField control={form.control} name="fornecedor_nome" render={({ field }) => (
                        <FormItem><FormControl><div className="relative"><Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input {...field} placeholder="Nome do fornecedor" className="pl-10" /></div></FormControl><FormMessage /></FormItem>
                      )} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <ContaPagarFormFields form={form} empresas={empresas} centrosCusto={centrosCusto} contasBancarias={contasBancarias} />

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <ActionButton type="submit" state={isPending ? 'loading' : 'idle'} loadingText="Salvando..." successText="Salvo!"
                  className={cn("gap-2 shadow-lg", isEditing ? "bg-gradient-to-r from-secondary to-secondary/80 shadow-secondary/25" : "bg-gradient-to-r from-primary to-primary/80 shadow-primary/25")}>
                  {isEditing ? 'Salvar Alterações' : 'Criar Conta'}
                </ActionButton>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

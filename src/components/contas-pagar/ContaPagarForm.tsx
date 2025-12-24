import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Calendar, DollarSign, FileText, Tag, CreditCard, Banknote, QrCode, Wallet, Edit, Scan } from 'lucide-react';
import { ActionButton, useActionState } from '@/components/ui/action-button';
import { FieldLabel } from '@/components/ui/info-tooltip';
import { LeitorCodigoBarras } from './LeitorCodigoBarras';
import { DadosBoleto } from '@/lib/barcode-parser';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFornecedores, useCentrosCusto, useContasBancarias, useEmpresas } from '@/hooks/useFinancialData';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

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
  id: string;
  fornecedor_id: string | null;
  fornecedor_nome: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_emissao: string;
  empresa_id: string;
  centro_custo_id: string | null;
  conta_bancaria_id: string | null;
  tipo_cobranca: string;
  numero_documento: string | null;
  codigo_barras: string | null;
  observacoes: string | null;
  recorrente: boolean;
}

interface ContaPagarFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta?: ContaPagar | null;
}

const tipoCobrancaOptions = [
  { value: 'boleto', label: 'Boleto', icon: Banknote },
  { value: 'pix', label: 'PIX', icon: QrCode },
  { value: 'cartao', label: 'Cartão', icon: CreditCard },
  { value: 'transferencia', label: 'Transferência', icon: Building2 },
  { value: 'dinheiro', label: 'Dinheiro', icon: Wallet },
];

export function ContaPagarForm({ open, onOpenChange, conta }: ContaPagarFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showFornecedorSelect, setShowFornecedorSelect] = useState(false);
  const [showLeitorCodigoBarras, setShowLeitorCodigoBarras] = useState(false);
  const isEditing = !!conta;

  const { data: fornecedores = [] } = useFornecedores();
  const { data: centrosCusto = [] } = useCentrosCusto();
  const { data: contasBancarias = [] } = useContasBancarias();
  const { data: empresas = [] } = useEmpresas();

  const form = useForm<ContaPagarFormData>({
    resolver: zodResolver(contaPagarSchema),
    defaultValues: {
      fornecedor_nome: '',
      descricao: '',
      valor: 0,
      data_vencimento: '',
      data_emissao: new Date().toISOString().split('T')[0],
      empresa_id: '',
      tipo_cobranca: 'boleto',
      recorrente: false,
    },
  });

  useEffect(() => {
    if (conta && open) {
      form.reset({
        fornecedor_id: conta.fornecedor_id || undefined,
        fornecedor_nome: conta.fornecedor_nome,
        descricao: conta.descricao,
        valor: conta.valor,
        data_vencimento: conta.data_vencimento,
        data_emissao: conta.data_emissao,
        empresa_id: conta.empresa_id,
        centro_custo_id: conta.centro_custo_id || undefined,
        conta_bancaria_id: conta.conta_bancaria_id || undefined,
        tipo_cobranca: conta.tipo_cobranca as any,
        numero_documento: conta.numero_documento || undefined,
        codigo_barras: conta.codigo_barras || undefined,
        observacoes: conta.observacoes || undefined,
        recorrente: conta.recorrente,
      });
      if (conta.fornecedor_id) {
        setShowFornecedorSelect(true);
      }
    } else if (!conta && open) {
      form.reset({
        fornecedor_nome: '',
        descricao: '',
        valor: 0,
        data_vencimento: '',
        data_emissao: new Date().toISOString().split('T')[0],
        empresa_id: '',
        tipo_cobranca: 'boleto',
        recorrente: false,
      });
      setShowFornecedorSelect(false);
    }
  }, [conta, open, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ContaPagarFormData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('contas_pagar').insert({
        fornecedor_id: data.fornecedor_id || null,
        fornecedor_nome: data.fornecedor_nome,
        descricao: data.descricao,
        valor: data.valor,
        data_vencimento: data.data_vencimento,
        data_emissao: data.data_emissao || new Date().toISOString().split('T')[0],
        empresa_id: data.empresa_id,
        centro_custo_id: data.centro_custo_id || null,
        conta_bancaria_id: data.conta_bancaria_id || null,
        tipo_cobranca: data.tipo_cobranca,
        numero_documento: data.numero_documento || null,
        codigo_barras: data.codigo_barras || null,
        observacoes: data.observacoes || null,
        recorrente: data.recorrente,
        created_by: user.id,
        status: 'pendente',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast({
        title: 'Conta criada com sucesso',
        description: 'A conta a pagar foi adicionada ao sistema.',
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error creating conta pagar:', error);
      toast({
        title: 'Erro ao criar conta',
        description: 'Não foi possível criar a conta. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ContaPagarFormData) => {
      if (!conta) throw new Error('Conta não encontrada');

      const { error } = await supabase
        .from('contas_pagar')
        .update({
          fornecedor_id: data.fornecedor_id || null,
          fornecedor_nome: data.fornecedor_nome,
          descricao: data.descricao,
          valor: data.valor,
          data_vencimento: data.data_vencimento,
          data_emissao: data.data_emissao || new Date().toISOString().split('T')[0],
          empresa_id: data.empresa_id,
          centro_custo_id: data.centro_custo_id || null,
          conta_bancaria_id: data.conta_bancaria_id || null,
          tipo_cobranca: data.tipo_cobranca,
          numero_documento: data.numero_documento || null,
          codigo_barras: data.codigo_barras || null,
          observacoes: data.observacoes || null,
          recorrente: data.recorrente,
        })
        .eq('id', conta.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      toast({
        title: 'Conta atualizada',
        description: 'As alterações foram salvas com sucesso.',
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating conta pagar:', error);
      toast({
        title: 'Erro ao atualizar conta',
        description: 'Não foi possível salvar as alterações. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ContaPagarFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleFornecedorSelect = (fornecedorId: string) => {
    const fornecedor = fornecedores.find((f) => f.id === fornecedorId);
    if (fornecedor) {
      form.setValue('fornecedor_id', fornecedorId);
      form.setValue('fornecedor_nome', fornecedor.razao_social);
    }
  };

  const handleBoletoDetected = (dados: DadosBoleto) => {
    // Preencher automaticamente os campos com os dados do boleto
    if (dados.valor > 0) {
      form.setValue('valor', dados.valor);
    }
    if (dados.dataVencimento) {
      form.setValue('data_vencimento', dados.dataVencimento.toISOString().split('T')[0]);
    }
    if (dados.codigoBarras) {
      form.setValue('codigo_barras', dados.codigoBarras);
    }
    // Definir tipo como boleto
    form.setValue('tipo_cobranca', 'boleto');
    
    // Sugerir descrição baseada no banco
    if (!form.getValues('descricao') && dados.banco) {
      form.setValue('descricao', `Boleto ${dados.banco}`);
    }
    
    toast({
      title: 'Dados preenchidos automaticamente',
      description: `Boleto do ${dados.banco} no valor de R$ ${dados.valor.toFixed(2)}`,
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <LeitorCodigoBarras
        open={showLeitorCodigoBarras}
        onOpenChange={setShowLeitorCodigoBarras}
        onBoletoDetected={handleBoletoDetected}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center",
              isEditing ? "bg-secondary/10" : "bg-primary/10"
            )}>
              {isEditing ? (
                <Edit className="h-5 w-5 text-secondary" />
              ) : (
                <DollarSign className="h-5 w-5 text-primary" />
              )}
            </div>
            {isEditing ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
          </DialogTitle>
          {!isEditing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowLeitorCodigoBarras(true)}
              className="gap-2"
            >
              <Scan className="h-4 w-4" />
              Ler Código de Barras
            </Button>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Fornecedor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-medium">Fornecedor</FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFornecedorSelect(!showFornecedorSelect)}
                  className="text-xs h-7"
                >
                  {showFornecedorSelect ? 'Digitar manualmente' : 'Selecionar cadastrado'}
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {showFornecedorSelect ? (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Select onValueChange={handleFornecedorSelect} value={form.watch('fornecedor_id')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {fornecedores.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.razao_social}
                            {f.nome_fantasia && ` (${f.nome_fantasia})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                ) : (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <FormField
                      control={form.control}
                      name="fornecedor_nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} placeholder="Nome do fornecedor" className="pl-10" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Empresa e Centro de Custo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="empresa_id"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel label="Empresa" required tooltip="Empresa responsável por esta despesa" />
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {empresas.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.nome_fantasia || e.razao_social}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="centro_custo_id"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel label="Centro de Custo" tooltip="Classificação para controle orçamentário e análise de custos" />
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {centrosCusto.map((cc) => (
                          <SelectItem key={cc.id} value={cc.id}>
                            {cc.codigo} - {cc.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                  <FormItem>
                    <FieldLabel label="Descrição" required tooltip="Detalhamento da despesa para identificação futura" />
                  <FormControl>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea {...field} placeholder="Descrição da despesa" className="pl-10 min-h-[80px]" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valor e Tipo de Cobrança */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel label="Valor" required tooltip="Valor total da despesa em reais" />
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_cobranca"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel label="Tipo de Pagamento" tooltip="Forma de quitação desta despesa" />
                    <div className="flex gap-2 flex-wrap">
                      {tipoCobrancaOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = field.value === option.value;
                        return (
                          <Button
                            key={option.value}
                            type="button"
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => field.onChange(option.value)}
                            className={cn(
                              'gap-1.5 transition-all',
                              isSelected && 'shadow-lg shadow-primary/25'
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {option.label}
                          </Button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_vencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="date" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_emissao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Emissão</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="date" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Conta Bancária e Número do Documento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="conta_bancaria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta Bancária</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contasBancarias.map((cb: any) => (
                          <SelectItem key={cb.id} value={cb.id}>
                            {cb.banco} - Ag: {cb.agencia} / CC: {cb.conta}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numero_documento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Documento</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input {...field} placeholder="NF, Fatura, etc." className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Código de Barras */}
            <FormField
              control={form.control}
              name="codigo_barras"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Barras / Linha Digitável</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Digite o código de barras ou linha digitável" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Observações adicionais (opcional)" className="min-h-[60px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recorrente */}
            <FormField
              control={form.control}
              name="recorrente"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Conta Recorrente</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Marque se esta conta se repete mensalmente
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <ActionButton
                type="submit"
                state={isPending ? 'loading' : 'idle'}
                loadingText="Salvando..."
                successText="Salvo!"
                className={cn(
                  "gap-2 shadow-lg",
                  isEditing 
                    ? "bg-gradient-to-r from-secondary to-secondary/80 shadow-secondary/25" 
                    : "bg-gradient-to-r from-primary to-primary/80 shadow-primary/25"
                )}
              >
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

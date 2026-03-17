import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Calendar, DollarSign, FileText, Tag, CreditCard, Banknote, QrCode, Wallet, Link2, User, Edit } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import { FieldLabel } from '@/components/ui/info-tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useClientes, useCentrosCusto, useContasBancarias, useEmpresas } from '@/hooks/useFinancialData';
import { toast } from '@/hooks/use-toast';
import { useConfetti } from '@/hooks/useConfetti';
import { sounds } from '@/lib/sound-feedback';
import { logger } from '@/lib/logger';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

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
  numero_documento: z.string().max(50, 'Número muito longo').optional(),
  codigo_barras: z.string().max(100, 'Código muito longo').optional(),
  chave_pix: z.string().max(100, 'Chave muito longa').optional(),
  link_boleto: z.string().url('URL inválida').max(500, 'URL muito longa').optional().or(z.literal('')),
  observacoes: z.string().max(1000, 'Observações muito longas').optional(),
});

type ContaReceberFormData = z.infer<typeof contaReceberSchema>;

interface ContaReceber {
  id: string;
  cliente_id: string | null;
  cliente_nome: string;
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
  chave_pix: string | null;
  link_boleto: string | null;
  observacoes: string | null;
}

interface ContaReceberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta?: ContaReceber | null;
}

const tipoCobrancaOptions = [
  { value: 'boleto', label: 'Boleto', icon: Banknote },
  { value: 'pix', label: 'PIX', icon: QrCode },
  { value: 'cartao', label: 'Cartão', icon: CreditCard },
  { value: 'transferencia', label: 'Transferência', icon: Building2 },
  { value: 'dinheiro', label: 'Dinheiro', icon: Wallet },
];

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

  const form = useForm<ContaReceberFormData>({
    resolver: zodResolver(contaReceberSchema),
    defaultValues: {
      cliente_nome: '',
      descricao: '',
      valor: 0,
      data_vencimento: '',
      data_emissao: new Date().toISOString().split('T')[0],
      empresa_id: '',
      tipo_cobranca: 'boleto',
    },
  });

  const tipoCobranca = form.watch('tipo_cobranca');

  useEffect(() => {
    if (conta && open) {
      form.reset({
        cliente_id: conta.cliente_id || undefined,
        cliente_nome: conta.cliente_nome,
        descricao: conta.descricao,
        valor: conta.valor,
        data_vencimento: conta.data_vencimento,
        data_emissao: conta.data_emissao,
        empresa_id: conta.empresa_id,
        centro_custo_id: conta.centro_custo_id || undefined,
        conta_bancaria_id: conta.conta_bancaria_id || undefined,
        tipo_cobranca: conta.tipo_cobranca as ContaReceberFormData['tipo_cobranca'],
        numero_documento: conta.numero_documento || undefined,
        codigo_barras: conta.codigo_barras || undefined,
        chave_pix: conta.chave_pix || undefined,
        link_boleto: conta.link_boleto || undefined,
        observacoes: conta.observacoes || undefined,
      });
      if (conta.cliente_id) {
        setShowClienteSelect(true);
      }
    } else if (!conta && open) {
      form.reset({
        cliente_nome: '',
        descricao: '',
        valor: 0,
        data_vencimento: '',
        data_emissao: new Date().toISOString().split('T')[0],
        empresa_id: '',
        tipo_cobranca: 'boleto',
      });
      setShowClienteSelect(false);
    }
  }, [conta, open, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ContaReceberFormData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase.from('contas_receber').insert({
        cliente_id: data.cliente_id || null,
        cliente_nome: data.cliente_nome,
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
        chave_pix: data.chave_pix || null,
        link_boleto: data.link_boleto || null,
        observacoes: data.observacoes || null,
        created_by: user.id,
        status: 'pendente',
        etapa_cobranca: 'preventiva',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      sounds.success();
      confetti.celebrateReceipt();
      form.reset();
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      sounds.error();
      logger.error('Error creating conta receber:', error);
      toast({
        title: 'Erro ao criar conta',
        description: 'Não foi possível criar a conta. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ContaReceberFormData) => {
      if (!conta) throw new Error('Conta não encontrada');

      const { error } = await supabase
        .from('contas_receber')
        .update({
          cliente_id: data.cliente_id || null,
          cliente_nome: data.cliente_nome,
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
          chave_pix: data.chave_pix || null,
          link_boleto: data.link_boleto || null,
          observacoes: data.observacoes || null,
        })
        .eq('id', conta.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] });
      toast({
        title: 'Conta atualizada',
        description: 'As alterações foram salvas com sucesso.',
      });
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      logger.error('Error updating conta receber:', error);
      toast({
        title: 'Erro ao atualizar conta',
        description: 'Não foi possível salvar as alterações. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ContaReceberFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleClienteSelect = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId);
    if (cliente) {
      form.setValue('cliente_id', clienteId);
      form.setValue('cliente_nome', cliente.razao_social);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center",
              isEditing ? "bg-secondary/10" : "bg-success/10"
            )}>
              {isEditing ? (
                <Edit className="h-5 w-5 text-secondary" />
              ) : (
                <DollarSign className="h-5 w-5 text-success" />
              )}
            </div>
            {isEditing ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Cliente */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-medium">Cliente</FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClienteSelect(!showClienteSelect)}
                  className="text-xs h-7"
                >
                  {showClienteSelect ? 'Digitar manualmente' : 'Selecionar cadastrado'}
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {showClienteSelect ? (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Select onValueChange={handleClienteSelect} value={form.watch('cliente_id')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center gap-2">
                              <span>{c.razao_social}</span>
                              {c.score && (
                                <span className={cn(
                                  "text-xs font-medium",
                                  c.score >= 800 ? "text-success" :
                                  c.score >= 600 ? "text-warning" :
                                  "text-destructive"
                                )}>
                                  Score: {c.score}
                                </span>
                              )}
                            </div>
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
                      name="cliente_nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} placeholder="Nome do cliente" className="pl-10" />
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
                    <FieldLabel label="Empresa" required tooltip="Empresa que receberá este valor" />
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
                    <FieldLabel label="Centro de Custo" tooltip="Classificação para controle de receitas por área" />
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
                    <FieldLabel label="Descrição" required tooltip="Detalhamento do recebível para identificação" />
                  <FormControl>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea {...field} placeholder="Descrição do recebível" className="pl-10 min-h-[80px]" />
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
                    <FieldLabel label="Valor" required tooltip="Valor a receber em reais" />
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
                    <FieldLabel label="Tipo de Cobrança" tooltip="Forma como o cliente irá pagar" />
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
                        {contasBancarias.map((cb) => (
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

            {/* Campos condicionais baseados no tipo de cobrança */}
            <AnimatePresence mode="wait">
              {tipoCobranca === 'boleto' && (
                <motion.div
                  key="boleto-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="codigo_barras"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Linha Digitável</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Digite a linha digitável do boleto" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="link_boleto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link do Boleto</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} placeholder="https://..." className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}

              {tipoCobranca === 'pix' && (
                <motion.div
                  key="pix-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <FormField
                    control={form.control}
                    name="chave_pix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chave PIX</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} placeholder="CPF, CNPJ, E-mail, Telefone ou Chave Aleatória" className="pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>

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
                    : "bg-gradient-to-r from-success to-success/80 shadow-success/25 text-success-foreground"
                )}
              >
                {isEditing ? 'Salvar Alterações' : 'Criar Conta'}
              </ActionButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

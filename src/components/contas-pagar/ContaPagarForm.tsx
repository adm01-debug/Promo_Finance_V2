import { todayISOLocal } from '@/lib/formatters';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, DollarSign, Edit, Scan, Loader2 } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import { LeitorCodigoBarras } from './LeitorCodigoBarras';
import { DadosBoleto } from '@/lib/barcode-parser';
import { useAuth } from '@/hooks/useAuth';
import { 
  useFornecedores, 
  useCentrosCusto, 
  useContasBancarias, 
  useEmpresas,
  useCreateContaPagar,
  useUpdateContaPagar 
} from '@/hooks/useFinancialData';
import { useCategorias } from '@/hooks/useCategorias';
import { useProcessarNFOCR, type DadosExtraidosNF } from '@/hooks/useProcessarNFOCR';
import { toast } from '@/hooks/use-toast';
import { useCelebrations } from '@/components/wrappers/CelebrationActions';
import { sounds } from '@/lib/sound-feedback';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ContaPagarFormFields } from './ContaPagarFormFields';
import { AnexoList } from '@/components/financeiro/AnexoList';

const contaPagarSchema = z.object({
  fornecedor_id: z.string().optional(),
  fornecedor_nome: z.string().min(2, 'Nome do fornecedor é obrigatório').max(200, 'Nome muito longo'),
  descricao: z.string().min(3, 'Descrição é obrigatória').max(500, 'Descrição muito longa'),
  valor: z.number().positive('Valor deve ser maior que zero').max(999999999, 'Valor muito alto'),
  data_vencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  data_emissao: z.string().optional(),
  empresa_id: z.string().min(1, 'Empresa é obrigatória'),
  centro_custo_id: z.string().optional(),
  categoria_id: z.string().optional(),
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
  categoria_id: string | null; 
  conta_bancaria_id: string | null;
  tipo_cobranca: 'boleto' | 'pix' | 'cartao' | 'transferencia' | 'dinheiro';
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

export function ContaPagarForm({ open, onOpenChange, conta }: ContaPagarFormProps) {
  const { user } = useAuth();
  const { celebrateSuccess } = useCelebrations();
  const [showFornecedorSelect, setShowFornecedorSelect] = useState(false);
  const [showLeitorCodigoBarras, setShowLeitorCodigoBarras] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const isEditing = !!conta;

  const { processar: processarNF } = useProcessarNFOCR();
  const { data: fornecedores = [] } = useFornecedores();
  const { data: centrosCusto = [] } = useCentrosCusto();
  const { data: contasBancarias = [] } = useContasBancarias();
  const { data: empresas = [] } = useEmpresas();
  const { categoriasDespesa } = useCategorias();

  const createMutation = useCreateContaPagar();
  const updateMutation = useUpdateContaPagar();

  const form = useForm<ContaPagarFormData>({
    resolver: zodResolver(contaPagarSchema),
    defaultValues: { 
      fornecedor_nome: '', 
      descricao: '', 
      valor: 0, 
      data_vencimento: '', 
      data_emissao: todayISOLocal(), 
      empresa_id: '', 
      tipo_cobranca: 'boleto', 
      recorrente: false 
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
        categoria_id: conta.categoria_id || undefined, 
        conta_bancaria_id: conta.conta_bancaria_id || undefined, 
        tipo_cobranca: conta.tipo_cobranca, 
        numero_documento: conta.numero_documento || undefined, 
        codigo_barras: conta.codigo_barras || undefined, 
        observacoes: conta.observacoes || undefined, 
        recorrente: conta.recorrente 
      });
      if (conta.fornecedor_id) setShowFornecedorSelect(true);
    } else if (!conta && open) {
      form.reset({ 
        fornecedor_nome: '', 
        descricao: '', 
        valor: 0, 
        data_vencimento: '', 
        data_emissao: todayISOLocal(), 
        empresa_id: '', 
        tipo_cobranca: 'boleto', 
        recorrente: false 
      });
      setShowFornecedorSelect(false);
    }
  }, [conta, open, form]);

  const onSubmit = (data: ContaPagarFormData) => { 
    if (isEditing && conta) {
      updateMutation.mutate({ ...data, id: conta.id }, {
        onSuccess: () => {
          celebrateSuccess('Conta atualizada com sucesso!');
          onOpenChange(false);
        }
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          celebrateSuccess('Conta criada com sucesso!');
          form.reset();
          onOpenChange(false);
        }
      });
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
    if (dados.valor > 0) form.setValue('valor', dados.valor);
    if (dados.dataVencimento) form.setValue('data_vencimento', dados.dataVencimento.toISOString().split('T')[0]);
    if (dados.codigoBarras) form.setValue('codigo_barras', dados.codigoBarras);
    form.setValue('tipo_cobranca', 'boleto');
    if (!form.getValues('descricao') && dados.banco) form.setValue('descricao', `Boleto ${dados.banco}`);
    toast({ title: 'Dados preenchidos automaticamente', description: `Boleto do ${dados.banco} no valor de R$ ${dados.valor.toFixed(2)}` });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsOcrProcessing(true);
    try {
      const result = await processarNF.mutateAsync(file);
      if (result.success && result.dados_extraidos) {
        const dados = result.dados_extraidos;
        if (dados.valor_total) form.setValue('valor', dados.valor_total);
        if (dados.data_emissao) form.setValue('data_emissao', dados.data_emissao);
        if (dados.numero_nf) form.setValue('numero_documento', dados.numero_nf);
        if (dados.descricao) form.setValue('descricao', dados.descricao);
        if (dados.razao_social_emissor) {
          form.setValue('fornecedor_nome', dados.razao_social_emissor);
          // Tenta encontrar fornecedor pelo nome ou CNPJ se disponível futuramente
        }
        
        toast({ 
          title: 'IA: Extração concluída', 
          description: `Dados da NF #${dados.numero_nf || ''} extraídos com sucesso.` 
        });
        sounds.success();
      }
    } catch (error) {
      console.error('Erro no OCR:', error);
    } finally {
      setIsOcrProcessing(false);
      // Limpa o input para permitir selecionar o mesmo arquivo novamente
      event.target.value = '';
    }
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
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowLeitorCodigoBarras(true)} 
                  className="gap-2"
                >
                  <Scan className="h-4 w-4" />Ler Código de Barras
                </Button>
                
                <div className="relative">
                  <Input
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    id="ocr-upload"
                    onChange={handleFileUpload}
                    disabled={isOcrProcessing}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                    asChild
                  >
                    <label htmlFor="ocr-upload" className="cursor-pointer">
                      {isOcrProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
                      {isOcrProcessing ? 'Processando IA...' : 'Scan NF (IA)'}
                    </label>
                  </Button>
                </div>
              </div>
            )}
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

              <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                <ContaPagarFormFields form={form} empresas={empresas} centrosCusto={centrosCusto} contasBancarias={contasBancarias} categorias={categoriasDespesa} />
                
                {isEditing && conta?.id && (
                  <div className="pt-6 border-t border-white/5">
                    <AnexoList entidadeId={conta.id} entidadeTipo="contas_pagar" />
                  </div>
                )}
              </div>

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

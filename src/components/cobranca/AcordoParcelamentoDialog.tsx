import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calculator,
  CalendarIcon,
  FileText,
  Loader2,
  Percent,
  User,
  DollarSign,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useAcordosParcelamento, simularParcelamento } from '@/hooks/useAcordosParcelamento';
import { formatCurrency } from '@/lib/formatters';
import { useConfetti } from '@/hooks/useConfetti';
import { sounds } from '@/lib/sound-feedback';

const formSchema = z.object({
  cliente_nome: z.string().min(2, 'Nome do cliente é obrigatório'),
  cliente_email: z.string().email().optional().or(z.literal('')),
  cliente_telefone: z.string().optional(),
  valor_original: z.number().positive('Valor deve ser maior que zero'),
  desconto_percentual: z.number().min(0).max(100).default(0),
  juros_percentual: z.number().min(0).max(100).default(0),
  numero_parcelas: z.number().min(1).max(60),
  data_primeiro_vencimento: z.date(),
  dia_vencimento: z.number().min(1).max(31),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AcordoParcelamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contasReceberId?: string[];
  valorTotal?: number;
  clienteNome?: string;
  empresaId: string;
}

export function AcordoParcelamentoDialog({
  open,
  onOpenChange,
  contasReceberId = [],
  valorTotal = 0,
  clienteNome = '',
  empresaId,
}: AcordoParcelamentoDialogProps) {
  const { criarAcordo, isCriando } = useAcordosParcelamento();
  const { customCelebration } = useConfetti();
  const [numeroParcelas, setNumeroParcelas] = useState(3);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cliente_nome: clienteNome,
      cliente_email: '',
      cliente_telefone: '',
      valor_original: valorTotal,
      desconto_percentual: 0,
      juros_percentual: 0,
      numero_parcelas: 3,
      data_primeiro_vencimento: new Date(),
      dia_vencimento: 10,
      observacoes: '',
    },
  });

  // Atualizar form quando props mudam
  useMemo(() => {
    if (open) {
      form.reset({
        cliente_nome: clienteNome,
        valor_original: valorTotal,
        numero_parcelas: 3,
        data_primeiro_vencimento: new Date(),
        dia_vencimento: 10,
        desconto_percentual: 0,
        juros_percentual: 0,
      });
      setNumeroParcelas(3);
    }
  }, [open, clienteNome, valorTotal]);

  const valorOriginal = form.watch('valor_original');
  const descontoPercentual = form.watch('desconto_percentual');
  const jurosPercentual = form.watch('juros_percentual');

  const simulacao = useMemo(() => {
    return simularParcelamento({
      valorOriginal: valorOriginal || 0,
      descontoPercentual,
      jurosPercentual,
      numeroParcelas,
    });
  }, [valorOriginal, descontoPercentual, jurosPercentual, numeroParcelas]);

  const onSubmit = (values: FormValues) => {
    criarAcordo({
      cliente_nome: values.cliente_nome,
      cliente_email: values.cliente_email || null,
      cliente_telefone: values.cliente_telefone || null,
      valor_original: values.valor_original,
      desconto_percentual: values.desconto_percentual,
      juros_percentual: values.juros_percentual,
      numero_parcelas: numeroParcelas,
      data_primeiro_vencimento: format(values.data_primeiro_vencimento, 'yyyy-MM-dd'),
      dia_vencimento: values.dia_vencimento,
      observacoes: values.observacoes || null,
      contas_receber_ids: contasReceberId,
      empresa_id: empresaId,
    }, {
      onSuccess: () => {
        sounds.success();
        customCelebration({ 
          title: 'Acordo criado!', 
          description: `${numeroParcelas}x de ${formatCurrency(simulacao.valorParcela)}` 
        });
        form.reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Criar Acordo de Parcelamento
          </DialogTitle>
          <DialogDescription>
            Simule e crie um acordo de parcelamento para o cliente
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Dados do Cliente */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="cliente_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
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
              <FormField
                control={form.control}
                name="cliente_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@exemplo.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cliente_telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="(00) 00000-0000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Valores e Condições */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="valor_original"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Original da Dívida</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Desconto: {descontoPercentual}%
                  </Label>
                  <Slider
                    value={[descontoPercentual]}
                    onValueChange={([v]) => form.setValue('desconto_percentual', v)}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Juros: {jurosPercentual}%
                  </Label>
                  <Slider
                    value={[jurosPercentual]}
                    onValueChange={([v]) => form.setValue('juros_percentual', v)}
                    max={30}
                    step={0.5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Número de Parcelas: {numeroParcelas}x
                  </Label>
                  <Slider
                    value={[numeroParcelas]}
                    onValueChange={([v]) => {
                      setNumeroParcelas(v);
                      form.setValue('numero_parcelas', v);
                    }}
                    min={1}
                    max={24}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Simulação */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Simulação do Acordo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor original:</span>
                    <span>{formatCurrency(simulacao.valorOriginal)}</span>
                  </div>
                  {simulacao.desconto > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto ({descontoPercentual}%):</span>
                      <span>-{formatCurrency(simulacao.desconto)}</span>
                    </div>
                  )}
                  {simulacao.juros > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>Juros ({jurosPercentual}%):</span>
                      <span>+{formatCurrency(simulacao.juros)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-medium text-lg">
                    <span>Valor Total:</span>
                    <span>{formatCurrency(simulacao.valorTotal)}</span>
                  </div>
                  <div className="flex justify-between text-primary font-bold text-xl">
                    <span>{numeroParcelas}x de:</span>
                    <span>{formatCurrency(simulacao.valorParcela)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_primeiro_vencimento"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data do Primeiro Vencimento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dia_vencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia do Vencimento (mensal)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Informações adicionais sobre o acordo..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCriando}>
                {isCriando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Criar Acordo
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

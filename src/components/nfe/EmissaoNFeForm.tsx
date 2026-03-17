import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Send, FileText, Package, User, Building2, MapPin, Calculator, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';

const itemSchema = z.object({
  codigo: z.string().min(1, 'Código obrigatório'),
  descricao: z.string().min(1, 'Descrição obrigatória'),
  ncm: z.string().min(8, 'NCM deve ter 8 dígitos').max(8),
  cfop: z.string().min(4, 'CFOP deve ter 4 dígitos').max(4),
  unidade: z.string().min(1, 'Unidade obrigatória'),
  quantidade: z.number().positive('Quantidade deve ser > 0'),
  valorUnitario: z.number().positive('Valor deve ser > 0'),
  icmsAliquota: z.number().min(0).max(100).default(18),
  ipiAliquota: z.number().min(0).max(100).default(0),
});

const nfeSchema = z.object({
  naturezaOperacao: z.string().min(1, 'Natureza da operação obrigatória'),
  serie: z.string().default('1'),
  destinatarioCnpj: z.string().min(14, 'CNPJ/CPF obrigatório'),
  destinatarioNome: z.string().min(1, 'Nome obrigatório'),
  destinatarioEndereco: z.string().min(1, 'Endereço obrigatório'),
  destinatarioCidade: z.string().min(1, 'Cidade obrigatória'),
  destinatarioUF: z.string().min(2, 'UF obrigatória').max(2),
  destinatarioCEP: z.string().optional(),
  frete: z.number().min(0).default(0),
  seguro: z.number().min(0).default(0),
  desconto: z.number().min(0).default(0),
  informacoesAdicionais: z.string().optional(),
  itens: z.array(itemSchema).min(1, 'Adicione pelo menos 1 item'),
});

type NFeFormData = z.infer<typeof nfeSchema>;

interface EmissaoNFeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmitir: (data: NFeFormData & { totais: ReturnType<typeof calcularTotais> }) => void;
}

function calcularTotais(itens: NFeFormData['itens'], frete: number, seguro: number, desconto: number) {
  const valorProdutos = itens.reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0);
  const valorICMS = itens.reduce((acc, item) => acc + (item.quantidade * item.valorUnitario * item.icmsAliquota / 100), 0);
  const valorIPI = itens.reduce((acc, item) => acc + (item.quantidade * item.valorUnitario * item.ipiAliquota / 100), 0);
  const valorTotal = valorProdutos + frete + seguro - desconto + valorIPI;
  return { valorProdutos, valorICMS, valorIPI, valorTotal };
}

const naturezas = [
  'Venda de Mercadoria',
  'Venda de Produção',
  'Devolução de Compra',
  'Transferência',
  'Remessa para Conserto',
  'Bonificação',
  'Amostra Grátis',
];

const unidades = ['UN', 'KG', 'CX', 'PCT', 'KIT', 'MT', 'LT', 'M2', 'M3', 'PR'];

const ufs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export function EmissaoNFeForm({ open, onOpenChange, onEmitir }: EmissaoNFeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NFeFormData>({
    resolver: zodResolver(nfeSchema),
    defaultValues: {
      naturezaOperacao: 'Venda de Mercadoria',
      serie: '1',
      destinatarioCnpj: '',
      destinatarioNome: '',
      destinatarioEndereco: '',
      destinatarioCidade: '',
      destinatarioUF: 'SP',
      destinatarioCEP: '',
      frete: 0,
      seguro: 0,
      desconto: 0,
      informacoesAdicionais: '',
      itens: [{ codigo: '', descricao: '', ncm: '', cfop: '5102', unidade: 'UN', quantidade: 1, valorUnitario: 0, icmsAliquota: 18, ipiAliquota: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'itens' });
  const watchItens = form.watch('itens');
  const watchFrete = form.watch('frete');
  const watchSeguro = form.watch('seguro');
  const watchDesconto = form.watch('desconto');
  const totais = calcularTotais(watchItens || [], watchFrete || 0, watchSeguro || 0, watchDesconto || 0);

  const onSubmit = async (data: NFeFormData) => {
    setIsSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 1500)); // Simulate SEFAZ
      onEmitir({ ...data, totais: calcularTotais(data.itens, data.frete, data.seguro, data.desconto) });
      toast.success('NF-e emitida com sucesso!');
      onOpenChange(false);
      form.reset();
    } catch {
      toast.error('Erro ao emitir NF-e');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Emissão de NF-e
          </DialogTitle>
          <DialogDescription>Preencha os dados para emissão da nota fiscal eletrônica</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Dados Gerais */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" /> Dados Gerais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="naturezaOperacao" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Natureza da Operação</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {naturezas.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="serie" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Série</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            {/* Destinatário */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Destinatário</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="destinatarioCnpj" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ/CPF</FormLabel>
                    <FormControl><Input {...field} placeholder="00.000.000/0001-00" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="destinatarioNome" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social / Nome</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="destinatarioEndereco" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Endereço</FormLabel>
                    <FormControl><Input {...field} placeholder="Rua, número, bairro" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="destinatarioCidade" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="destinatarioUF" render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{ufs.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="destinatarioCEP" render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl><Input {...field} placeholder="00000-000" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            {/* Itens */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" /> Itens ({fields.length})</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ codigo: '', descricao: '', ncm: '', cfop: '5102', unidade: 'UN', quantidade: 1, valorUnitario: 0, icmsAliquota: 18, ipiAliquota: 0 })}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <motion.div key={field.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg border border-border/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Item {index + 1}</Badge>
                      {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <FormField control={form.control} name={`itens.${index}.codigo`} render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Código</FormLabel><FormControl><Input {...field} className="h-9" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`itens.${index}.descricao`} render={({ field }) => (
                        <FormItem className="md:col-span-3"><FormLabel className="text-xs">Descrição</FormLabel><FormControl><Input {...field} className="h-9" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`itens.${index}.ncm`} render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">NCM</FormLabel><FormControl><Input {...field} maxLength={8} className="h-9" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`itens.${index}.cfop`} render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">CFOP</FormLabel><FormControl><Input {...field} maxLength={4} className="h-9" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`itens.${index}.unidade`} render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Unidade</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="h-9"><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>{unidades.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`itens.${index}.quantidade`} render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Qtd</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} className="h-9" /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <FormField control={form.control} name={`itens.${index}.valorUnitario`} render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Valor Unit. (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(+e.target.value)} className="h-9" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`itens.${index}.icmsAliquota`} render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">ICMS (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(+e.target.value)} className="h-9" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`itens.${index}.ipiAliquota`} render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">IPI (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(+e.target.value)} className="h-9" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <div className="flex items-end">
                        <div className="p-2 rounded bg-muted/50 text-sm font-semibold w-full text-center">
                          {formatCurrency((watchItens?.[index]?.quantidade || 0) * (watchItens?.[index]?.valorUnitario || 0))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Valores Adicionais */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Calculator className="h-4 w-4" /> Valores Adicionais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="frete" render={({ field }) => (
                    <FormItem><FormLabel>Frete (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(+e.target.value)} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="seguro" render={({ field }) => (
                    <FormItem><FormLabel>Seguro (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(+e.target.value)} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="desconto" render={({ field }) => (
                    <FormItem><FormLabel>Desconto (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(+e.target.value)} /></FormControl></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="informacoesAdicionais" render={({ field }) => (
                  <FormItem className="mt-4"><FormLabel>Informações Adicionais</FormLabel><FormControl><Textarea {...field} rows={2} placeholder="Informações complementares..." /></FormControl></FormItem>
                )} />
              </CardContent>
            </Card>

            {/* Resumo */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div><p className="text-xs text-muted-foreground">Produtos</p><p className="font-bold">{formatCurrency(totais.valorProdutos)}</p></div>
                  <div><p className="text-xs text-muted-foreground">ICMS</p><p className="font-bold text-warning">{formatCurrency(totais.valorICMS)}</p></div>
                  <div><p className="text-xs text-muted-foreground">IPI</p><p className="font-bold text-warning">{formatCurrency(totais.valorIPI)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Frete/Seg/Desc</p><p className="font-bold">{formatCurrency((watchFrete || 0) + (watchSeguro || 0) - (watchDesconto || 0))}</p></div>
                  <div><p className="text-xs text-muted-foreground">TOTAL NF-e</p><p className="text-lg font-bold text-primary">{formatCurrency(totais.valorTotal)}</p></div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Emitir NF-e
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

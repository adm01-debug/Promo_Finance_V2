import { UseFormReturn } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Calendar, DollarSign, FileText, Tag, CreditCard, Banknote, QrCode, Wallet } from 'lucide-react';
import { FieldLabel } from '@/components/ui/info-tooltip';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const tipoCobrancaOptions = [
  { value: 'boleto', label: 'Boleto', icon: Banknote },
  { value: 'pix', label: 'PIX', icon: QrCode },
  { value: 'cartao', label: 'Cartão', icon: CreditCard },
  { value: 'transferencia', label: 'Transferência', icon: Building2 },
  { value: 'dinheiro', label: 'Dinheiro', icon: Wallet },
];

interface Props {
  form: UseFormReturn<any>;
  empresas: Array<{ id: string; nome_fantasia?: string | null; razao_social: string }>;
  centrosCusto: Array<{ id: string; codigo: string; nome: string }>;
  contasBancarias: Array<{ id: string; banco: string; agencia: string; conta: string }>;
}

export function ContaPagarFormFields({ form, empresas, centrosCusto, contasBancarias }: Props) {
  return (
    <>
      {/* Empresa e Centro de Custo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="empresa_id" render={({ field }) => (
          <FormItem>
            <FieldLabel label="Empresa" required tooltip="Empresa responsável por esta despesa" />
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger></FormControl>
              <SelectContent>{empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>)}</SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="centro_custo_id" render={({ field }) => (
          <FormItem>
            <FieldLabel label="Centro de Custo" tooltip="Classificação para controle orçamentário e análise de custos" />
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger></FormControl>
              <SelectContent>{centrosCusto.map((cc) => <SelectItem key={cc.id} value={cc.id}>{cc.codigo} - {cc.nome}</SelectItem>)}</SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      {/* Descrição */}
      <FormField control={form.control} name="descricao" render={({ field }) => (
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
      )} />

      {/* Valor e Tipo de Cobrança */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="valor" render={({ field }) => (
          <FormItem>
            <FieldLabel label="Valor" required tooltip="Valor total da despesa em reais" />
            <FormControl>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                <Input type="number" step="0.01" min="0" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} placeholder="0,00" className="pl-10" />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="tipo_cobranca" render={({ field }) => (
          <FormItem>
            <FieldLabel label="Tipo de Pagamento" tooltip="Forma de quitação desta despesa" />
            <div className="flex gap-2 flex-wrap">
              {tipoCobrancaOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = field.value === option.value;
                return (
                  <Button key={option.value} type="button" variant={isSelected ? 'default' : 'outline'} size="sm"
                    onClick={() => field.onChange(option.value)} className={cn('gap-1.5 transition-all', isSelected && 'shadow-lg shadow-primary/25')}>
                    <Icon className="h-4 w-4" /> {option.label}
                  </Button>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      {/* Datas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="data_vencimento" render={({ field }) => (
          <FormItem><FormLabel>Data de Vencimento *</FormLabel><FormControl><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="date" {...field} className="pl-10" /></div></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="data_emissao" render={({ field }) => (
          <FormItem><FormLabel>Data de Emissão</FormLabel><FormControl><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="date" {...field} className="pl-10" /></div></FormControl><FormMessage /></FormItem>
        )} />
      </div>

      {/* Conta Bancária e Número do Documento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="conta_bancaria_id" render={({ field }) => (
          <FormItem>
            <FormLabel>Conta Bancária</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger></FormControl>
              <SelectContent>{contasBancarias.map((cb) => <SelectItem key={cb.id} value={cb.id}>{cb.banco} - Ag: {cb.agencia} / CC: {cb.conta}</SelectItem>)}</SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="numero_documento" render={({ field }) => (
          <FormItem>
            <FormLabel>Número do Documento</FormLabel>
            <FormControl><div className="relative"><Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input {...field} placeholder="NF, Fatura, etc." className="pl-10" /></div></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      {/* Código de Barras */}
      <FormField control={form.control} name="codigo_barras" render={({ field }) => (
        <FormItem><FormLabel>Código de Barras / Linha Digitável</FormLabel><FormControl><Input {...field} placeholder="Digite o código de barras ou linha digitável" /></FormControl><FormMessage /></FormItem>
      )} />

      {/* Observações */}
      <FormField control={form.control} name="observacoes" render={({ field }) => (
        <FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea {...field} placeholder="Observações adicionais (opcional)" className="min-h-[60px]" /></FormControl><FormMessage /></FormItem>
      )} />

      {/* Recorrente */}
      <FormField control={form.control} name="recorrente" render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">Conta Recorrente</FormLabel>
            <p className="text-sm text-muted-foreground">Marque se esta conta se repete mensalmente</p>
          </div>
          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
        </FormItem>
      )} />
    </>
  );
}

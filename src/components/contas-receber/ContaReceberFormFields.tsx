import { useMemo, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Calendar, DollarSign, FileText, Tag, CreditCard, Banknote,
  QrCode, Wallet, Link2, User, RefreshCw, Layers, Search,
} from 'lucide-react';
import { FieldLabel } from '@/components/ui/info-tooltip';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const tipoCobrancaOptions = [
  { value: 'boleto', label: 'Boleto', icon: Banknote },
  { value: 'pix', label: 'PIX', icon: QrCode },
  { value: 'cartao', label: 'Cartão', icon: CreditCard },
  { value: 'transferencia', label: 'Transferência', icon: Building2 },
  { value: 'dinheiro', label: 'Dinheiro', icon: Wallet },
];

const frequenciaOptions = [
  { value: 'semanal', label: 'Semanal' }, { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' }, { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' }, { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

interface Props {
  form: UseFormReturn<any>;
  isEditing: boolean;
  clientes: any[];
  empresas: any[];
  centrosCusto: any[];
  contasBancarias: any[];
  vendedores: any[];
  showClienteSelect: boolean;
  setShowClienteSelect: (v: boolean) => void;
  onClienteSelect: (id: string) => void;
}

export function ContaReceberFormFields({
  form, isEditing, clientes, empresas, centrosCusto, contasBancarias, vendedores,
  showClienteSelect, setShowClienteSelect, onClienteSelect,
}: Props) {
  const [clienteSearch, setClienteSearch] = useState('');

  const filteredClientes = useMemo(() => {
    if (!clienteSearch) return clientes;
    const lower = clienteSearch.toLowerCase();
    return clientes.filter((c: any) =>
      c.razao_social.toLowerCase().includes(lower) ||
      (c.nome_fantasia && c.nome_fantasia.toLowerCase().includes(lower)) ||
      (c.cnpj_cpf && (c.cnpj_cpf as string).includes(clienteSearch))
    );
  }, [clientes, clienteSearch]);

  const tipoCobranca = form.watch('tipo_cobranca');
  const isRecorrente = form.watch('recorrente');
  const isParcelado = form.watch('parcelado');
  const valorTotal = form.watch('valor');
  const numParcelas = form.watch('numero_parcelas') || 2;
  const valorParcela = valorTotal && numParcelas ? valorTotal / numParcelas : 0;

  return (
    <>
      {/* Cliente */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <FormLabel className="text-sm font-medium">Cliente</FormLabel>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowClienteSelect(!showClienteSelect)} className="text-xs h-7">
            {showClienteSelect ? 'Digitar manualmente' : 'Selecionar cadastrado'}
          </Button>
        </div>
        <AnimatePresence mode="wait">
          {showClienteSelect ? (
            <motion.div key="select" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome, fantasia ou CNPJ..." value={clienteSearch} onChange={e => setClienteSearch(e.target.value)} className="pl-10" />
              </div>
              <Select onValueChange={onClienteSelect} value={form.watch('cliente_id')}>
                <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                <SelectContent>
                  {filteredClientes.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span>{c.razao_social}</span>
                        {c.nome_fantasia && <span className="text-xs text-muted-foreground">({c.nome_fantasia})</span>}
                        {c.score && (
                          <span className={cn("text-xs font-medium", c.score >= 800 ? "text-success" : c.score >= 600 ? "text-warning" : "text-destructive")}>
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
            <motion.div key="input" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <FormField control={form.control} name="cliente_nome" render={({ field }) => (
                <FormItem><FormControl>
                  <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input {...field} placeholder="Nome do cliente" className="pl-10" /></div>
                </FormControl><FormMessage /></FormItem>
              )} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Empresa e Centro de Custo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="empresa_id" render={({ field }) => (
          <FormItem>
            <FieldLabel label="Empresa" required tooltip="Empresa que receberá este valor" />
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger></FormControl>
              <SelectContent>{empresas.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>)}</SelectContent>
            </Select><FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="centro_custo_id" render={({ field }) => (
          <FormItem>
            <FieldLabel label="Centro de Custo" tooltip="Classificação para controle de receitas por área" />
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger></FormControl>
              <SelectContent>{centrosCusto.map((cc: any) => <SelectItem key={cc.id} value={cc.id}>{cc.codigo} - {cc.nome}</SelectItem>)}</SelectContent>
            </Select><FormMessage />
          </FormItem>
        )} />
      </div>

      {/* Vendedor */}
      {vendedores.length > 0 && (
        <FormField control={form.control} name="vendedor_id" render={({ field }) => (
          <FormItem>
            <FieldLabel label="Vendedor" tooltip="Vendedor responsável por esta conta" />
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione um vendedor" /></SelectTrigger></FormControl>
              <SelectContent>{vendedores.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}</SelectContent>
            </Select><FormMessage />
          </FormItem>
        )} />
      )}

      {/* Descrição */}
      <FormField control={form.control} name="descricao" render={({ field }) => (
        <FormItem>
          <FieldLabel label="Descrição" required tooltip="Detalhamento do recebível" />
          <FormControl>
            <div className="relative"><FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Textarea {...field} placeholder="Descrição do recebível" className="pl-10 min-h-[80px]" /></div>
          </FormControl><FormMessage />
        </FormItem>
      )} />

      {/* Valor e Tipo de Cobrança */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="valor" render={({ field }) => (
          <FormItem>
            <FieldLabel label="Valor" required tooltip="Valor a receber em reais" />
            <FormControl>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                <Input type="number" step="0.01" min="0" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} placeholder="0,00" className="pl-10" />
              </div>
            </FormControl><FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="tipo_cobranca" render={({ field }) => (
          <FormItem>
            <FieldLabel label="Tipo de Cobrança" tooltip="Forma como o cliente irá pagar" />
            <div className="flex gap-2 flex-wrap">
              {tipoCobrancaOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = field.value === option.value;
                return (
                  <Button key={option.value} type="button" variant={isSelected ? 'default' : 'outline'} size="sm"
                    onClick={() => field.onChange(option.value)}
                    className={cn('gap-1.5 transition-all', isSelected && 'shadow-lg shadow-primary/25')}>
                    <Icon className="h-4 w-4" /> {option.label}
                  </Button>
                );
              })}
            </div><FormMessage />
          </FormItem>
        )} />
      </div>

      {/* Datas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="data_vencimento" render={({ field }) => (
          <FormItem><FormLabel>Data de Vencimento *</FormLabel><FormControl>
            <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="date" {...field} className="pl-10" /></div>
          </FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="data_emissao" render={({ field }) => (
          <FormItem><FormLabel>Data de Emissão</FormLabel><FormControl>
            <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="date" {...field} className="pl-10" /></div>
          </FormControl><FormMessage /></FormItem>
        )} />
      </div>

      {/* Recorrência + Parcelamento */}
      {!isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/20">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch checked={isRecorrente} onCheckedChange={v => { form.setValue('recorrente', v); if (v) form.setValue('parcelado', false); }} />
              <Label className="flex items-center gap-2 text-sm cursor-pointer"><RefreshCw className="h-4 w-4 text-primary" /> Recorrente</Label>
            </div>
            {isRecorrente && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <FormField control={form.control} name="frequencia_recorrencia" render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || 'mensal'}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Frequência" /></SelectTrigger>
                    <SelectContent>{frequenciaOptions.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </motion.div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch checked={isParcelado} onCheckedChange={v => { form.setValue('parcelado', v); if (v) form.setValue('recorrente', false); }} />
              <Label className="flex items-center gap-2 text-sm cursor-pointer"><Layers className="h-4 w-4 text-secondary" /> Parcelar</Label>
            </div>
            {isParcelado && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                <FormField control={form.control} name="numero_parcelas" render={({ field }) => (
                  <Input type="number" min={2} max={120} value={field.value} onChange={e => field.onChange(parseInt(e.target.value) || 2)} placeholder="Nº parcelas" />
                )} />
                {valorTotal > 0 && <p className="text-xs text-muted-foreground">{numParcelas}x de <span className="font-semibold text-foreground">R$ {valorParcela.toFixed(2)}</span></p>}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Conta Bancária e Documento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="conta_bancaria_id" render={({ field }) => (
          <FormItem><FormLabel>Conta Bancária</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger></FormControl>
              <SelectContent>{contasBancarias.map((cb: any) => <SelectItem key={cb.id} value={cb.id}>{cb.banco} - Ag: {cb.agencia} / CC: {cb.conta}</SelectItem>)}</SelectContent>
            </Select><FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="numero_documento" render={({ field }) => (
          <FormItem><FormLabel>Número do Documento</FormLabel><FormControl>
            <div className="relative"><Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input {...field} placeholder="NF, Fatura, etc." className="pl-10" /></div>
          </FormControl><FormMessage /></FormItem>
        )} />
      </div>

      {/* Campos condicionais */}
      <AnimatePresence mode="wait">
        {tipoCobranca === 'boleto' && (
          <motion.div key="boleto-fields" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
            <FormField control={form.control} name="codigo_barras" render={({ field }) => (
              <FormItem><FormLabel>Linha Digitável</FormLabel><FormControl><Input {...field} placeholder="Digite a linha digitável" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="link_boleto" render={({ field }) => (
              <FormItem><FormLabel>Link do Boleto</FormLabel><FormControl>
                <div className="relative"><Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input {...field} placeholder="https://..." className="pl-10" /></div>
              </FormControl><FormMessage /></FormItem>
            )} />
          </motion.div>
        )}
        {tipoCobranca === 'pix' && (
          <motion.div key="pix-fields" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <FormField control={form.control} name="chave_pix" render={({ field }) => (
              <FormItem><FormLabel>Chave PIX</FormLabel><FormControl>
                <div className="relative"><QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input {...field} placeholder="CPF, CNPJ, E-mail, Telefone ou Chave" className="pl-10" /></div>
              </FormControl><FormMessage /></FormItem>
            )} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Observações */}
      <FormField control={form.control} name="observacoes" render={({ field }) => (
        <FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea {...field} placeholder="Observações adicionais (opcional)" className="min-h-[60px]" /></FormControl><FormMessage /></FormItem>
      )} />
    </>
  );
}

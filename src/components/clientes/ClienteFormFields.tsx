import { UseFormReturn } from 'react-hook-form';
import { User, Building2, Mail, Phone, MapPin, FileText, CreditCard } from 'lucide-react';
import { FieldLabel } from '@/components/ui/info-tooltip';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { maskCnpjCpf, maskPhone } from '@/lib/masks';

interface Props {
  form: UseFormReturn<any>;
}

export function ClienteFormFields({ form }: Props) {
  return (
    <>
      {/* Razão Social e Nome Fantasia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="razao_social" render={({ field }) => (
          <FormItem>
            <FieldLabel label="Razão Social" required tooltip="Nome oficial registrado da empresa ou pessoa física" />
            <FormControl>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input {...field} placeholder="Razão social" className="pl-10" />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="nome_fantasia" render={({ field }) => (
          <FormItem>
            <FieldLabel label="Nome Fantasia" tooltip="Nome comercial pelo qual a empresa é conhecida" />
            <FormControl><Input {...field} placeholder="Nome fantasia (opcional)" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      {/* CNPJ/CPF e Contato */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="cnpj_cpf" render={({ field }) => (
          <FormItem>
            <FieldLabel label="CNPJ/CPF" tooltip="Documento de identificação fiscal. Validação automática" />
            <FormControl>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input {...field} placeholder="00.000.000/0000-00" className="pl-10"
                  onChange={(e) => field.onChange(maskCnpjCpf(e.target.value))} maxLength={18} />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="contato" render={({ field }) => (
          <FormItem>
            <FieldLabel label="Pessoa de Contato" tooltip="Nome do responsável pelo relacionamento comercial" />
            <FormControl>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input {...field} placeholder="Nome do contato" className="pl-10" />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      {/* Email e Telefone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FieldLabel label="E-mail" tooltip="E-mail principal para comunicações e cobranças" />
            <FormControl>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input {...field} type="email" placeholder="email@exemplo.com" className="pl-10" />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="telefone" render={({ field }) => (
          <FormItem>
            <FieldLabel label="Telefone" tooltip="Número de contato com DDD" />
            <FormControl>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input {...field} placeholder="(00) 00000-0000" className="pl-10"
                  onChange={(e) => field.onChange(maskPhone(e.target.value))} maxLength={15} />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      {/* Endereço */}
      <FormField control={form.control} name="endereco" render={({ field }) => (
        <FormItem>
          <FieldLabel label="Endereço" tooltip="Endereço completo para correspondência e entrega" />
          <FormControl>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input {...field} placeholder="Rua, número, bairro" className="pl-10" />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      {/* Cidade e Estado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField control={form.control} name="cidade" render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Cidade</FormLabel>
            <FormControl><Input {...field} placeholder="Cidade" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="estado" render={({ field }) => (
          <FormItem>
            <FormLabel>UF</FormLabel>
            <FormControl><Input {...field} placeholder="SP" maxLength={2} className="uppercase" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>

      {/* Limite de Crédito */}
      <FormField control={form.control} name="limite_credito" render={({ field }) => (
        <FormItem>
          <FieldLabel label="Limite de Crédito" tooltip="Valor máximo de crédito concedido ao cliente para compras a prazo" />
          <FormControl>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="number" step="0.01" min="0" {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} placeholder="0,00" className="pl-10" />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      {/* Observações */}
      <FormField control={form.control} name="observacoes" render={({ field }) => (
        <FormItem>
          <FieldLabel label="Observações" tooltip="Notas internas sobre o cliente (não visíveis externamente)" />
          <FormControl><Textarea {...field} placeholder="Observações adicionais (opcional)" className="min-h-[60px]" /></FormControl>
          <FormMessage />
        </FormItem>
      )} />

      {/* Ativo */}
      <FormField control={form.control} name="ativo" render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">Cliente Ativo</FormLabel>
            <p className="text-sm text-muted-foreground">Clientes inativos não aparecem nas listagens</p>
          </div>
          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
        </FormItem>
      )} />
    </>
  );
}

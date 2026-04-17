import { Building2, User, FileText } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { FieldLabel } from '@/components/ui/info-tooltip';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { maskCnpjCpf } from '@/lib/masks';

interface FornecedorDadosBasicosProps {
  form: UseFormReturn<any>;
}

export function FornecedorDadosBasicos({ form }: FornecedorDadosBasicosProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="razao_social"
          render={({ field }) => (
            <FormItem>
              <FieldLabel label="Razão Social" required tooltip="Nome oficial registrado da empresa fornecedora" />
              <FormControl>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input {...field} placeholder="Razão social" className="pl-10" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nome_fantasia"
          render={({ field }) => (
            <FormItem>
              <FieldLabel label="Nome Fantasia" tooltip="Nome comercial pelo qual o fornecedor é conhecido" />
              <FormControl>
                <Input {...field} placeholder="Nome fantasia (opcional)" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="cnpj_cpf"
          render={({ field }) => (
            <FormItem>
              <FieldLabel label="CNPJ/CPF" tooltip="Documento fiscal do fornecedor. Validação automática" />
              <FormControl>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    placeholder="00.000.000/0000-00"
                    className="pl-10"
                    onChange={(e) => field.onChange(maskCnpjCpf(e.target.value))}
                    maxLength={18}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contato"
          render={({ field }) => (
            <FormItem>
              <FieldLabel label="Pessoa de Contato" tooltip="Responsável por negociações e atendimento" />
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input {...field} placeholder="Nome do contato" className="pl-10" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}

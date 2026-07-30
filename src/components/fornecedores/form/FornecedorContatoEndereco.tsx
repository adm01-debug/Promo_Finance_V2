import { Mail, Phone, MapPin } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { FieldLabel } from '@/components/ui/info-tooltip';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { maskPhone } from '@/lib/masks';

interface FornecedorContatoEnderecoProps {
  form: UseFormReturn<any>;
}

export function FornecedorContatoEndereco({ form }: FornecedorContatoEnderecoProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FieldLabel label="E-mail" tooltip="E-mail para envio de pedidos e comunicações" />
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input {...field} type="email" placeholder="email@exemplo.com" className="pl-10" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telefone"
          render={({ field }) => (
            <FormItem>
              <FieldLabel label="Telefone" tooltip="Número de contato com DDD" />
              <FormControl>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    placeholder="(00) 00000-0000"
                    className="pl-10"
                    onChange={(e) => field.onChange(maskPhone(e.target.value))}
                    maxLength={15}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="endereco"
        render={({ field }) => (
          <FormItem>
            <FieldLabel label="Endereço" tooltip="Endereço comercial do fornecedor" />
            <FormControl>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input {...field} placeholder="Rua, número, bairro" className="pl-10" />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="cidade"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Cidade</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Cidade" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="estado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>UF</FormLabel>
              <FormControl>
                <Input {...field} placeholder="SP" maxLength={2} className="uppercase" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}

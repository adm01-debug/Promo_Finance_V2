import { UseFormReturn } from 'react-hook-form';
import { FieldLabel } from '@/components/ui/info-tooltip';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface FornecedorObservacoesProps {
  form: UseFormReturn<any>;
}

export function FornecedorObservacoes({ form }: FornecedorObservacoesProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="observacoes"
        render={({ field }) => (
          <FormItem>
            <FieldLabel label="Observações" tooltip="Notas internas sobre condições de pagamento, prazos, etc." />
            <FormControl>
              <Textarea {...field} placeholder="Observações adicionais (opcional)" className="min-h-[60px]" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="ativo"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Fornecedor Ativo</FormLabel>
              <p className="text-sm text-muted-foreground">
                Fornecedores inativos não aparecem nas listagens
              </p>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  );
}

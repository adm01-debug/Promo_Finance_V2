import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

interface ContaReceberFormFieldsObservacoesProps {
  form: import('react-hook-form').UseFormReturn<
    import('@/components/contas-receber/ContaReceberFormFields.types').ContaReceberFormValues
  >;
}

export function ContaReceberFormFieldsObservacoes({
  form,
}: ContaReceberFormFieldsObservacoesProps) {
  return (
    <FormField
      control={form.control}
      name="observacoes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Observações</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              placeholder="Observações adicionais (opcional)"
              className="min-h-[60px]"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

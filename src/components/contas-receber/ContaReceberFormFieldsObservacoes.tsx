import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

interface ContaReceberFormFieldsObservacoesProps {
  form: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/react-hook-form/dist/index').UseFormReturn<
    import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/contas-receber/ContaReceberFormFields.types').ContaReceberFormValues
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

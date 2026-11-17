import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Link2 } from 'lucide-react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface ContaReceberFormFieldsCamposCondicionaisProps {
  tipoCobranca:
    | 'boleto'
    | 'pix'
    | 'transferencia'
    | 'cartao_credito'
    | 'cartao_debito'
    | 'dinheiro'
    | undefined;
  form: import('react-hook-form').UseFormReturn<
    import('@/components/contas-receber/ContaReceberFormFields.types').ContaReceberFormValues
  >;
}

export function ContaReceberFormFieldsCamposCondicionais({
  tipoCobranca,
  form,
}: ContaReceberFormFieldsCamposCondicionaisProps) {
  return (
    <AnimatePresence mode="wait">
      {tipoCobranca === 'boleto' && (
        <motion.div
          key="boleto-fields"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="codigo_barras"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Linha Digitável</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Digite a linha digitável" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="link_boleto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link do Boleto</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input {...field} placeholder="https://..." className="pl-10" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </motion.div>
      )}
      {tipoCobranca === 'pix' && (
        <motion.div
          key="pix-fields"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <FormField
            control={form.control}
            name="chave_pix"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chave PIX</FormLabel>
                <FormControl>
                  <div className="relative">
                    <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...field}
                      placeholder="CPF, CNPJ, E-mail, Telefone ou Chave"
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

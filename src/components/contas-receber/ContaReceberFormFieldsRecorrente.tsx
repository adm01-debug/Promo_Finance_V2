import { motion } from 'framer-motion';
import { RefreshCw, Layers } from 'lucide-react';
import { FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { frequenciaOptions } from './ContaReceberFormFields.helpers';

interface ContaReceberFormFieldsRecorrenteProps {
  isRecorrente: boolean | undefined;
  form: import('react-hook-form').UseFormReturn<
    import('@/components/contas-receber/ContaReceberFormFields.types').ContaReceberFormValues
  >;
  isParcelado: boolean | undefined;
  valorTotal: number | undefined;
  numParcelas: number;
  valorParcela: number;
}

export function ContaReceberFormFieldsRecorrente({
  isRecorrente,
  form,
  isParcelado,
  valorTotal,
  numParcelas,
  valorParcela,
}: ContaReceberFormFieldsRecorrenteProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/20">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Switch
            checked={isRecorrente}
            onCheckedChange={(v) => {
              form.setValue('recorrente', v);
              if (v) form.setValue('parcelado', false);
            }}
          />
          <Label className="flex items-center gap-2 text-sm cursor-pointer">
            <RefreshCw className="h-4 w-4 text-primary" /> Recorrente
          </Label>
        </div>
        {isRecorrente && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <FormField
              control={form.control}
              name="frequencia_recorrencia"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || 'mensal'}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    {frequenciaOptions.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </motion.div>
        )}
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Switch
            checked={isParcelado}
            onCheckedChange={(v) => {
              form.setValue('parcelado', v);
              if (v) form.setValue('recorrente', false);
            }}
          />
          <Label className="flex items-center gap-2 text-sm cursor-pointer">
            <Layers className="h-4 w-4 text-secondary" /> Parcelar
          </Label>
        </div>
        {isParcelado && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <FormField
              control={form.control}
              name="numero_parcelas"
              render={({ field }) => (
                <Input
                  type="number"
                  min={2}
                  max={120}
                  value={field.value}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 2)}
                  placeholder="Nº parcelas"
                />
              )}
            />
            {(valorTotal ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground">
                {numParcelas}x de{' '}
                <span className="font-semibold text-foreground">R$ {valorParcela.toFixed(2)}</span>
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

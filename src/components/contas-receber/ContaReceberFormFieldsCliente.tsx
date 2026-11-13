import { motion, AnimatePresence } from 'framer-motion';
import { User, Search } from 'lucide-react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ContaReceberFormFieldsClienteProps {
  setShowClienteSelect: (v: boolean) => void;
  showClienteSelect: boolean;
  clienteSearch: string;
  setClienteSearch: import('react').Dispatch<import('react').SetStateAction<string>>;
  onClienteSelect: (id: string) => void;
  form: import('react-hook-form').UseFormReturn<
    import('@/components/contas-receber/ContaReceberFormFields.types').ContaReceberFormValues
  >;
  filteredClientes: import('@/components/contas-receber/ContaReceberFormFields.types').ClienteOption[];
}

export function ContaReceberFormFieldsCliente({
  setShowClienteSelect,
  showClienteSelect,
  clienteSearch,
  setClienteSearch,
  onClienteSelect,
  form,
  filteredClientes,
}: ContaReceberFormFieldsClienteProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FormLabel className="text-sm font-medium">Cliente</FormLabel>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowClienteSelect(!showClienteSelect)}
          className="text-xs h-7"
        >
          {showClienteSelect ? 'Digitar manualmente' : 'Selecionar cadastrado'}
        </Button>
      </div>
      <AnimatePresence mode="wait">
        {showClienteSelect ? (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/5 rounded-xl -m-0.5 opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm pointer-events-none" />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Buscar por nome, fantasia ou CNPJ..."
                value={clienteSearch}
                onChange={(e) => setClienteSearch(e.target.value)}
                className="pl-12 h-12 rounded-xl bg-card/5 border-white/10"
              />
            </div>
            <Select onValueChange={onClienteSelect} value={form.watch('cliente_id')}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {filteredClientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <span>{c.razao_social}</span>
                      {c.nome_fantasia && (
                        <span className="text-xs text-muted-foreground">({c.nome_fantasia})</span>
                      )}
                      {c.score && (
                        <span
                          className={cn(
                            'text-xs font-medium',
                            c.score >= 800
                              ? 'text-success'
                              : c.score >= 600
                                ? 'text-warning'
                                : 'text-destructive'
                          )}
                        >
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
          <motion.div
            key="input"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <FormField
              control={form.control}
              name="cliente_nome"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        {...field}
                        placeholder="Nome do cliente"
                        className="pl-12 h-12 rounded-xl bg-card/5 border-white/10"
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
    </div>
  );
}

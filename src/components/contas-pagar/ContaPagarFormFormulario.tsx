import { motion, AnimatePresence } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { ContaPagarFormFields } from './ContaPagarFormFields';
import { AnexoList } from '@/components/financeiro/AnexoList';
import type { ContaPagarFormData } from './ContaPagarForm.types';

/* eslint-disable @typescript-eslint/no-explicit-any -- tipos herdados dos valores de origem (já eram any) */
interface ContaPagarFormFormularioProps {
  form: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/react-hook-form/dist/index').UseFormReturn<
    {
      fornecedor_nome: string;
      descricao: string;
      valor: number;
      data_vencimento: string;
      empresa_id: string;
      tipo_cobranca: 'boleto' | 'pix' | 'cartao' | 'transferencia' | 'dinheiro';
      recorrente: boolean;
      fornecedor_id?: string;
      data_emissao?: string;
      centro_custo_id?: string;
      categoria_id?: string;
      conta_bancaria_id?: string;
      numero_documento?: string;
      codigo_barras?: string;
      observacoes?: string;
    },
    any,
    {
      fornecedor_nome: string;
      descricao: string;
      valor: number;
      data_vencimento: string;
      empresa_id: string;
      tipo_cobranca: 'boleto' | 'pix' | 'cartao' | 'transferencia' | 'dinheiro';
      recorrente: boolean;
      fornecedor_id?: string;
      data_emissao?: string;
      centro_custo_id?: string;
      categoria_id?: string;
      conta_bancaria_id?: string;
      numero_documento?: string;
      codigo_barras?: string;
      observacoes?: string;
    }
  >;
  onSubmit: (data: ContaPagarFormData) => void;
  setShowFornecedorSelect: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<boolean>
  >;
  showFornecedorSelect: boolean;
  handleFornecedorSelect: (fornecedorId: string) => void;
  fornecedores: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/hooks/useFinancialData').ExternalCliente[];
  formForFields: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/react-hook-form/dist/index').UseFormReturn<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/react-hook-form/dist/index').FieldValues
  >;
  empresas: {
    aliquota_rat: number | null;
    aliquota_terceiros: number | null;
    ativo: boolean;
    bairro: string | null;
    cep: string | null;
    cidade: string | null;
    cnae_principal: string | null;
    cnpj: string | null;
    codigo_fpas: string | null;
    cor_hex: string | null;
    created_at: string;
    email: string | null;
    endereco: string | null;
    estado: string | null;
    id: string;
    inscricao_estadual: string | null;
    is_padrao: boolean;
    logo_url: string | null;
    nome_fantasia: string | null;
    razao_social: string;
    regime_tributario: string | null;
    sigla: string | null;
    telefone: string | null;
    user_id: string;
  }[];
  centrosCustoOptions: { id: string; codigo: string; nome: string }[];
  contasBancariasOptions: { id: string; banco: string; agencia: string; conta: string }[];
  categoriasDespesa: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/hooks/useCategorias').Categoria[];
  isEditing: boolean;
  conta: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/contas-pagar/ContaPagarForm.types').ContaPagar;
  requestClose: (next: boolean) => void;
  isPending: boolean;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function ContaPagarFormFormulario({
  form,
  onSubmit,
  setShowFornecedorSelect,
  showFornecedorSelect,
  handleFornecedorSelect,
  fornecedores,
  formForFields,
  empresas,
  centrosCustoOptions,
  contasBancariasOptions,
  categoriasDespesa,
  isEditing,
  conta,
  requestClose,
  isPending,
}: ContaPagarFormFormularioProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel className="text-sm font-medium">Fornecedor</FormLabel>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowFornecedorSelect(!showFornecedorSelect)}
              className="text-xs h-7"
            >
              {showFornecedorSelect ? 'Digitar manualmente' : 'Selecionar cadastrado'}
            </Button>
          </div>
          <AnimatePresence mode="wait">
            {showFornecedorSelect ? (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Select onValueChange={handleFornecedorSelect} value={form.watch('fornecedor_id')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.razao_social}
                        {f.nome_fantasia && ` (${f.nome_fantasia})`}
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
                  name="fornecedor_nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} placeholder="Nome do fornecedor" className="pl-10" />
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

        <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
          <ContaPagarFormFields
            form={formForFields}
            empresas={empresas}
            centrosCusto={centrosCustoOptions}
            contasBancarias={contasBancariasOptions}
            categorias={categoriasDespesa}
          />

          {isEditing && conta?.id && (
            <div className="pt-6 border-t border-white/5">
              <AnexoList entidadeId={conta.id} entidadeTipo="contas_pagar" />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => requestClose(false)}>
            Cancelar
          </Button>
          <ActionButton
            type="submit"
            state={isPending ? 'loading' : 'idle'}
            loadingText="Salvando..."
            successText="Salvo!"
            className={cn(
              'gap-2 shadow-lg',
              isEditing
                ? 'bg-gradient-to-r from-secondary to-secondary/80 shadow-secondary/25'
                : 'bg-gradient-to-r from-primary to-primary/80 shadow-primary/25'
            )}
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Conta'}
          </ActionButton>
        </div>
      </form>
    </Form>
  );
}

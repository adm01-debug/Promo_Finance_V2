import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, DollarSign, Building2, FileText, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import { useCreateContaPagar, useUpdateContaPagar } from '@/hooks/useContasPagar';
import { useFornecedores } from '@/hooks/useFornecedores';
import { cn } from '@/lib/utils';

const contaPagarSchema = z.object({
  descricao: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  valor: z.number().positive('Valor deve ser maior que zero'),
  vencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  fornecedor_id: z.string().optional(),
  categoria: z.string().optional(),
  observacoes: z.string().optional(),
  recorrente: z.boolean().default(false),
  parcelas: z.number().min(1).max(48).optional(),
});

type ContaPagarFormData = z.infer<typeof contaPagarSchema>;

interface ContaPagarFormProps {
  isOpen: boolean;
  onClose: () => void;
  conta?: {
    id: string;
    descricao: string;
    valor: number;
    vencimento: string;
    fornecedor_id?: string;
    categoria?: string;
    observacoes?: string;
  } | null;
}

const categorias = [
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'energia', label: 'Energia Elétrica' },
  { value: 'agua', label: 'Água' },
  { value: 'telefone', label: 'Telefone/Internet' },
  { value: 'salarios', label: 'Salários' },
  { value: 'impostos', label: 'Impostos' },
  { value: 'fornecedores', label: 'Fornecedores' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'outros', label: 'Outros' },
];

export function ContaPagarForm({ isOpen, onClose, conta }: ContaPagarFormProps) {
  const [showParcelas, setShowParcelas] = useState(false);
  const isEditing = !!conta;

  const { data: fornecedores } = useFornecedores({ ativo: true });
  const createConta = useCreateContaPagar();
  const updateConta = useUpdateContaPagar();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContaPagarFormData>({
    resolver: zodResolver(contaPagarSchema),
    defaultValues: conta
      ? {
          descricao: conta.descricao,
          valor: conta.valor,
          vencimento: conta.vencimento.split('T')[0],
          fornecedor_id: conta.fornecedor_id || '',
          categoria: conta.categoria || '',
          observacoes: conta.observacoes || '',
          recorrente: false,
          parcelas: 1,
        }
      : {
          descricao: '',
          valor: 0,
          vencimento: '',
          fornecedor_id: '',
          categoria: '',
          observacoes: '',
          recorrente: false,
          parcelas: 1,
        },
  });

  const isRecorrente = watch('recorrente');

  const onSubmit = async (data: ContaPagarFormData) => {
    try {
      if (isEditing && conta) {
        await updateConta.mutateAsync({
          id: conta.id,
          data,
        });
      } else {
        await createConta.mutateAsync(data as ContaPagarInput);
      }
      reset();
      onClose();
    } catch (error: unknown) {
      console.error('Erro ao salvar conta:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const fornecedorOptions = fornecedores?.map((f) => ({ value: f.id, label: f.nome })) || [];

  const isPending = isSubmitting || createConta.isPending || updateConta.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Descrição */}
        <div className="space-y-1.5">
          <Label htmlFor="descricao">Descrição</Label>
          <Input
            id="descricao"
            placeholder="Ex: Pagamento de aluguel"
            error={!!errors.descricao}
            {...register('descricao')}
          />
          {errors.descricao && (
            <p className="text-sm text-destructive">{errors.descricao.message}</p>
          )}
        </div>

        {/* Valor e Vencimento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="valor"
            control={control}
            render={({ field }) => (
              <div className="space-y-1.5">
                <Label htmlFor="valor">Valor</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  error={!!errors.valor}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
                {errors.valor && (
                  <p className="text-sm text-destructive">{errors.valor.message}</p>
                )}
              </div>
            )}
          />

          <div className="space-y-1.5">
            <Label htmlFor="vencimento">Data de Vencimento</Label>
            <Input
              id="vencimento"
              type="date"
              error={!!errors.vencimento}
              {...register('vencimento')}
            />
            {errors.vencimento && (
              <p className="text-sm text-destructive">{errors.vencimento.message}</p>
            )}
          </div>
        </div>

        {/* Fornecedor e Categoria */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="fornecedor_id"
            control={control}
            render={({ field }) => (
              <div className="space-y-1.5">
                <Label>Fornecedor</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedorOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          <Controller
            name="categoria"
            control={control}
            render={({ field }) => (
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />
        </div>

        {/* Observações */}
        <div className="space-y-1.5">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            placeholder="Observações adicionais..."
            rows={3}
            {...register('observacoes')}
          />
        </div>

        {/* Opções de Recorrência */}
        {!isEditing && (
          <div className="border border-border rounded-lg p-4 space-y-4">
            <Controller
              name="recorrente"
              control={control}
              render={({ field }) => (
                <Checkbox
                  label="Conta recorrente"
                  description="Criar múltiplas parcelas com vencimento mensal"
                  checked={field.value}
                  onChange={(e) => {
                    const checked = (e.target as HTMLInputElement).checked;
                    field.onChange(checked);
                    setShowParcelas(checked);
                  }}
                />
              )}
            />

            {isRecorrente && (
              <Controller
                name="parcelas"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="parcelas">Número de Parcelas</Label>
                    <Input
                      id="parcelas"
                      type="number"
                      min="1"
                      max="48"
                      placeholder="1"
                      value={field.value || 1}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                    <p className="text-xs text-muted-foreground">Máximo de 48 parcelas</p>
                  </div>
                )}
              />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Conta'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Hook wrapper for easy usage
export function useContaPagarForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaPagarFormProps['conta']>(null);

  const openNew = () => {
    setEditingConta(null);
    setIsOpen(true);
  };

  const openEdit = (conta: NonNullable<ContaPagarFormProps['conta']>) => {
    setEditingConta(conta);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setEditingConta(null);
  };

  return {
    isOpen,
    editingConta,
    openNew,
    openEdit,
    close,
    FormComponent: () => (
      <ContaPagarForm isOpen={isOpen} onClose={close} conta={editingConta} />
    ),
  };
}

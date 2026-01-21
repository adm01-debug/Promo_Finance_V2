import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, DollarSign, Building2, FileText, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Modal } from '@/components/ui/modal';
import { useCreateContaPagar, useUpdateContaPagar } from '@/hooks/useContasPagar';
import { useFornecedores } from '@/hooks/useFornecedores';
import { cn } from '@/lib/utils';

// Validation schema
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
          ...data,
        });
      } else {
        await createConta.mutateAsync(data);
      }
      reset();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const fornecedorOptions = [
    { value: '', label: 'Selecione um fornecedor' },
    ...(fornecedores?.map((f) => ({ value: f.id, label: f.nome })) || []),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Descrição */}
        <div>
          <Input
            label="Descrição"
            placeholder="Ex: Pagamento de aluguel"
            leftElement={<FileText className="h-4 w-4" />}
            error={errors.descricao?.message}
            {...register('descricao')}
          />
        </div>

        {/* Valor e Vencimento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="valor"
            control={control}
            render={({ field }) => (
              <Input
                label="Valor"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                leftElement={<DollarSign className="h-4 w-4" />}
                error={errors.valor?.message}
                value={field.value || ''}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />

          <Input
            label="Data de Vencimento"
            type="date"
            leftElement={<CalendarIcon className="h-4 w-4" />}
            error={errors.vencimento?.message}
            {...register('vencimento')}
          />
        </div>

        {/* Fornecedor e Categoria */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="fornecedor_id"
            control={control}
            render={({ field }) => (
              <Select
                label="Fornecedor"
                options={fornecedorOptions}
                leftElement={<Building2 className="h-4 w-4" />}
                error={errors.fornecedor_id?.message}
                {...field}
              />
            )}
          />

          <Controller
            name="categoria"
            control={control}
            render={({ field }) => (
              <Select
                label="Categoria"
                options={[{ value: '', label: 'Selecione uma categoria' }, ...categorias]}
                leftElement={<Tag className="h-4 w-4" />}
                error={errors.categoria?.message}
                {...field}
              />
            )}
          />
        </div>

        {/* Observações */}
        <Textarea
          label="Observações"
          placeholder="Observações adicionais..."
          rows={3}
          {...register('observacoes')}
        />

        {/* Opções de Recorrência */}
        {!isEditing && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
            <Controller
              name="recorrente"
              control={control}
              render={({ field }) => (
                <Checkbox
                  label="Conta recorrente"
                  description="Criar múltiplas parcelas com vencimento mensal"
                  checked={field.value}
                  onChange={(e) => {
                    field.onChange(e.target.checked);
                    setShowParcelas(e.target.checked);
                  }}
                />
              )}
            />

            {isRecorrente && (
              <Controller
                name="parcelas"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Número de Parcelas"
                    type="number"
                    min="1"
                    max="48"
                    placeholder="1"
                    helperText="Máximo de 48 parcelas"
                    value={field.value || 1}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                )}
              />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting || createConta.isPending || updateConta.isPending}
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Conta'}
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

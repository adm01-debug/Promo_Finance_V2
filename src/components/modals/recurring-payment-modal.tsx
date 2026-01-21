import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Calendar, DollarSign, RefreshCw, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import { useRecurringPayments } from '@/hooks/useRecurringPayments';
import { RecurringPayment, RecurrenceFrequency, RecurringType } from '@/services/recurring-payments.service';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/formatters';

// Validation schema
const recurringPaymentSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  valor: z.number().positive('Valor deve ser maior que zero'),
  frequencia: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
  dia_vencimento: z.number().min(1).max(31),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: z.string().optional(),
  categoria_id: z.string().optional(),
  fornecedor_id: z.string().optional(),
  cliente_id: z.string().optional(),
  observacoes: z.string().optional(),
});

type RecurringPaymentFormData = z.infer<typeof recurringPaymentSchema>;

interface RecurringPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: RecurringType;
  recurringPayment?: RecurringPayment | null;
  categorias?: Array<{ id: string; nome: string }>;
  fornecedores?: Array<{ id: string; nome: string }>;
  clientes?: Array<{ id: string; nome: string }>;
}

const frequencyOptions: Array<{ value: RecurrenceFrequency; label: string }> = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' },
];

export function RecurringPaymentModal({
  isOpen,
  onClose,
  tipo,
  recurringPayment,
  categorias = [],
  fornecedores = [],
  clientes = [],
}: RecurringPaymentModalProps) {
  const { create, update, isCreating, isUpdating } = useRecurringPayments(tipo);
  const isEditing = !!recurringPayment;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RecurringPaymentFormData>({
    resolver: zodResolver(recurringPaymentSchema),
    defaultValues: {
      descricao: '',
      valor: 0,
      frequencia: 'monthly',
      dia_vencimento: 1,
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: '',
      categoria_id: '',
      fornecedor_id: '',
      cliente_id: '',
      observacoes: '',
    },
  });

  const frequencia = watch('frequencia');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && recurringPayment) {
      reset({
        descricao: recurringPayment.descricao,
        valor: recurringPayment.valor,
        frequencia: recurringPayment.frequencia,
        dia_vencimento: recurringPayment.dia_vencimento,
        data_inicio: recurringPayment.data_inicio.split('T')[0],
        data_fim: recurringPayment.data_fim?.split('T')[0] || '',
        categoria_id: recurringPayment.categoria_id || '',
        fornecedor_id: recurringPayment.fornecedor_id || '',
        cliente_id: recurringPayment.cliente_id || '',
        observacoes: recurringPayment.observacoes || '',
      });
    } else if (isOpen) {
      reset({
        descricao: '',
        valor: 0,
        frequencia: 'monthly',
        dia_vencimento: 1,
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: '',
        categoria_id: '',
        fornecedor_id: '',
        cliente_id: '',
        observacoes: '',
      });
    }
  }, [isOpen, recurringPayment, reset]);

  const onSubmit = (data: RecurringPaymentFormData) => {
    const payload = {
      ...data,
      tipo,
      data_fim: data.data_fim || undefined,
      categoria_id: data.categoria_id || undefined,
      fornecedor_id: data.fornecedor_id || undefined,
      cliente_id: data.cliente_id || undefined,
    };

    if (isEditing && recurringPayment) {
      update({ id: recurringPayment.id, input: payload }, {
        onSuccess: () => {
          onClose();
        },
      });
    } else {
      create(payload, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const title = tipo === 'pagar' ? 'Despesa Recorrente' : 'Receita Recorrente';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? `Editar ${title}` : `Nova ${title}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descrição *
          </label>
          <input
            type="text"
            {...register('descricao')}
            className={cn(
              'w-full px-4 py-2 border rounded-lg',
              'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              errors.descricao ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            )}
            placeholder="Ex: Aluguel, Internet, Salário..."
          />
          {errors.descricao && (
            <p className="mt-1 text-sm text-red-500">{errors.descricao.message}</p>
          )}
        </div>

        {/* Valor e Frequência */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Valor *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                step="0.01"
                {...register('valor', { valueAsNumber: true })}
                className={cn(
                  'w-full pl-10 pr-4 py-2 border rounded-lg',
                  'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  errors.valor ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                )}
                placeholder="0,00"
              />
            </div>
            {errors.valor && (
              <p className="mt-1 text-sm text-red-500">{errors.valor.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Frequência *
            </label>
            <select
              {...register('frequencia')}
              className={cn(
                'w-full px-4 py-2 border rounded-lg',
                'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                'border-gray-300 dark:border-gray-600'
              )}
            >
              {frequencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dia do vencimento */}
        {(frequencia === 'monthly' || frequencia === 'quarterly') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dia do vencimento *
            </label>
            <input
              type="number"
              min="1"
              max="31"
              {...register('dia_vencimento', { valueAsNumber: true })}
              className={cn(
                'w-full px-4 py-2 border rounded-lg',
                'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                'border-gray-300 dark:border-gray-600'
              )}
            />
          </div>
        )}

        {/* Datas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data início *
            </label>
            <input
              type="date"
              {...register('data_inicio')}
              className={cn(
                'w-full px-4 py-2 border rounded-lg',
                'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                errors.data_inicio ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data fim (opcional)
            </label>
            <input
              type="date"
              {...register('data_fim')}
              className={cn(
                'w-full px-4 py-2 border rounded-lg',
                'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                'border-gray-300 dark:border-gray-600'
              )}
            />
          </div>
        </div>

        {/* Categoria */}
        {categorias.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoria
            </label>
            <select
              {...register('categoria_id')}
              className={cn(
                'w-full px-4 py-2 border rounded-lg',
                'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                'border-gray-300 dark:border-gray-600'
              )}
            >
              <option value="">Selecione...</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Fornecedor/Cliente */}
        {tipo === 'pagar' && fornecedores.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fornecedor
            </label>
            <select
              {...register('fornecedor_id')}
              className={cn(
                'w-full px-4 py-2 border rounded-lg',
                'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                'border-gray-300 dark:border-gray-600'
              )}
            >
              <option value="">Selecione...</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {tipo === 'receber' && clientes.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cliente
            </label>
            <select
              {...register('cliente_id')}
              className={cn(
                'w-full px-4 py-2 border rounded-lg',
                'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                'border-gray-300 dark:border-gray-600'
              )}
            >
              <option value="">Selecione...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Observações
          </label>
          <textarea
            {...register('observacoes')}
            rows={3}
            className={cn(
              'w-full px-4 py-2 border rounded-lg',
              'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              'border-gray-300 dark:border-gray-600'
            )}
            placeholder="Observações adicionais..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isCreating || isUpdating}>
            {isCreating || isUpdating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {isEditing ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default RecurringPaymentModal;

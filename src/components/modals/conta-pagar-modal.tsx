import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, CalendarDays, DollarSign, FileText, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useContasPagar, useContaPagar } from '@/hooks/useContasPagar';
import { useFornecedores } from '@/hooks/useFornecedores';
import { formatCurrency, parseCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

const contaPagarSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  valor: z.string().min(1, 'Valor é obrigatório'),
  data_vencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  fornecedor_id: z.string().optional(),
  categoria: z.string().optional(),
  forma_pagamento: z.string().optional(),
  numero_documento: z.string().optional(),
  codigo_barras: z.string().optional(),
  observacoes: z.string().optional(),
  recorrente: z.boolean().default(false),
  frequencia_recorrencia: z.string().optional(),
});

type ContaPagarFormData = z.infer<typeof contaPagarSchema>;

interface ContaPagarModalProps {
  isOpen: boolean;
  onClose: () => void;
  contaId?: string | null;
}

const categorias = [
  'Aluguel',
  'Água',
  'Luz',
  'Internet',
  'Telefone',
  'Salários',
  'Fornecedores',
  'Material de Escritório',
  'Marketing',
  'Impostos',
  'Manutenção',
  'Transporte',
  'Alimentação',
  'Software/Assinaturas',
  'Outras Despesas',
];

const formasPagamento = [
  'Boleto',
  'Transferência',
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Dinheiro',
  'Cheque',
];

export function ContaPagarModal({ isOpen, onClose, contaId }: ContaPagarModalProps) {
  const { create, update, isCreating, isUpdating } = useContasPagar();
  const { conta, isLoading: isLoadingConta } = useContaPagar(contaId || undefined);
  const { fornecedores } = useFornecedores();
  
  const [valorDisplay, setValorDisplay] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContaPagarFormData>({
    resolver: zodResolver(contaPagarSchema),
    defaultValues: {
      descricao: '',
      valor: '',
      data_vencimento: '',
      fornecedor_id: '',
      categoria: '',
      forma_pagamento: '',
      numero_documento: '',
      codigo_barras: '',
      observacoes: '',
      recorrente: false,
      frequencia_recorrencia: '',
    },
  });

  const recorrente = watch('recorrente');

  // Load conta data when editing
  useEffect(() => {
    if (conta && contaId) {
      reset({
        descricao: conta.descricao,
        valor: conta.valor.toString(),
        data_vencimento: conta.data_vencimento,
        fornecedor_id: conta.fornecedor_id || '',
        categoria: conta.categoria || '',
        forma_pagamento: conta.forma_pagamento || '',
        numero_documento: conta.numero_documento || '',
        codigo_barras: conta.codigo_barras || '',
        observacoes: conta.observacoes || '',
        recorrente: conta.recorrente || false,
        frequencia_recorrencia: conta.frequencia_recorrencia || '',
      });
      setValorDisplay(formatCurrency(conta.valor));
    } else {
      reset({
        descricao: '',
        valor: '',
        data_vencimento: '',
        fornecedor_id: '',
        categoria: '',
        forma_pagamento: '',
        numero_documento: '',
        codigo_barras: '',
        observacoes: '',
        recorrente: false,
        frequencia_recorrencia: '',
      });
      setValorDisplay('');
    }
  }, [conta, contaId, reset]);

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const numericValue = Number(value) / 100;
    setValorDisplay(formatCurrency(numericValue));
    setValue('valor', numericValue.toString());
  };

  const onSubmit = async (data: ContaPagarFormData) => {
    const payload = {
      ...data,
      valor: parseCurrency(data.valor) || 0,
    };

    if (contaId) {
      await update({ id: contaId, data: payload });
    } else {
      await create(payload);
    }
    onClose();
  };

  if (!isOpen) return null;

  const isLoading = isCreating || isUpdating || isLoadingConta;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {contaId ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-130px)]">
          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...register('descricao')}
                className={cn(
                  'w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                  errors.descricao ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                )}
                placeholder="Ex: Aluguel escritório"
              />
            </div>
            {errors.descricao && (
              <p className="mt-1 text-sm text-red-500">{errors.descricao.message}</p>
            )}
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valor *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={valorDisplay}
                  onChange={handleValorChange}
                  className={cn(
                    'w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                    errors.valor ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder="R$ 0,00"
                />
              </div>
              {errors.valor && (
                <p className="mt-1 text-sm text-red-500">{errors.valor.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vencimento *
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('data_vencimento')}
                  type="date"
                  className={cn(
                    'w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                    errors.data_vencimento ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                />
              </div>
              {errors.data_vencimento && (
                <p className="mt-1 text-sm text-red-500">{errors.data_vencimento.message}</p>
              )}
            </div>
          </div>

          {/* Fornecedor e Categoria */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fornecedor
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  {...register('fornecedor_id')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Selecione...</option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.razao_social}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoria
              </label>
              <select
                {...register('categoria')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Selecione...</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Forma de Pagamento e Número Documento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                {...register('forma_pagamento')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Selecione...</option>
                {formasPagamento.map((forma) => (
                  <option key={forma} value={forma}>
                    {forma}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nº Documento
              </label>
              <input
                {...register('numero_documento')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: NF-123456"
              />
            </div>
          </div>

          {/* Código de Barras */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código de Barras
            </label>
            <input
              {...register('codigo_barras')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
              placeholder="Digite ou cole o código de barras"
            />
          </div>

          {/* Recorrente */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <input
              {...register('recorrente')}
              type="checkbox"
              id="recorrente"
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="recorrente" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Conta recorrente
            </label>
          </div>

          {/* Frequência (se recorrente) */}
          {recorrente && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Frequência
              </label>
              <select
                {...register('frequencia_recorrencia')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Selecione...</option>
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              placeholder="Observações adicionais..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {contaId ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ContaPagarModal;

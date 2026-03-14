import { useState } from 'react';
import { useZodForm } from '@/hooks/useZodForm';
import { contaReceberSchema } from '@/lib/schemas';
import { FormField } from './form-field';
import { CurrencyInput } from './currency-input';
import { DateInput } from './date-input';
import { MaskedInput } from './masked-input';
import { cn } from '@/lib/utils';

interface ContaReceberFormProps {
  initialValues?: Partial<ContaReceberValues>;
  onSubmit: (values: ContaReceberValues) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  clientes?: Array<{ id: string; nome: string }>;
  categorias?: Array<{ id: string; nome: string }>;
  className?: string;
}

interface ContaReceberValues {
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataEmissao: string;
  clienteId: string;
  categoriaId: string;
  numeroDocumento?: string;
  observacoes?: string;
  status: 'pendente' | 'recebido' | 'vencido' | 'cancelado';
  formaPagamento?: string;
  parcelas?: number;
  parcelaAtual?: number;
}

const defaultValues: ContaReceberValues = {
  descricao: '',
  valor: 0,
  dataVencimento: '',
  dataEmissao: new Date().toISOString().split('T')[0],
  clienteId: '',
  categoriaId: '',
  numeroDocumento: '',
  observacoes: '',
  status: 'pendente',
  formaPagamento: '',
  parcelas: 1,
  parcelaAtual: 1,
};

const formasPagamento = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'cheque', label: 'Cheque' },
];

const statusOptions = [
  { value: 'pendente', label: 'Pendente', color: 'bg-warning/10 text-warning' },
  { value: 'recebido', label: 'Recebido', color: 'bg-success/10 text-success' },
  { value: 'vencido', label: 'Vencido', color: 'bg-destructive/10 text-destructive' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-muted text-muted-foreground' },
];

export function ContaReceberForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
  clientes = [],
  categorias = [],
  className,
}: ContaReceberFormProps) {
  const [showParcelas, setShowParcelas] = useState(
    (initialValues?.parcelas ?? 1) > 1
  );

  const form = useZodForm({
    schema: contaReceberSchema,
    initialValues: { ...defaultValues, ...initialValues },
    onSubmit,
  });

  const handleParcelasToggle = () => {
    setShowParcelas(!showParcelas);
    if (!showParcelas) {
      form.setFieldValue('parcelas', 1);
      form.setFieldValue('parcelaAtual', 1);
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit}
      className={cn('space-y-6', className)}
    >
      {/* Informações Principais */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">
          Informações da Conta a Receber
        </h3>

        <FormField
          label="Descrição"
          error={form.errors.descricao}
          required
        >
          <input
            type="text"
            {...form.getFieldProps('descricao')}
            placeholder="Ex: Venda de produtos, Serviço prestado..."
            className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Valor"
            error={form.errors.valor}
            required
          >
            <CurrencyInput
              value={form.values.valor}
              onChange={(value) => form.setFieldValue('valor', value)}
              onBlur={() => form.setFieldTouched('valor', true)}
              placeholder="R$ 0,00"
            />
          </FormField>

          <FormField
            label="Status"
            error={form.errors.status}
            required
          >
            <select
              {...form.getFieldProps('status')}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Data de Emissão"
            error={form.errors.dataEmissao}
            required
          >
            <DateInput
              value={form.values.dataEmissao}
              onChange={(value) => form.setFieldValue('dataEmissao', value)}
              onBlur={() => form.setFieldTouched('dataEmissao', true)}
            />
          </FormField>

          <FormField
            label="Data de Vencimento"
            error={form.errors.dataVencimento}
            required
          >
            <DateInput
              value={form.values.dataVencimento}
              onChange={(value) => form.setFieldValue('dataVencimento', value)}
              onBlur={() => form.setFieldTouched('dataVencimento', true)}
            />
          </FormField>
        </div>
      </div>

      {/* Cliente e Categoria */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Vínculo
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Cliente"
            error={form.errors.clienteId}
            required
          >
            <select
              {...form.getFieldProps('clienteId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Categoria"
            error={form.errors.categoriaId}
            required
          >
            <select
              {...form.getFieldProps('categoriaId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="">Selecione uma categoria</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      {/* Pagamento */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Pagamento
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Forma de Pagamento"
            error={form.errors.formaPagamento}
          >
            <select
              {...form.getFieldProps('formaPagamento')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="">Selecione</option>
              {formasPagamento.map((forma) => (
                <option key={forma.value} value={forma.value}>
                  {forma.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Número do Documento"
            error={form.errors.numeroDocumento}
          >
            <input
              type="text"
              {...form.getFieldProps('numeroDocumento')}
              placeholder="Ex: NF-001, REC-2024-001..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
          </FormField>
        </div>

        {/* Parcelas Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="parcelamento"
            checked={showParcelas}
            onChange={handleParcelasToggle}
            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <label
            htmlFor="parcelamento"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Parcelado
          </label>
        </div>

        {showParcelas && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <FormField
              label="Total de Parcelas"
              error={form.errors.parcelas}
            >
              <input
                type="number"
                min="1"
                max="60"
                {...form.getFieldProps('parcelas')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </FormField>

            <FormField
              label="Parcela Atual"
              error={form.errors.parcelaAtual}
            >
              <input
                type="number"
                min="1"
                max={form.values.parcelas || 60}
                {...form.getFieldProps('parcelaAtual')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </FormField>

            {form.values.parcelas > 1 && form.values.valor > 0 && (
              <div className="col-span-2 text-sm text-gray-600 dark:text-gray-400">
                Valor por parcela:{' '}
                <span className="font-medium text-green-600 dark:text-green-400">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(form.values.valor / form.values.parcelas)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Observações */}
      <FormField
        label="Observações"
        error={form.errors.observacoes}
      >
        <textarea
          {...form.getFieldProps('observacoes')}
          rows={3}
          placeholder="Observações adicionais..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white resize-none"
        />
      </FormField>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || !form.isValid}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin\" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Salvando...
            </span>
          ) : (
            'Salvar Conta a Receber'
          )}
        </button>
      </div>
    </form>
  );
}

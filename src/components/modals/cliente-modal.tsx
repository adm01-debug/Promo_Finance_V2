import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, User, Mail, Phone, MapPin, Building, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClientes, useCliente } from '@/hooks/useClientes';
import { formatCPF, formatCNPJ, validateCPF, validateCNPJ } from '@/lib/brazilian-validators';
import { formatCurrency, parseCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

const clienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  cpf_cnpj: z.string().optional(),
  tipo: z.enum(['PF', 'PJ']).default('PF'),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  bairro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  limite_credito: z.string().optional(),
  observacoes: z.string().optional(),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId?: string | null;
}

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function ClienteModal({ isOpen, onClose, clienteId }: ClienteModalProps) {
  const { create, update, isCreating, isUpdating } = useClientes();
  const { cliente, isLoading: isLoadingCliente } = useCliente(clienteId || undefined);
  
  const [limiteDisplay, setLimiteDisplay] = useState('');
  const [cpfCnpjError, setCpfCnpjError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      cpf_cnpj: '',
      tipo: 'PF',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      bairro: '',
      numero: '',
      complemento: '',
      limite_credito: '',
      observacoes: '',
    },
  });

  const tipo = watch('tipo');

  // Load cliente data when editing
  useEffect(() => {
    if (cliente && clienteId) {
      reset({
        nome: cliente.nome,
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        cpf_cnpj: cliente.cpf_cnpj || '',
        tipo: cliente.tipo || 'PF',
        endereco: cliente.endereco || '',
        cidade: cliente.cidade || '',
        estado: cliente.estado || '',
        cep: cliente.cep || '',
        bairro: cliente.bairro || '',
        numero: cliente.numero || '',
        complemento: cliente.complemento || '',
        limite_credito: cliente.limite_credito?.toString() || '',
        observacoes: cliente.observacoes || '',
      });
      setLimiteDisplay(cliente.limite_credito ? formatCurrency(cliente.limite_credito) : '');
    } else {
      reset({
        nome: '',
        email: '',
        telefone: '',
        cpf_cnpj: '',
        tipo: 'PF',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        bairro: '',
        numero: '',
        complemento: '',
        limite_credito: '',
        observacoes: '',
      });
      setLimiteDisplay('');
    }
  }, [cliente, clienteId, reset]);

  const handleLimiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const numericValue = Number(value) / 100;
    setLimiteDisplay(formatCurrency(numericValue));
    setValue('limite_credito', numericValue.toString());
  };

  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    let formatted = value;
    
    if (tipo === 'PF') {
      formatted = formatCPF(value.slice(0, 11));
      if (value.length === 11 && !validateCPF(value)) {
        setCpfCnpjError('CPF inválido');
      } else {
        setCpfCnpjError('');
      }
    } else {
      formatted = formatCNPJ(value.slice(0, 14));
      if (value.length === 14 && !validateCNPJ(value)) {
        setCpfCnpjError('CNPJ inválido');
      } else {
        setCpfCnpjError('');
      }
    }
    
    setValue('cpf_cnpj', formatted);
  };

  const onSubmit = async (data: ClienteFormData) => {
    if (cpfCnpjError) return;

    const payload = {
      ...data,
      limite_credito: data.limite_credito ? parseCurrency(data.limite_credito) : 0,
    };

    if (clienteId) {
      await update({ id: clienteId, data: payload });
    } else {
      await create(payload);
    }
    onClose();
  };

  if (!isOpen) return null;

  const isLoading = isCreating || isUpdating || isLoadingCliente;

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
            {clienteId ? 'Editar Cliente' : 'Novo Cliente'}
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
          {/* Tipo */}
          <div className="flex gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="PF"
                {...register('tipo')}
                className="text-primary-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Pessoa Física
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="PJ"
                {...register('tipo')}
                className="text-primary-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Pessoa Jurídica
              </span>
            </label>
          </div>

          {/* Nome e CPF/CNPJ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tipo === 'PF' ? 'Nome *' : 'Razão Social *'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('nome')}
                  className={cn(
                    'w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                    errors.nome ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                />
              </div>
              {errors.nome && (
                <p className="mt-1 text-sm text-red-500">{errors.nome.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tipo === 'PF' ? 'CPF' : 'CNPJ'}
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('cpf_cnpj')}
                  onChange={handleCpfCnpjChange}
                  className={cn(
                    'w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                    cpfCnpjError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder={tipo === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                />
              </div>
              {cpfCnpjError && (
                <p className="mt-1 text-sm text-red-500">{cpfCnpjError}</p>
              )}
            </div>
          </div>

          {/* Email e Telefone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  className={cn(
                    'w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder="email@exemplo.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('telefone')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Endereço
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...register('endereco')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Rua, Avenida..."
              />
            </div>
          </div>

          {/* Número, Bairro, Complemento */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número
              </label>
              <input
                {...register('numero')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bairro
              </label>
              <input
                {...register('bairro')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Complemento
              </label>
              <input
                {...register('complemento')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Cidade, Estado, CEP */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cidade
              </label>
              <input
                {...register('cidade')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <select
                {...register('estado')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Selecione...</option>
                {estados.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                CEP
              </label>
              <input
                {...register('cep')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="00000-000"
              />
            </div>
          </div>

          {/* Limite de Crédito */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Limite de Crédito
            </label>
            <input
              type="text"
              value={limiteDisplay}
              onChange={handleLimiteChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="R$ 0,00"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações
            </label>
            <textarea
              {...register('observacoes')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isLoading || !!cpfCnpjError}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {clienteId ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ClienteModal;

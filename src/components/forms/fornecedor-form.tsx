import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useZodForm } from '@/hooks/useZodForm';
import { fornecedorSchema, FornecedorInput } from '@/lib/schemas';
import { FormField, TextInput, TextArea, Select } from './form-field';
import { MaskedInput } from './masked-input';
import { Button } from '@/components/ui/button';
import { Building2, Mail, Phone, MapPin, User, Save, X, FileText } from 'lucide-react';

interface FornecedorFormProps {
  initialValues?: Partial<FornecedorInput>;
  onSubmit: (data: FornecedorInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

const ESTADOS_BR = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

export function FornecedorForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: FornecedorFormProps) {
  const [showAddress, setShowAddress] = useState(
    !!initialValues?.endereco?.logradouro
  );
  const [showContact, setShowContact] = useState(
    !!initialValues?.contato?.nome
  );

  const defaultValues: Partial<FornecedorInput> = {
    razaoSocial: '',
    nomeFantasia: '',
    email: '',
    telefone: '',
    cnpj: '',
    inscricaoEstadual: '',
    ativo: true,
    endereco: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
    },
    contato: {
      nome: '',
      telefone: '',
      email: '',
    },
    observacoes: '',
    ...initialValues,
  };

  const form = useZodForm({
    schema: fornecedorSchema,
    initialValues: defaultValues,
    onSubmit: async (data) => {
      await onSubmit(data);
    },
  });

  return (
    <form onSubmit={form.handleSubmit} className={cn('space-y-6', className)}>
      {/* Dados da Empresa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Razão Social"
          htmlFor="razaoSocial"
          required
          error={form.getFieldState('razaoSocial').invalid ? form.errors.razaoSocial : undefined}
        >
          <TextInput
            id="razaoSocial"
            placeholder="Razão social da empresa"
            leftIcon={<Building2 className="h-4 w-4" />}
            error={form.getFieldState('razaoSocial').invalid}
            {...form.getFieldProps('razaoSocial')}
          />
        </FormField>

        <FormField
          label="Nome Fantasia"
          htmlFor="nomeFantasia"
          optional
        >
          <TextInput
            id="nomeFantasia"
            placeholder="Nome fantasia"
            leftIcon={<FileText className="h-4 w-4" />}
            {...form.getFieldProps('nomeFantasia')}
          />
        </FormField>
      </div>

      {/* Documentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="CNPJ"
          htmlFor="cnpj"
          optional
          error={form.getFieldState('cnpj').invalid ? form.errors.cnpj : undefined}
        >
          <MaskedInput
            id="cnpj"
            mask="99.999.999/9999-99"
            placeholder="00.000.000/0000-00"
            leftIcon={<Building2 className="h-4 w-4" />}
            error={form.getFieldState('cnpj').invalid}
            value={form.values.cnpj || ''}
            onChange={(e) => form.setFieldValue('cnpj', e.target.value)}
            onBlur={form.handleBlur('cnpj')}
          />
        </FormField>

        <FormField
          label="Inscrição Estadual"
          htmlFor="inscricaoEstadual"
          optional
        >
          <TextInput
            id="inscricaoEstadual"
            placeholder="Inscrição estadual"
            {...form.getFieldProps('inscricaoEstadual')}
          />
        </FormField>
      </div>

      {/* Contato Direto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="E-mail"
          htmlFor="email"
          optional
          error={form.getFieldState('email').invalid ? form.errors.email : undefined}
        >
          <TextInput
            id="email"
            type="email"
            placeholder="email@empresa.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={form.getFieldState('email').invalid}
            {...form.getFieldProps('email')}
          />
        </FormField>

        <FormField
          label="Telefone"
          htmlFor="telefone"
          optional
          error={form.getFieldState('telefone').invalid ? form.errors.telefone : undefined}
        >
          <MaskedInput
            id="telefone"
            mask="(99) 99999-9999"
            placeholder="(00) 00000-0000"
            leftIcon={<Phone className="h-4 w-4" />}
            error={form.getFieldState('telefone').invalid}
            value={form.values.telefone || ''}
            onChange={(e) => form.setFieldValue('telefone', e.target.value)}
            onBlur={form.handleBlur('telefone')}
          />
        </FormField>
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          type="button"
          onClick={() => setShowAddress(!showAddress)}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
        >
          <MapPin className="h-4 w-4" />
          {showAddress ? 'Ocultar endereço' : 'Adicionar endereço'}
        </button>

        <button
          type="button"
          onClick={() => setShowContact(!showContact)}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
        >
          <User className="h-4 w-4" />
          {showContact ? 'Ocultar contato' : 'Adicionar contato'}
        </button>
      </div>

      {/* Endereço */}
      {showAddress && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Endereço
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="CEP" htmlFor="fornecedor-cep" className="md:col-span-1">
              <MaskedInput
                id="fornecedor-cep"
                mask="99999-999"
                placeholder="00000-000"
                value={form.values.endereco?.cep || ''}
                onChange={(e) =>
                  form.setFieldValue('endereco', {
                    ...form.values.endereco,
                    cep: e.target.value,
                  })
                }
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField label="Logradouro" htmlFor="fornecedor-logradouro" className="md:col-span-3">
              <TextInput
                id="fornecedor-logradouro"
                placeholder="Rua, Avenida, etc."
                value={form.values.endereco?.logradouro || ''}
                onChange={(e) =>
                  form.setFieldValue('endereco', {
                    ...form.values.endereco,
                    logradouro: e.target.value,
                  })
                }
              />
            </FormField>

            <FormField label="Número" htmlFor="fornecedor-numero">
              <TextInput
                id="fornecedor-numero"
                placeholder="Nº"
                value={form.values.endereco?.numero || ''}
                onChange={(e) =>
                  form.setFieldValue('endereco', {
                    ...form.values.endereco,
                    numero: e.target.value,
                  })
                }
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Complemento" htmlFor="fornecedor-complemento">
              <TextInput
                id="fornecedor-complemento"
                placeholder="Sala, Andar, etc."
                value={form.values.endereco?.complemento || ''}
                onChange={(e) =>
                  form.setFieldValue('endereco', {
                    ...form.values.endereco,
                    complemento: e.target.value,
                  })
                }
              />
            </FormField>

            <FormField label="Bairro" htmlFor="fornecedor-bairro">
              <TextInput
                id="fornecedor-bairro"
                placeholder="Bairro"
                value={form.values.endereco?.bairro || ''}
                onChange={(e) =>
                  form.setFieldValue('endereco', {
                    ...form.values.endereco,
                    bairro: e.target.value,
                  })
                }
              />
            </FormField>

            <FormField label="Cidade" htmlFor="fornecedor-cidade">
              <TextInput
                id="fornecedor-cidade"
                placeholder="Cidade"
                value={form.values.endereco?.cidade || ''}
                onChange={(e) =>
                  form.setFieldValue('endereco', {
                    ...form.values.endereco,
                    cidade: e.target.value,
                  })
                }
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Estado" htmlFor="fornecedor-estado">
              <Select
                id="fornecedor-estado"
                placeholder="Selecione o estado"
                options={ESTADOS_BR}
                value={form.values.endereco?.estado || ''}
                onChange={(e) =>
                  form.setFieldValue('endereco', {
                    ...form.values.endereco,
                    estado: e.target.value,
                  })
                }
              />
            </FormField>
          </div>
        </div>
      )}

      {/* Contato */}
      {showContact && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <User className="h-4 w-4" />
            Pessoa de Contato
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Nome do Contato" htmlFor="contato-nome">
              <TextInput
                id="contato-nome"
                placeholder="Nome do responsável"
                leftIcon={<User className="h-4 w-4" />}
                value={form.values.contato?.nome || ''}
                onChange={(e) =>
                  form.setFieldValue('contato', {
                    ...form.values.contato,
                    nome: e.target.value,
                  })
                }
              />
            </FormField>

            <FormField label="Telefone do Contato" htmlFor="contato-telefone">
              <MaskedInput
                id="contato-telefone"
                mask="(99) 99999-9999"
                placeholder="(00) 00000-0000"
                leftIcon={<Phone className="h-4 w-4" />}
                value={form.values.contato?.telefone || ''}
                onChange={(e) =>
                  form.setFieldValue('contato', {
                    ...form.values.contato,
                    telefone: e.target.value,
                  })
                }
              />
            </FormField>

            <FormField label="E-mail do Contato" htmlFor="contato-email">
              <TextInput
                id="contato-email"
                type="email"
                placeholder="contato@empresa.com"
                leftIcon={<Mail className="h-4 w-4" />}
                value={form.values.contato?.email || ''}
                onChange={(e) =>
                  form.setFieldValue('contato', {
                    ...form.values.contato,
                    email: e.target.value,
                  })
                }
              />
            </FormField>
          </div>
        </div>
      )}

      {/* Observações */}
      <FormField label="Observações" htmlFor="fornecedor-observacoes" optional>
        <TextArea
          id="fornecedor-observacoes"
          placeholder="Observações adicionais sobre o fornecedor..."
          rows={3}
          {...form.getFieldProps('observacoes')}
        />
      </FormField>

      {/* Ações */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading || form.isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading || form.isSubmitting ? 'Salvando...' : 'Salvar Fornecedor'}
        </Button>
      </div>
    </form>
  );
}

export default FornecedorForm;

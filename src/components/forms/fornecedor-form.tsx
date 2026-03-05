import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useZodForm } from '@/hooks/useZodForm';
import { fornecedorSchema, FornecedorInput } from '@/lib/schemas';
import { FormField } from './form-field';
import { MaskedInput } from './masked-input';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
          <Input
            id="razaoSocial"
            placeholder="Razão social da empresa"
            error={form.getFieldState('razaoSocial').invalid}
            {...form.getFieldProps('razaoSocial')}
          />
        </FormField>

        <FormField
          label="Nome Fantasia"
          htmlFor="nomeFantasia"
        >
          <Input
            id="nomeFantasia"
            placeholder="Nome fantasia"
            {...form.getFieldProps('nomeFantasia')}
          />
        </FormField>
      </div>

      {/* Documentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="CNPJ"
          htmlFor="cnpj"
          error={form.getFieldState('cnpj').invalid ? form.errors.cnpj : undefined}
        >
          <MaskedInput
            id="cnpj"
            mask="cnpj"
            placeholder="00.000.000/0000-00"
            error={form.getFieldState('cnpj').invalid}
            value={form.values.cnpj || ''}
            onChange={(value) => form.setFieldValue('cnpj', value)}
          />
        </FormField>

        <FormField
          label="Inscrição Estadual"
          htmlFor="inscricaoEstadual"
        >
          <Input
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
          error={form.getFieldState('email').invalid ? form.errors.email : undefined}
        >
          <Input
            id="email"
            type="email"
            placeholder="email@empresa.com"
            error={form.getFieldState('email').invalid}
            {...form.getFieldProps('email')}
          />
        </FormField>

        <FormField
          label="Telefone"
          htmlFor="telefone"
          error={form.getFieldState('telefone').invalid ? form.errors.telefone : undefined}
        >
          <MaskedInput
            id="telefone"
            mask="phone"
            placeholder="(00) 00000-0000"
            error={form.getFieldState('telefone').invalid}
            value={form.values.telefone || ''}
            onChange={(value) => form.setFieldValue('telefone', value)}
          />
        </FormField>
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          type="button"
          onClick={() => setShowAddress(!showAddress)}
          className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
        >
          <MapPin className="h-4 w-4" />
          {showAddress ? 'Ocultar endereço' : 'Adicionar endereço'}
        </button>

        <button
          type="button"
          onClick={() => setShowContact(!showContact)}
          className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
        >
          <User className="h-4 w-4" />
          {showContact ? 'Ocultar contato' : 'Adicionar contato'}
        </button>
      </div>

      {/* Endereço */}
      {showAddress && (
        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Endereço
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="CEP" htmlFor="fornecedor-cep" className="md:col-span-1">
              <MaskedInput
                id="fornecedor-cep"
                mask="cep"
                placeholder="00000-000"
                value={form.values.endereco?.cep || ''}
                onChange={(value) =>
                  form.setFieldValue('endereco', {
                    ...form.values.endereco,
                    cep: value,
                  })
                }
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField label="Logradouro" htmlFor="fornecedor-logradouro" className="md:col-span-3">
              <Input
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
              <Input
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
              <Input
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
              <Input
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
              <Input
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
                value={form.values.endereco?.estado || ''}
                onValueChange={(value) =>
                  form.setFieldValue('endereco', {
                    ...form.values.endereco,
                    estado: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_BR.map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </div>
      )}

      {/* Contato */}
      {showContact && (
        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <User className="h-4 w-4" />
            Pessoa de Contato
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Nome do Contato" htmlFor="contato-nome">
              <Input
                id="contato-nome"
                placeholder="Nome do responsável"
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
                mask="phone"
                placeholder="(00) 00000-0000"
                value={form.values.contato?.telefone || ''}
                onChange={(value) =>
                  form.setFieldValue('contato', {
                    ...form.values.contato,
                    telefone: value,
                  })
                }
              />
            </FormField>

            <FormField label="E-mail do Contato" htmlFor="contato-email">
              <Input
                id="contato-email"
                type="email"
                placeholder="contato@empresa.com"
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
      <FormField label="Observações" htmlFor="fornecedor-observacoes">
        <Textarea
          id="fornecedor-observacoes"
          placeholder="Observações adicionais sobre o fornecedor..."
          rows={3}
          {...form.getFieldProps('observacoes')}
        />
      </FormField>

      {/* Ações */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
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

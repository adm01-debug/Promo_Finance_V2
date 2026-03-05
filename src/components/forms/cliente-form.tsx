import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useZodForm } from '@/hooks/useZodForm';
import { clienteSchema, ClienteInput } from '@/lib/schemas';
import { FormField } from './form-field';
import { MaskedInput } from './masked-input';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, MapPin, Building2, Save, X } from 'lucide-react';

interface ClienteFormProps {
  initialValues?: Partial<ClienteInput>;
  onSubmit: (data: ClienteInput) => Promise<void>;
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

export function ClienteForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: ClienteFormProps) {
  const [showAddress, setShowAddress] = useState(
    !!initialValues?.endereco?.logradouro
  );

  const defaultValues: Partial<ClienteInput> = {
    nome: '',
    email: '',
    telefone: '',
    cpfCnpj: '',
    tipo: 'pessoa_fisica',
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
    observacoes: '',
    ...initialValues,
  };

  const form = useZodForm({
    schema: clienteSchema,
    initialValues: defaultValues,
    onSubmit: async (data) => {
      await onSubmit(data);
    },
  });

  const tipoPessoa = form.values.tipo;

  return (
    <form onSubmit={form.handleSubmit} className={cn('space-y-6', className)}>
      {/* Tipo de Pessoa */}
      <FormField label="Tipo de Cliente" required>
        <RadioGroup
          value={form.values.tipo}
          onValueChange={(value) => form.setFieldValue('tipo', value as 'pessoa_fisica' | 'pessoa_juridica')}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pessoa_fisica" id="tipo-pf" />
            <Label htmlFor="tipo-pf">Pessoa Física</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pessoa_juridica" id="tipo-pj" />
            <Label htmlFor="tipo-pj">Pessoa Jurídica</Label>
          </div>
        </RadioGroup>
      </FormField>

      {/* Dados Básicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label={tipoPessoa === 'pessoa_fisica' ? 'Nome Completo' : 'Razão Social'}
          htmlFor="nome"
          required
          error={form.getFieldState('nome').invalid ? form.errors.nome : undefined}
        >
          <Input
            id="nome"
            placeholder={
              tipoPessoa === 'pessoa_fisica'
                ? 'Digite o nome completo'
                : 'Digite a razão social'
            }
            error={form.getFieldState('nome').invalid}
            {...form.getFieldProps('nome')}
          />
        </FormField>

        <FormField
          label={tipoPessoa === 'pessoa_fisica' ? 'CPF' : 'CNPJ'}
          htmlFor="cpfCnpj"
          error={form.getFieldState('cpfCnpj').invalid ? form.errors.cpfCnpj : undefined}
        >
          <MaskedInput
            id="cpfCnpj"
            mask={tipoPessoa === 'pessoa_fisica' ? 'cpf' : 'cnpj'}
            placeholder={tipoPessoa === 'pessoa_fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
            error={form.getFieldState('cpfCnpj').invalid}
            value={form.values.cpfCnpj || ''}
            onChange={(value) => form.setFieldValue('cpfCnpj', value)}
          />
        </FormField>
      </div>

      {/* Contato */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="E-mail"
          htmlFor="email"
          error={form.getFieldState('email').invalid ? form.errors.email : undefined}
        >
          <Input
            id="email"
            type="email"
            placeholder="email@exemplo.com"
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

      {/* Toggle Endereço */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowAddress(!showAddress)}
          className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
        >
          <MapPin className="h-4 w-4" />
          {showAddress ? 'Ocultar endereço' : 'Adicionar endereço'}
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
            <FormField label="CEP" htmlFor="cep" className="md:col-span-1">
              <MaskedInput
                id="cep"
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
            <FormField label="Logradouro" htmlFor="logradouro" className="md:col-span-3">
              <Input
                id="logradouro"
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

            <FormField label="Número" htmlFor="numero">
              <Input
                id="numero"
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
            <FormField label="Complemento" htmlFor="complemento">
              <Input
                id="complemento"
                placeholder="Apto, Sala, etc."
                value={form.values.endereco?.complemento || ''}
                onChange={(e) =>
                  form.setFieldValue('endereco', {
                    ...form.values.endereco,
                    complemento: e.target.value,
                  })
                }
              />
            </FormField>

            <FormField label="Bairro" htmlFor="bairro">
              <Input
                id="bairro"
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

            <FormField label="Cidade" htmlFor="cidade">
              <Input
                id="cidade"
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
            <FormField label="Estado" htmlFor="estado">
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

      {/* Observações */}
      <FormField label="Observações" htmlFor="observacoes">
        <Textarea
          id="observacoes"
          placeholder="Observações adicionais sobre o cliente..."
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
          {isLoading || form.isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
        </Button>
      </div>
    </form>
  );
}

export default ClienteForm;

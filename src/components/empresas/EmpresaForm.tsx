import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useCriarEmpresa, useAtualizarEmpresa, type Empresa } from '@/hooks/useEmpresas';
import { applyCnpjMask, applyPhoneMask, applyCepMask } from '@/lib/masks';
import { useCelebrations } from '@/components/wrappers/CelebrationActions';

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const empresaSchema = z.object({
  cnpj: z.string().min(14, 'CNPJ é obrigatório').max(18, 'CNPJ inválido'),
  razao_social: z.string().min(3, 'Razão Social é obrigatória').max(255, 'Máximo 255 caracteres'),
  nome_fantasia: z.string().max(255, 'Máximo 255 caracteres').optional().nullable(),
  inscricao_estadual: z.string().max(20, 'Máximo 20 caracteres').optional().nullable(),
  telefone: z.string().max(20, 'Máximo 20 caracteres').optional().nullable(),
  email: z.string().email('Email inválido').max(255, 'Máximo 255 caracteres').optional().nullable().or(z.literal('')),
  endereco: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(),
  cidade: z.string().max(100, 'Máximo 100 caracteres').optional().nullable(),
  estado: z.string().max(2, 'Selecione um estado').optional().nullable(),
  cep: z.string().max(10, 'CEP inválido').optional().nullable(),
  ativo: z.boolean(),
});

type EmpresaFormData = z.infer<typeof empresaSchema>;

interface EmpresaFormProps {
  empresa?: Empresa | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EmpresaForm({ empresa, onSuccess, onCancel }: EmpresaFormProps) {
  const isEditing = !!empresa;
  const criarEmpresa = useCriarEmpresa();
  const atualizarEmpresa = useAtualizarEmpresa();
  const { celebrateSuccess, error: showError } = useCelebrations();
  const isLoading = criarEmpresa.isPending || atualizarEmpresa.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      cnpj: '',
      razao_social: '',
      nome_fantasia: '',
      inscricao_estadual: '',
      telefone: '',
      email: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      ativo: true,
    },
  });

  useEffect(() => {
    if (empresa) {
      reset({
        cnpj: empresa.cnpj || '',
        razao_social: empresa.razao_social || '',
        nome_fantasia: empresa.nome_fantasia || '',
        inscricao_estadual: empresa.inscricao_estadual || '',
        telefone: empresa.telefone || '',
        email: empresa.email || '',
        endereco: empresa.endereco || '',
        cidade: empresa.cidade || '',
        estado: empresa.estado || '',
        cep: empresa.cep || '',
        ativo: empresa.ativo ?? true,
      });
    }
  }, [empresa, reset]);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyCnpjMask(e.target.value);
    setValue('cnpj', masked);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyPhoneMask(e.target.value);
    setValue('telefone', masked);
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyCepMask(e.target.value);
    setValue('cep', masked);
  };

  const onSubmit = async (data: EmpresaFormData) => {
    try {
      // Ensure required fields are present
      const formPayload = {
        cnpj: data.cnpj,
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia || null,
        inscricao_estadual: data.inscricao_estadual || null,
        telefone: data.telefone || null,
        email: data.email || null,
        endereco: data.endereco || null,
        cidade: data.cidade || null,
        estado: data.estado || null,
        cep: data.cep || null,
        ativo: data.ativo,
      };

      if (isEditing && empresa) {
        await atualizarEmpresa.mutateAsync({ id: empresa.id, data: formPayload });
        celebrateSuccess('Empresa atualizada com sucesso!');
      } else {
        await criarEmpresa.mutateAsync(formPayload);
        celebrateSuccess('Empresa cadastrada com sucesso!');
      }
      onSuccess();
    } catch (error: unknown) {
      showError('Erro ao salvar empresa');
    }
  };

  const ativoValue = watch('ativo');
  const estadoValue = watch('estado');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ *</Label>
          <Input
            id="cnpj"
            {...register('cnpj')}
            onChange={handleCnpjChange}
            placeholder="00.000.000/0000-00"
            maxLength={18}
            disabled={isLoading}
          />
          {errors.cnpj && <p className="text-sm text-destructive">{errors.cnpj.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
          <Input
            id="inscricao_estadual"
            {...register('inscricao_estadual')}
            placeholder="000.000.000.000"
            disabled={isLoading}
          />
          {errors.inscricao_estadual && <p className="text-sm text-destructive">{errors.inscricao_estadual.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="razao_social">Razão Social *</Label>
        <Input
          id="razao_social"
          {...register('razao_social')}
          placeholder="Razão Social da Empresa LTDA"
          disabled={isLoading}
        />
        {errors.razao_social && <p className="text-sm text-destructive">{errors.razao_social.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
        <Input
          id="nome_fantasia"
          {...register('nome_fantasia')}
          placeholder="Nome Fantasia"
          disabled={isLoading}
        />
        {errors.nome_fantasia && <p className="text-sm text-destructive">{errors.nome_fantasia.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            {...register('telefone')}
            onChange={handlePhoneChange}
            placeholder="(00) 00000-0000"
            maxLength={15}
            disabled={isLoading}
          />
          {errors.telefone && <p className="text-sm text-destructive">{errors.telefone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="contato@empresa.com"
            disabled={isLoading}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="endereco">Endereço</Label>
        <Input
          id="endereco"
          {...register('endereco')}
          placeholder="Rua, Número, Bairro"
          disabled={isLoading}
        />
        {errors.endereco && <p className="text-sm text-destructive">{errors.endereco.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade</Label>
          <Input
            id="cidade"
            {...register('cidade')}
            placeholder="Cidade"
            disabled={isLoading}
          />
          {errors.cidade && <p className="text-sm text-destructive">{errors.cidade.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="estado">Estado</Label>
          <Select
            value={estadoValue || ''}
            onValueChange={(value) => setValue('estado', value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map((uf) => (
                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.estado && <p className="text-sm text-destructive">{errors.estado.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            {...register('cep')}
            onChange={handleCepChange}
            placeholder="00000-000"
            maxLength={9}
            disabled={isLoading}
          />
          {errors.cep && <p className="text-sm text-destructive">{errors.cep.message}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2">
          <Switch
            id="ativo"
            checked={ativoValue}
            onCheckedChange={(checked) => setValue('ativo', checked)}
            disabled={isLoading}
          />
          <Label htmlFor="ativo">Empresa Ativa</Label>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Salvar Alterações' : 'Cadastrar'}
          </Button>
        </div>
      </div>
    </form>
  );
}

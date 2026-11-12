import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ESTADOS } from './empresa-form-model';

interface EmpresaFormCidadeProps {
  register: import('react-hook-form').UseFormRegister<{
    cnpj: string;
    razao_social: string;
    ativo: boolean;
    nome_fantasia?: string;
    inscricao_estadual?: string;
    telefone?: string;
    email?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    cnae_principal?: string;
    codigo_fpas?: string;
    aliquota_rat?: number;
    aliquota_terceiros?: number;
  }>;
  isLoading: boolean;
  errors: import('react-hook-form').FieldErrors<{
    cnpj: string;
    razao_social: string;
    ativo: boolean;
    nome_fantasia?: string;
    inscricao_estadual?: string;
    telefone?: string;
    email?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    cnae_principal?: string;
    codigo_fpas?: string;
    aliquota_rat?: number;
    aliquota_terceiros?: number;
  }>;
  estadoValue: string;
  setValue: import('react-hook-form').UseFormSetValue<{
    cnpj: string;
    razao_social: string;
    ativo: boolean;
    nome_fantasia?: string;
    inscricao_estadual?: string;
    telefone?: string;
    email?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    cnae_principal?: string;
    codigo_fpas?: string;
    aliquota_rat?: number;
    aliquota_terceiros?: number;
  }>;
  handleCepChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function EmpresaFormCidade({
  register,
  isLoading,
  errors,
  estadoValue,
  setValue,
  handleCepChange,
}: EmpresaFormCidadeProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="cidade">Cidade</Label>
        <Input id="cidade" {...register('cidade')} placeholder="Cidade" disabled={isLoading} />
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
              <SelectItem key={uf} value={uf}>
                {uf}
              </SelectItem>
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
  );
}

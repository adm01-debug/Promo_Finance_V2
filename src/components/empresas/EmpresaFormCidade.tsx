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

import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { EmpresaFormData } from './empresa-form-model';
interface EmpresaFormCidadeProps {
  register: UseFormRegister<EmpresaFormData>;
  isLoading: boolean;
  errors: FieldErrors<EmpresaFormData>;
  estadoValue: string | null | undefined;
  setValue: UseFormSetValue<EmpresaFormData>;
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

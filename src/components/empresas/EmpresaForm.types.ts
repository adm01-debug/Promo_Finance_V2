import type { Empresa } from '@/hooks/useEmpresas';

export interface EmpresaFormProps {
  empresa?: Empresa | null;
  onSuccess: () => void;
  onCancel: () => void;
}

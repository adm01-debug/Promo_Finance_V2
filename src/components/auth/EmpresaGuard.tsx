import { ReactNode, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  useUserEmpresas,
  getCurrentEmpresaId,
  setCurrentEmpresaId,
} from '@/hooks/useUserEmpresas';
import { EmpresaSelectionGate } from './EmpresaSelectionGate';

interface EmpresaGuardProps {
  children: ReactNode;
}

export function EmpresaGuard({ children }: EmpresaGuardProps) {
  const { data: vinculos = [], isLoading } = useUserEmpresas();
  const [confirmed, setConfirmed] = useState(false);

  // Auto-seleção quando há um único vínculo
  useEffect(() => {
    if (isLoading || confirmed) return;
    if (vinculos.length === 1) {
      const only = vinculos[0];
      const current = getCurrentEmpresaId();
      if (current !== only.empresa_id) {
        setCurrentEmpresaId(only.empresa_id);
      }
      setConfirmed(true);
    }
  }, [vinculos, isLoading, confirmed]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando empresas…</p>
        </div>
      </div>
    );
  }

  // 0 vínculos → tela de "sem vínculos"
  if (vinculos.length === 0) {
    return <EmpresaSelectionGate onSelected={() => setConfirmed(true)} />;
  }

  // 1 vínculo → já tratado pelo useEffect
  if (vinculos.length === 1) {
    return <>{children}</>;
  }

  // N vínculos: precisa de escolha persistida que aponte para um vínculo válido
  const currentId = getCurrentEmpresaId();
  const validCurrent = currentId && vinculos.some((v) => v.empresa_id === currentId);

  if (!confirmed && !validCurrent) {
    return <EmpresaSelectionGate onSelected={() => setConfirmed(true)} />;
  }

  return <>{children}</>;
}

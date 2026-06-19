import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useUserEmpresas } from '@/hooks/useUserEmpresas';
import { EmpresaSelectionGate } from './EmpresaSelectionGate';
import { EmpresaScopeProvider } from '@/contexts/EmpresaScopeContext';

interface EmpresaGuardProps {
  children: ReactNode;
}

/**
 * EmpresaGuard — refatorado para arquitetura multi-empresa consolidada.
 *
 * Não bloqueia mais quando há N vínculos. O acesso só é interrompido
 * quando o usuário NÃO tem nenhum vínculo ativo (caso em que mostramos
 * a tela de "sem vínculos" via EmpresaSelectionGate).
 *
 * Toda escolha de escopo (consolidado vs focado, multi-select de CNPJs)
 * passa a ser feita pelo `EmpresaScopeProvider` injetado aqui, com
 * persistência própria em localStorage e retrocompatibilidade da chave
 * legada `pf:current-empresa-id`.
 */
export function EmpresaGuard({ children }: EmpresaGuardProps) {
  const { data: vinculos = [], isLoading } = useUserEmpresas();

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

  // 0 vínculos → bloquear (única razão válida)
  if (vinculos.length === 0) {
    return <EmpresaSelectionGate onSelected={() => { /* re-render automático via query */ }} />;
  }

  // 1+ vínculos → segue para o app, com escopo gerenciado pelo provider
  return <EmpresaScopeProvider>{children}</EmpresaScopeProvider>;
}

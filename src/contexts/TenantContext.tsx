import React, { createContext, useContext, useState, useEffect } from 'react';
import { useEmpresas } from '@/hooks/useFinancialData';

interface TenantContextType {
  selectedTenantId: string | null;
  setSelectedTenantId: (id: string | null) => void;
  selectedTenant: any | null;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { data: empresas, isLoading } = useEmpresas();
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(() => {
    return localStorage.getItem('selected_tenant_id');
  });

  useEffect(() => {
    if (selectedTenantId) {
      localStorage.setItem('selected_tenant_id', selectedTenantId);
    } else {
      localStorage.removeItem('selected_tenant_id');
    }
  }, [selectedTenantId]);

  // Set default tenant if none selected
  useEffect(() => {
    if (!selectedTenantId && empresas && empresas.length > 0) {
      setSelectedTenantId(empresas[0].id);
    }
  }, [empresas, selectedTenantId]);

  const selectedTenant = empresas?.find(e => e.id === selectedTenantId) || null;

  return (
    <TenantContext.Provider value={{ selectedTenantId, setSelectedTenantId, selectedTenant, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

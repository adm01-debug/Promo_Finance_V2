import { useState, useEffect, useCallback } from 'react';
import { getCurrentEmpresaId } from '@/hooks/useUserEmpresas';

const BANK_ACCOUNT_STORAGE_KEY = 'pf:current-bank-account-id';

export function useGlobalFinancialFilter() {
  const [currentEmpresaId, setCurrentEmpresaId] = useState<string | null>(getCurrentEmpresaId());
  const [currentBankAccountId, setCurrentBankAccountId] = useState<string | null>(localStorage.getItem(BANK_ACCOUNT_STORAGE_KEY));

  const updateFiltersFromStorage = useCallback(() => {
    setCurrentEmpresaId(getCurrentEmpresaId());
    setCurrentBankAccountId(localStorage.getItem(BANK_ACCOUNT_STORAGE_KEY));
  }, []);

  useEffect(() => {
    const handleEmpresaChange = (e: Event) => {
      const detail = (e as CustomEvent<string | null>).detail;
      setCurrentEmpresaId(detail);
    };
    
    const handleBankChange = (e: Event) => {
      const detail = (e as CustomEvent<string | null>).detail;
      setCurrentBankAccountId(detail);
    };

    window.addEventListener('current-empresa-changed', handleEmpresaChange);
    window.addEventListener('current-bank-account-changed', handleBankChange);
    window.addEventListener('storage', updateFiltersFromStorage);
    
    return () => {
      window.removeEventListener('current-empresa-changed', handleEmpresaChange);
      window.removeEventListener('current-bank-account-changed', handleBankChange);
      window.removeEventListener('storage', updateFiltersFromStorage);
    };
  }, [updateFiltersFromStorage]);

  return {
    currentEmpresaId,
    currentBankAccountId
  };
}

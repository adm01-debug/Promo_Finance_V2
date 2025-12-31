import { createContext, useContext, ReactNode } from 'react';
import { useContasPagarData } from './hooks/useContasPagarData';

const ContasPagarContext = createContext<any>(null);

export function ContasPagarProvider({ children }: { children: ReactNode }) {
  const value = useContasPagarData();
  return (
    <ContasPagarContext.Provider value={value}>
      {children}
    </ContasPagarContext.Provider>
  );
}

export const useContasPagarContext = () => useContext(ContasPagarContext);

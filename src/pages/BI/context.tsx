import { createContext, useContext } from 'react';
import { useBIData } from './hooks/useBIData';

const BIContext = createContext<any>(null);

export function BIProvider({ children }: { children: React.ReactNode }) {
  const value = useBIData();
  return <BIContext.Provider value={value}>{children}</BIContext.Provider>;
}

export const useBIContext = () => useContext(BIContext);

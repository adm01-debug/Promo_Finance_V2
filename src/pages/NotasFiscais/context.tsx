import { createContext, useContext } from 'react';
import { useNFData } from './hooks/useNFData';

const NFContext = createContext<any>(null);

export function NFProvider({ children }: { children: React.ReactNode }) {
  const value = useNFData();
  return <NFContext.Provider value={value}>{children}</NFContext.Provider>;
}

export const useNFContext = () => useContext(NFContext);

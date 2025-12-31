import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export function useNFData() {
  const [filters, setFilters] = useState({});
  
  const { data: notas, isLoading } = useQuery({
    queryKey: ['notas-fiscais', filters],
    queryFn: async () => [],
  });

  return { notas, isLoading, filters, setFilters };
}

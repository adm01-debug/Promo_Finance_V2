import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export function useBIData() {
  const [filters, setFilters] = useState({
    period: 'month',
    startDate: null,
    endDate: null,
  });
  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['bi-metrics', filters],
    queryFn: async () => {
      // Fetch from Supabase
      return {
        revenue: 0,
        expenses: 0,
        profit: 0,
      };
    },
  });

  return { metrics, isLoading, filters, setFilters };
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export function useBIData() {
  const [period, setPeriod] = useState('month');
  const [filters, setFilters] = useState({});
  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['bi-metrics', period, filters],
    queryFn: async () => {
      // Fetch metrics
      return {};
    },
  });

  return { metrics, isLoading, period, setPeriod, filters, setFilters };
}

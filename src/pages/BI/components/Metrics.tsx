import { useBIContext } from '../context';

export function BIMetrics() {
  const { metrics } = useBIContext();
  
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">Receita</p>
        <p className="text-2xl font-bold dark:text-white">R$ 0</p>
      </div>
    </div>
  );
}

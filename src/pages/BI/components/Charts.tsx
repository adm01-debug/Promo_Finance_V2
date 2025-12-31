import { useBIContext } from '../context';

export function BICharts() {
  const { metrics } = useBIContext();
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg h-64">
        <h3 className="font-semibold mb-4 dark:text-white">Gráfico 1</h3>
      </div>
    </div>
  );
}

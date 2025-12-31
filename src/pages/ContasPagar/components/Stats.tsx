import { useContasPagarContext } from '../context';

export function ContasPagarStats() {
  const { contas } = useContasPagarContext();
  
  const stats = {
    total: contas?.length || 0,
    valor: contas?.reduce((sum: number, c: any) => sum + c.valor, 0) || 0,
    vencidas: contas?.filter((c: any) => c.status === 'vencida').length || 0,
  };
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">Total de Contas</p>
        <p className="text-2xl font-bold dark:text-white">{stats.total}</p>
      </div>
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
        <p className="text-2xl font-bold dark:text-white">R$ {stats.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      </div>
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">Vencidas</p>
        <p className="text-2xl font-bold text-red-600">{stats.vencidas}</p>
      </div>
    </div>
  );
}

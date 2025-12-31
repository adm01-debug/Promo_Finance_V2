import { useContasPagarContext } from '../context';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ContasPagarList() {
  const { contas, isLoading } = useContasPagarContext();
  
  if (isLoading) {
    return <div className="text-center py-8 dark:text-white">Carregando...</div>;
  }
  
  if (!contas || contas.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Nenhuma conta encontrada</div>;
  }
  
  return (
    <div className="space-y-2">
      {contas.map((conta: any) => (
        <div key={conta.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold dark:text-white">{conta.descricao}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vencimento: {format(new Date(conta.vencimento), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold dark:text-white">
                R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <Badge variant={conta.status === 'pago' ? 'success' : conta.status === 'vencida' ? 'destructive' : 'default'}>
                {conta.status}
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

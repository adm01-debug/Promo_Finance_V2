import { useNFContext } from '../context';

export function NFList() {
  const { notas, isLoading } = useNFContext();
  
  if (isLoading) return <div>Carregando...</div>;
  
  return (
    <div className="space-y-2">
      {notas?.map((nf: any) => (
        <div key={nf.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg">
          <p className="font-semibold dark:text-white">{nf.numero}</p>
        </div>
      ))}
    </div>
  );
}

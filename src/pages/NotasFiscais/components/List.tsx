import { useNFContext } from '../context';

export function NFList() {
  const { notas, isLoading } = useNFContext();
  
  if (isLoading) return (
    <div className="flex items-center justify-center py-8 sm:py-12 text-muted-foreground text-sm">
      Carregando...
    </div>
  );
  
  return (
    <div className="space-y-2 sm:space-y-3">
      {notas?.map((nf: any) => (
        <div key={nf.id} className="p-3 sm:p-4 bg-card dark:bg-card rounded-lg border">
          <p className="font-semibold text-sm sm:text-base dark:text-white truncate">{nf.numero}</p>
        </div>
      ))}
      {notas?.length === 0 && (
        <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm">
          Nenhuma nota fiscal encontrada
        </div>
      )}
    </div>
  );
}

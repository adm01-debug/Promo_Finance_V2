import { Button } from '@/components/ui/button';

export function BIHeader() {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold dark:text-white">Business Intelligence</h1>
      <Button>Exportar</Button>
    </div>
  );
}

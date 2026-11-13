import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export function Alertas({ alertas }: { alertas: string[] }) {
  if (alertas.length === 0) return null;
  return (
    <div className="space-y-2">
      {alertas.map((a) => (
        <Alert key={a}>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">{a}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

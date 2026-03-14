import { Loader2 } from 'lucide-react';

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}
export default LoadingPage;

import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ErrorPage() {
  const error = useRouteError();
  let errorMessage = 'Ocorreu um erro inesperado.';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center p-8">
        <AlertTriangle className="h-16 w-16 text-warning mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-foreground mb-2">
          {errorStatus}
        </h1>
        <p className="text-muted-foreground mb-8">{errorMessage}</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
          <Link to="/">
            <Button variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Voltar ao início
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
export default ErrorPage;

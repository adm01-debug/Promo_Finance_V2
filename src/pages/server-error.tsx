import { Link } from 'react-router-dom';
import { RefreshCw, Home, AlertTriangle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ServerError() {
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleReportError = () => {
    const subject = encodeURIComponent('Erro 500 - Finance Hub');
    const body = encodeURIComponent(
      `Ocorreu um erro no sistema.\n\nURL: ${window.location.href}\nData: ${new Date().toISOString()}\nUser Agent: ${navigator.userAgent}`
    );
    window.open(`mailto:suporte@financehub.com?subject=${subject}&body=${body}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-bold text-muted/50 mb-4">500</h1>

        {/* Message */}
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Erro interno do servidor
        </h2>
        <p className="text-muted-foreground mb-8">
          Ocorreu um erro inesperado em nossos servidores. Nossa equipe técnica já foi
          notificada e está trabalhando para resolver o problema.
        </p>

        {/* Status */}
        <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-200">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">
              Nossos sistemas estão sendo verificados
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleRefresh}
            variant="default"
            className="inline-flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>

          <Button
            asChild
            variant="outline"
            className="inline-flex items-center"
          >
            <Link to="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Ir para o Dashboard
            </Link>
          </Button>
        </div>

        {/* Report */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            O problema persiste?
          </p>
          <Button
            variant="ghost"
            onClick={handleReportError}
            className="inline-flex items-center text-gray-600 dark:text-gray-400"
          >
            <Mail className="w-4 h-4 mr-2" />
            Reportar erro
          </Button>
        </div>

        {/* Tips */}
        <div className="mt-8 text-left p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Enquanto isso, você pode tentar:
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Atualizar a página</li>
            <li>• Limpar o cache do navegador</li>
            <li>• Verificar sua conexão com a internet</li>
            <li>• Tentar novamente em alguns minutos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

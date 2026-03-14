import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-muted/50">404</h1>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Página não encontrada
        </h2>
        <p className="text-muted-foreground mb-8">
          A página que você está procurando não existe ou foi movida para outro endereço.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            variant="default"
            className="inline-flex items-center"
          >
            <Link to="/dashboard">
              <Home className="w-4 h-4 mr-2" />
              Ir para o Dashboard
            </Link>
          </Button>

          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Search suggestion */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">
            Ou tente buscar o que você precisa:
          </p>
          <div className="relative max-w-sm mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-8">
          <p className="text-sm text-muted-foreground mb-3">
            Links úteis:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/contas-pagar"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Contas a Pagar
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link
              to="/contas-receber"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Contas a Receber
            </Link>
            <span className="text-gray-300 dark:text-gray-700">•</span>
            <Link
              to="/relatorios"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Relatórios
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

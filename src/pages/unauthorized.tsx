import { Link, useNavigate } from 'react-router-dom';
import { ShieldOff, LogIn, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { isAuthenticated, signOut } = useAuth();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <ShieldOff className="w-12 h-12 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-bold text-gray-200 dark:text-gray-800 mb-4">401</h1>

        {/* Message */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Acesso não autorizado
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {isAuthenticated
            ? 'Você não tem permissão para acessar esta página. Se você acredita que isso é um erro, entre em contato com o administrador.'
            : 'Você precisa estar autenticado para acessar esta página. Por favor, faça login para continuar.'}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <>
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
                onClick={() => navigate(-1)}
                className="inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleLogin}
                variant="default"
                className="inline-flex items-center"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Fazer login
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </>
          )}
        </div>

        {/* Additional info for logged in users */}
        {isAuthenticated && (
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              Se você acredita que deveria ter acesso:
            </p>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                • Verifique se sua conta possui as permissões necessárias
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                • Entre em contato com o administrador do sistema
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                • Tente fazer logout e login novamente
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="mt-4 text-sm text-gray-500 dark:text-gray-400"
            >
              Fazer logout e tentar novamente
            </Button>
          </div>
        )}

        {/* Help link */}
        <div className="mt-8">
          <a
            href="mailto:suporte@financehub.com"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Precisa de ajuda? Entre em contato com o suporte
          </a>
        </div>
      </div>
    </div>
  );
}

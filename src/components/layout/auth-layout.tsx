import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { ROUTES } from '@/router/routes';
import { Loader2 } from 'lucide-react';

export function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-4 dark:bg-gray-900 lg:w-1/2">
        <Outlet />
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center bg-gradient-to-br from-primary to-primary/80 p-12">
        <div className="max-w-lg text-center text-white">
          <div className="mb-8">
            <svg
              className="mx-auto h-20 w-20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
              />
            </svg>
          </div>
          <h2 className="mb-4 text-4xl font-bold">Finance Hub</h2>
          <p className="mb-8 text-lg opacity-90">
            Gerencie suas finanças de forma simples e eficiente. 
            Controle contas a pagar, receber, fornecedores e muito mais.
          </p>
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div className="rounded-lg bg-white/10 p-4">
              <div className="text-3xl font-bold">100%</div>
              <div className="opacity-75">Seguro</div>
            </div>
            <div className="rounded-lg bg-white/10 p-4">
              <div className="text-3xl font-bold">24/7</div>
              <div className="opacity-75">Disponível</div>
            </div>
            <div className="rounded-lg bg-white/10 p-4">
              <div className="text-3xl font-bold">∞</div>
              <div className="opacity-75">Recursos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { AuthLayout } from '@/components/layout/auth-layout';
import { ProtectedRoute } from '@/components/common/protected-route';
import { LoadingPage } from '@/pages/loading';
import { ErrorPage } from '@/pages/error';

// Lazy loaded pages
const Dashboard = lazy(() => import('@/pages/dashboard'));
const ContasPagar = lazy(() => import('@/pages/ContasPagar'));
const ContasReceber = lazy(() => import('@/pages/ContasReceber'));
const Fornecedores = lazy(() => import('@/pages/Fornecedores'));
const Clientes = lazy(() => import('@/pages/Clientes'));
const Relatorios = lazy(() => import('@/pages/Relatorios'));
const Configuracoes = lazy(() => import('@/pages/Configuracoes'));
const Login = lazy(() => import('@/pages/auth/login'));
const Register = lazy(() => import('@/pages/auth/register'));
const ForgotPassword = lazy(() => import('@/pages/auth/forgot-password'));
const ResetPassword = lazy(() => import('@/pages/auth/reset-password'));

const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Suspense fallback={<LoadingPage />}><Login /></Suspense> },
      { path: 'register', element: <Suspense fallback={<LoadingPage />}><Register /></Suspense> },
      { path: 'forgot-password', element: <Suspense fallback={<LoadingPage />}><ForgotPassword /></Suspense> },
      { path: 'reset-password', element: <Suspense fallback={<LoadingPage />}><ResetPassword /></Suspense> },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Suspense fallback={<LoadingPage />}><Dashboard /></Suspense> },
      { path: 'contas-pagar', element: <Suspense fallback={<LoadingPage />}><ContasPagar /></Suspense> },
      { path: 'contas-receber', element: <Suspense fallback={<LoadingPage />}><ContasReceber /></Suspense> },
      { path: 'fornecedores', element: <Suspense fallback={<LoadingPage />}><Fornecedores /></Suspense> },
      { path: 'clientes', element: <Suspense fallback={<LoadingPage />}><Clientes /></Suspense> },
      { path: 'relatorios', element: <Suspense fallback={<LoadingPage />}><Relatorios /></Suspense> },
      { path: 'configuracoes', element: <Suspense fallback={<LoadingPage />}><Configuracoes /></Suspense> },
    ],
  },
  { path: '*', element: <ErrorPage /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

export { router };

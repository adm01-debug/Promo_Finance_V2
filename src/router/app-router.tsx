import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/common/suspense-boundary';
import { MainLayout } from '@/components/layout/main-layout';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('@/pages/Index'));
const ContasPagar = lazy(() => import('@/pages/ContasPagar'));
const ContasReceber = lazy(() => import('@/pages/ContasReceber'));
const Clientes = lazy(() => import('@/pages/Clientes'));
const Fornecedores = lazy(() => import('@/pages/Fornecedores'));
const Relatorios = lazy(() => import('@/pages/Relatorios'));
const Configuracoes = lazy(() => import('@/pages/Configuracoes'));

// Auth pages
const Login = lazy(() => import('@/pages/auth/login'));
const Register = lazy(() => import('@/pages/auth/register'));
const ForgotPassword = lazy(() => import('@/pages/auth/forgot-password'));
const ResetPassword = lazy(() => import('@/pages/auth/reset-password'));
const VerifyEmail = lazy(() => import('@/pages/auth/verify-email'));

// Error pages
const NotFound = lazy(() => import('@/pages/not-found'));
const ServerError = lazy(() => import('@/pages/server-error'));
const Unauthorized = lazy(() => import('@/pages/unauthorized'));

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader message="Verificando autenticação..." />;
  }

  if (!isAuthenticated) {
    // Save the current location for redirect after login
    const currentPath = window.location.pathname + window.location.search;
    sessionStorage.setItem('redirectAfterLogin', currentPath);
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/**
 * Public Route Component
 * Redirects to dashboard if user is already authenticated
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader message="Carregando..." />;
  }

  if (isAuthenticated) {
    // Check for saved redirect path
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
      sessionStorage.removeItem('redirectAfterLogin');
      return <Navigate to={redirectPath} replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

/**
 * App Router Component
 * Defines all application routes
 */
export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes (Auth) */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-email"
          element={
            <PublicRoute>
              <VerifyEmail />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Financial */}
          <Route path="contas-pagar" element={<ContasPagar />} />
          <Route path="contas-receber" element={<ContasReceber />} />

          {/* Entities */}
          <Route path="clientes" element={<Clientes />} />
          <Route path="fornecedores" element={<Fornecedores />} />

          {/* Reports */}
          <Route path="relatorios" element={<Relatorios />} />

          {/* Settings */}
          <Route path="configuracoes" element={<Configuracoes />} />

          {/* Nested routes for future expansion */}
          <Route path="contas-pagar/:id" element={<ContasPagar />} />
          <Route path="contas-receber/:id" element={<ContasReceber />} />
          <Route path="clientes/:id" element={<Clientes />} />
          <Route path="fornecedores/:id" element={<Fornecedores />} />
        </Route>

        {/* Error Routes */}
        <Route path="/401" element={<Unauthorized />} />
        <Route path="/500" element={<ServerError />} />
        <Route path="/404" element={<NotFound />} />

        {/* Catch all - 404 */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}

// Route definitions for navigation
export const routes = {
  // Auth
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyEmail: '/verify-email',

  // Main
  dashboard: '/dashboard',
  contasPagar: '/contas-pagar',
  contasReceber: '/contas-receber',
  clientes: '/clientes',
  fornecedores: '/fornecedores',
  relatorios: '/relatorios',
  configuracoes: '/configuracoes',

  // Dynamic
  contaPagar: (id: string) => `/contas-pagar/${id}`,
  contaReceber: (id: string) => `/contas-receber/${id}`,
  cliente: (id: string) => `/clientes/${id}`,
  fornecedor: (id: string) => `/fornecedores/${id}`,

  // Errors
  notFound: '/404',
  unauthorized: '/401',
  serverError: '/500',
};

// Navigation items for sidebar
export const navigationItems = [
  {
    name: 'Dashboard',
    href: routes.dashboard,
    icon: 'LayoutDashboard',
  },
  {
    name: 'Contas a Pagar',
    href: routes.contasPagar,
    icon: 'ArrowDownCircle',
  },
  {
    name: 'Contas a Receber',
    href: routes.contasReceber,
    icon: 'ArrowUpCircle',
  },
  {
    name: 'Clientes',
    href: routes.clientes,
    icon: 'Users',
  },
  {
    name: 'Fornecedores',
    href: routes.fornecedores,
    icon: 'Truck',
  },
  {
    name: 'Relatórios',
    href: routes.relatorios,
    icon: 'BarChart3',
  },
  {
    name: 'Configurações',
    href: routes.configuracoes,
    icon: 'Settings',
  },
];

export default AppRouter;

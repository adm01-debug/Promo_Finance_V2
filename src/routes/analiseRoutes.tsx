// Rotas do domínio "analise" (extraídas de App.tsx; mesmas rotas, mesmos lazy chunks).
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { Index, DashboardEmpresa, BI, Relatorios, Expert, Bitrix24 } from './analisePages';

export function analiseRoutes() {
  return (
    <>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard-empresa"
        element={
          <ProtectedRoute>
            <DashboardEmpresa />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bi"
        element={
          <ProtectedRoute>
            <BI />
          </ProtectedRoute>
        }
      />
      <Route
        path="/relatorios"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Relatorios />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/expert"
        element={
          <ProtectedRoute>
            <Expert />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bitrix24"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Bitrix24 />
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </>
  );
}

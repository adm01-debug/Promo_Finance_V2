// Rotas do domínio "contabil" (extraídas de App.tsx; mesmas rotas, mesmos lazy chunks).
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  DashboardReceber,
  CentroCustos,
  Demonstrativos,
  Contabilidade,
  CentroPrivacidadeLGPD,
} from './contabilPages';

export function contabilRoutes() {
  return (
    <>
      <Route
        path="/dashboard-receber"
        element={
          <ProtectedRoute>
            <DashboardReceber />
          </ProtectedRoute>
        }
      />
      <Route
        path="/centro-custos"
        element={
          <ProtectedRoute>
            <CentroCustos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/demonstrativos"
        element={
          <ProtectedRoute>
            <Demonstrativos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contabilidade"
        element={
          <ProtectedRoute requiredRoles={['admin', 'financeiro']}>
            <Contabilidade />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes/privacidade"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CentroPrivacidadeLGPD />
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </>
  );
}

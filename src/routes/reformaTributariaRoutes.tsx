// Rotas do domínio "reformaTributaria" (extraídas de App.tsx; mesmas rotas, mesmos lazy chunks).
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  ReformaTributaria,
  ProjecaoReformaPage,
  SplitPaymentPage,
  CashbackSimuladorPage,
} from './reformaTributariaPages';

export function reformaTributariaRoutes() {
  return (
    <>
      <Route
        path="/reforma-tributaria"
        element={
          <ProtectedRoute>
            <ReformaTributaria />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reforma-tributaria/:tab"
        element={
          <ProtectedRoute>
            <ReformaTributaria />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/projecao-reforma"
        element={
          <ProtectedRoute>
            <ProjecaoReformaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/split-payment"
        element={
          <ProtectedRoute>
            <SplitPaymentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/cashback"
        element={
          <ProtectedRoute>
            <CashbackSimuladorPage />
          </ProtectedRoute>
        }
      />
    </>
  );
}

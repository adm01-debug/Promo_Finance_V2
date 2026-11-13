// Rotas do domínio "fiscal" (extraídas de App.tsx; mesmas rotas, mesmos lazy chunks).
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { NotasFiscais } from './fiscalPages';

export function fiscalRoutes() {
  return (
    <>
      <Route
        path="/notas-fiscais"
        element={
          <ProtectedRoute>
            <NotasFiscais />
          </ProtectedRoute>
        }
      />
    </>
  );
}

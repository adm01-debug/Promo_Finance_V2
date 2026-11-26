// Rotas do domínio "financeiro" (extraídas de App.tsx; mesmas rotas, mesmos lazy chunks).
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  ContasPagar,
  ContasReceber,
  FluxoCaixa,
  Conciliacao,
  Cobrancas,
  Boletos,
  Clientes,
  Fornecedores,
  ContasBancarias,
  Aprovacoes,
  Financeiro,
  PagamentosRecorrentes,
  Asaas,
  BlingPage,
  Tesouraria,
  MetasFinanceirasPage,
  PortalTokensPage,
  ScoringClientesPage,
  AnaliseCreditoPage,
  Compras,
} from './financeiroPages';

export function financeiroRoutes() {
  return (
    <>
      <Route
        path="/contas-pagar"
        element={
          <ProtectedRoute>
            <ContasPagar />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contas-receber"
        element={
          <ProtectedRoute>
            <ContasReceber />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fluxo-caixa"
        element={
          <ProtectedRoute>
            <FluxoCaixa />
          </ProtectedRoute>
        }
      />
      <Route
        path="/conciliacao"
        element={
          <ProtectedRoute>
            <Conciliacao />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cobrancas"
        element={
          <ProtectedRoute>
            <Cobrancas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/boletos"
        element={
          <ProtectedRoute>
            <Boletos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            <Clientes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fornecedores"
        element={
          <ProtectedRoute>
            <Fornecedores />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contas-bancarias"
        element={
          <ProtectedRoute>
            <ContasBancarias />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aprovacoes"
        element={
          <ProtectedRoute>
            <Aprovacoes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/financeiro"
        element={
          <ProtectedRoute>
            <Financeiro />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pagamentos-recorrentes"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PagamentosRecorrentes />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/asaas"
        element={
          <ProtectedRoute>
            <Asaas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bling"
        element={
          <ProtectedRoute>
            <BlingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tesouraria"
        element={
          <ProtectedRoute>
            <Tesouraria />
          </ProtectedRoute>
        }
      />
      <Route
        path="/metas"
        element={
          <ProtectedRoute>
            <MetasFinanceirasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes/portal-tokens"
        element={
          <ProtectedRoute>
            <PortalTokensPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes/scoring"
        element={
          <ProtectedRoute>
            <ScoringClientesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes/analise-credito"
        element={
          <ProtectedRoute>
            <AnaliseCreditoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/compras"
        element={
          <ProtectedRoute>
            <Compras />
          </ProtectedRoute>
        }
      />
    </>
  );
}

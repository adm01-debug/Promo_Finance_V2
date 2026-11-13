// Rotas do domínio "geral" (extraídas de App.tsx; mesmas rotas, mesmos lazy chunks).
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  BloqueiosDuplicidade,
  Empresas,
  Alertas,
  OrganizacoesPage,
  AceitarConvitePage,
  Vendedores,
  MeuPerfil,
  Contratos,
  SimuladorAntecipacaoPage,
  AssinaturaDigitalPage,
  ComprovanteOCRPage,
  Movimentacoes,
  PixHub,
  OrcamentoEvento,
  BenchmarkingSetorial,
  InteligenciaOperacionalPage,
  Orcamentos,
  Categorias,
  StyleGuide,
} from './geralPages';

export function geralRoutes() {
  return (
    <>
      <Route
        path="/contas-pagar/bloqueios"
        element={
          <ProtectedRoute>
            <BloqueiosDuplicidade />
          </ProtectedRoute>
        }
      />
      <Route
        path="/empresas"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Empresas />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/alertas"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Alertas />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizacoes"
        element={
          <ProtectedRoute>
            <OrganizacoesPage />
          </ProtectedRoute>
        }
      />
      <Route path="/convite/:token" element={<AceitarConvitePage />} />
      <Route
        path="/vendedores"
        element={
          <ProtectedRoute>
            <Vendedores />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meu-perfil"
        element={
          <ProtectedRoute>
            <MeuPerfil />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contratos"
        element={
          <ProtectedRoute>
            <Contratos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/simulador-antecipacao"
        element={
          <ProtectedRoute>
            <SimuladorAntecipacaoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assinatura-digital"
        element={
          <ProtectedRoute>
            <AssinaturaDigitalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/comprovante-ocr"
        element={
          <ProtectedRoute>
            <ComprovanteOCRPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/movimentacoes"
        element={
          <ProtectedRoute>
            <Movimentacoes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pix-hub"
        element={
          <ProtectedRoute>
            <PixHub />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orcamento-evento"
        element={
          <ProtectedRoute>
            <OrcamentoEvento />
          </ProtectedRoute>
        }
      />
      <Route
        path="/benchmarking"
        element={
          <ProtectedRoute>
            <BenchmarkingSetorial />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inteligencia"
        element={
          <ProtectedRoute>
            <InteligenciaOperacionalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orcamentos"
        element={
          <ProtectedRoute>
            <Orcamentos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/categorias"
        element={
          <ProtectedRoute>
            <Categorias />
          </ProtectedRoute>
        }
      />
      <Route
        path="/style-guide"
        element={
          <ProtectedRoute>
            <StyleGuide />
          </ProtectedRoute>
        }
      />
    </>
  );
}

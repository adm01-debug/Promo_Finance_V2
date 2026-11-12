// Rotas do domínio "tributario" (extraídas de App.tsx; mesmas rotas, mesmos lazy chunks).
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  SimulacaoRegimes,
  HistoricoFinanceiroTributario,
  OportunidadesElisao,
  DashboardTributario,
  CatalogosFiscaisPage,
  ArquiteturaModularPage,
  AuditoriaOverlayPage,
  RecomendacaoExecutiva,
  PfVinculada,
  OnboardingTributario,
  CertificadosDigitais,
  NfeRecebidasPage,
  SefazObservabilidadePage,
  CalculadoraTributaria,
  ConciliacaoTributariaPage,
  IncentivosFiscaisPage,
  AuditoriaCompliancePage,
  ComparativoRegimesPage,
  ImportacaoXMLPage,
  SpedExportPage,
  RelatoriosContabeisPage,
  PerDcompPage,
  RetencoesFontePage,
  FechamentoMensalPage,
  GlossarioTributario,
  MonofasicoPage,
  FolhaEncargosPage,
  IcmsStDifalPage,
  IpiIssPage,
  PisCofinsCreditosPage,
  IrpjCsllLucroRealPage,
  DarfConsolidadoPage,
  ObrigacoesAcessoriasPage,
  ComparativoConformidadePage,
  PreferenciasDigestPage,
  ObservabilidadeDigestPage,
} from './tributarioPages';

export function tributarioRoutes() {
  return (
    <>
      <Route
        path="/tributario/simulacao-regimes"
        element={
          <ProtectedRoute>
            <SimulacaoRegimes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/historico-financeiro"
        element={
          <ProtectedRoute>
            <HistoricoFinanceiroTributario />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/oportunidades-elisao"
        element={
          <ProtectedRoute>
            <OportunidadesElisao />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario"
        element={
          <ProtectedRoute>
            <DashboardTributario />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/catalogos-fiscais"
        element={
          <ProtectedRoute>
            <CatalogosFiscaisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/arquitetura"
        element={
          <ProtectedRoute>
            <ArquiteturaModularPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/auditoria-overlay"
        element={
          <ProtectedRoute>
            <AuditoriaOverlayPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/dashboard"
        element={
          <ProtectedRoute>
            <DashboardTributario />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/recomendacao"
        element={
          <ProtectedRoute>
            <RecomendacaoExecutiva />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/pf-vinculada"
        element={
          <ProtectedRoute>
            <PfVinculada />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingTributario />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/certificados-digitais"
        element={
          <ProtectedRoute>
            <CertificadosDigitais />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/nfe-recebidas"
        element={
          <ProtectedRoute>
            <NfeRecebidasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/sefaz-observabilidade"
        element={
          <ProtectedRoute>
            <SefazObservabilidadePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/calculadora"
        element={
          <ProtectedRoute>
            <CalculadoraTributaria />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/conciliacao"
        element={
          <ProtectedRoute>
            <ConciliacaoTributariaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/incentivos"
        element={
          <ProtectedRoute>
            <IncentivosFiscaisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/auditoria"
        element={
          <ProtectedRoute>
            <AuditoriaCompliancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/comparativo"
        element={
          <ProtectedRoute>
            <ComparativoRegimesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/importacao-xml"
        element={
          <ProtectedRoute>
            <ImportacaoXMLPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/sped"
        element={
          <ProtectedRoute>
            <SpedExportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/relatorios-contabeis"
        element={
          <ProtectedRoute>
            <RelatoriosContabeisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/per-dcomp"
        element={
          <ProtectedRoute>
            <PerDcompPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/retencoes"
        element={
          <ProtectedRoute>
            <RetencoesFontePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/fechamento-mensal"
        element={
          <ProtectedRoute>
            <FechamentoMensalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/glossario"
        element={
          <ProtectedRoute>
            <GlossarioTributario />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/monofasico"
        element={
          <ProtectedRoute>
            <MonofasicoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/folha-encargos"
        element={
          <ProtectedRoute>
            <FolhaEncargosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/icms-st"
        element={
          <ProtectedRoute>
            <IcmsStDifalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/ipi-iss"
        element={
          <ProtectedRoute>
            <IpiIssPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/pis-cofins"
        element={
          <ProtectedRoute>
            <PisCofinsCreditosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/irpj-csll"
        element={
          <ProtectedRoute>
            <IrpjCsllLucroRealPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/darf"
        element={
          <ProtectedRoute>
            <DarfConsolidadoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/obrigacoes"
        element={
          <ProtectedRoute>
            <ObrigacoesAcessoriasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/comparativo-conformidade"
        element={
          <ProtectedRoute>
            <ComparativoConformidadePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/preferencias-digest"
        element={
          <ProtectedRoute>
            <PreferenciasDigestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tributario/observabilidade-digest"
        element={
          <ProtectedRoute>
            <ObservabilidadeDigestPage />
          </ProtectedRoute>
        }
      />
    </>
  );
}

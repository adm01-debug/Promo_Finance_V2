// Páginas (lazy chunks) do domínio "tributario" — módulo só de componentes (Fast Refresh).
import { lazy } from 'react';

export const SimulacaoRegimes = lazy(() => import('../pages/tributario/SimulacaoRegimes'));
export const HistoricoFinanceiroTributario = lazy(
  () => import('../pages/tributario/HistoricoFinanceiro')
);
export const OportunidadesElisao = lazy(() => import('../pages/tributario/OportunidadesElisao'));
export const DashboardTributario = lazy(() => import('../pages/tributario/DashboardTributario'));
export const CatalogosFiscaisPage = lazy(() => import('../pages/tributario/CatalogosFiscais'));
export const ArquiteturaModularPage = lazy(() => import('../pages/tributario/ArquiteturaModular'));
export const AuditoriaOverlayPage = lazy(() => import('../pages/tributario/AuditoriaOverlay'));
export const RecomendacaoExecutiva = lazy(
  () => import('../pages/tributario/RecomendacaoExecutiva')
);
export const PfVinculada = lazy(() => import('../pages/tributario/PfVinculada'));
export const OnboardingTributario = lazy(() => import('../pages/tributario/OnboardingTributario'));
export const CertificadosDigitais = lazy(() => import('../pages/tributario/CertificadosDigitais'));
export const NfeRecebidasPage = lazy(() => import('../pages/tributario/NfeRecebidas'));
export const SefazObservabilidadePage = lazy(
  () => import('../pages/tributario/SefazObservabilidade')
);
export const CalculadoraTributaria = lazy(
  () => import('../pages/tributario/CalculadoraTributaria')
);
export const ConciliacaoTributariaPage = lazy(
  () => import('../pages/tributario/ConciliacaoTributaria')
);
export const IncentivosFiscaisPage = lazy(() => import('../pages/tributario/IncentivosFiscais'));
export const AuditoriaCompliancePage = lazy(
  () => import('../pages/tributario/AuditoriaCompliance')
);
export const ComparativoRegimesPage = lazy(() => import('../pages/tributario/ComparativoRegimes'));
export const ImportacaoXMLPage = lazy(() => import('../pages/tributario/ImportacaoXML'));
export const SpedExportPage = lazy(() => import('../pages/tributario/SpedExport'));
export const RelatoriosContabeisPage = lazy(
  () => import('../pages/tributario/RelatoriosContabeis')
);
export const PerDcompPage = lazy(() => import('../pages/tributario/PerDcomp'));
export const RetencoesFontePage = lazy(() => import('../pages/tributario/RetencoesFonte'));
export const FechamentoMensalPage = lazy(() => import('../pages/tributario/FechamentoMensal'));
export const GlossarioTributario = lazy(() => import('../pages/tributario/GlossarioTributario'));
export const MonofasicoPage = lazy(() => import('../pages/tributario/Monofasico'));
export const FolhaEncargosPage = lazy(() => import('../pages/tributario/FolhaEncargos'));
export const IcmsStDifalPage = lazy(() => import('../pages/tributario/IcmsStDifal'));
export const IpiIssPage = lazy(() => import('../pages/tributario/IpiIss'));
export const PisCofinsCreditosPage = lazy(() => import('../pages/tributario/PisCofinsCreditos'));
export const IrpjCsllLucroRealPage = lazy(() => import('../pages/tributario/IrpjCsllLucroReal'));
export const DarfConsolidadoPage = lazy(() => import('../pages/tributario/DarfConsolidado'));
export const ObrigacoesAcessoriasPage = lazy(
  () => import('../pages/tributario/ObrigacoesAcessorias')
);
export const ComparativoConformidadePage = lazy(
  () => import('../pages/tributario/ComparativoConformidade')
);
export const PreferenciasDigestPage = lazy(() => import('../pages/tributario/PreferenciasDigest'));
export const ObservabilidadeDigestPage = lazy(
  () => import('../pages/tributario/ObservabilidadeDigest')
);

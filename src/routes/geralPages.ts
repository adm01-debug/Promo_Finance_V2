// Páginas (lazy chunks) do domínio "geral" — módulo só de componentes (Fast Refresh).
import { lazy } from 'react';

export const BloqueiosDuplicidade = lazy(() => import('../pages/BloqueiosDuplicidade'));
export const Empresas = lazy(() => import('../pages/Empresas'));
export const Alertas = lazy(() => import('../pages/Alertas'));
export const OrganizacoesPage = lazy(() => import('../pages/organizacoes/Organizacoes'));
export const AceitarConvitePage = lazy(() => import('../pages/organizacoes/AceitarConvite'));
export const Vendedores = lazy(() => import('../pages/Vendedores'));
export const MeuPerfil = lazy(() => import('../pages/MeuPerfil'));
export const Contratos = lazy(() => import('../pages/Contratos'));
export const SimuladorAntecipacaoPage = lazy(() => import('../pages/SimuladorAntecipacao'));
export const AssinaturaDigitalPage = lazy(() => import('../pages/AssinaturaDigital'));
export const ComprovanteOCRPage = lazy(() => import('../pages/ComprovanteOCR'));
export const Movimentacoes = lazy(() => import('../pages/Movimentacoes'));
export const PixHub = lazy(() => import('../pages/PixHub'));
export const OrcamentoEvento = lazy(() => import('../pages/OrcamentoEvento'));
export const BenchmarkingSetorial = lazy(() => import('../pages/BenchmarkingSetorial'));
export const InteligenciaOperacionalPage = lazy(() => import('../pages/InteligenciaOperacional'));
export const Orcamentos = lazy(() => import('../pages/Orcamentos'));
export const Categorias = lazy(() => import('../pages/Categorias'));
export const StyleGuide = lazy(() => import('../pages/StyleGuide'));

// Páginas (lazy chunks) do domínio "contabil" — módulo só de componentes (Fast Refresh).
import { lazy } from 'react';

export const DashboardReceber = lazy(() => import('../pages/DashboardReceber'));
export const CentroCustos = lazy(() => import('../pages/CentroCustos'));
export const Demonstrativos = lazy(() => import('../pages/Demonstrativos'));
export const Contabilidade = lazy(() => import('../pages/Contabilidade'));
export const CentroPrivacidadeLGPD = lazy(() => import('../pages/CentroPrivacidadeLGPD'));

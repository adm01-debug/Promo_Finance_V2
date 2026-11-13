// Páginas (lazy chunks) do domínio "analise" — módulo só de componentes (Fast Refresh).
import { lazy } from 'react';

export const Index = lazy(() => import('../pages/Index'));
export const DashboardEmpresa = lazy(() => import('../pages/DashboardEmpresa'));
export const BI = lazy(() => import('../pages/BI'));
export const Relatorios = lazy(() => import('../pages/Relatorios'));
export const Expert = lazy(() => import('../pages/Expert'));
export const Bitrix24 = lazy(() => import('../pages/Bitrix24'));

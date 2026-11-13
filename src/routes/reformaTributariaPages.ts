// Páginas (lazy chunks) do domínio "reformaTributaria" — módulo só de componentes (Fast Refresh).
import { lazy } from 'react';

export const ReformaTributaria = lazy(() => import('../pages/ReformaTributaria'));
export const ProjecaoReformaPage = lazy(() => import('../pages/tributario/ProjecaoReforma'));
export const SplitPaymentPage = lazy(() => import('../pages/tributario/SplitPayment'));
export const CashbackSimuladorPage = lazy(() => import('../pages/tributario/CashbackSimulador'));

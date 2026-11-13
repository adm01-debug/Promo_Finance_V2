// Páginas (lazy chunks) do domínio "fiscal" — módulo só de componentes (Fast Refresh).
import { lazy } from 'react';

export const NotasFiscais = lazy(() => import('../pages/NotasFiscais'));

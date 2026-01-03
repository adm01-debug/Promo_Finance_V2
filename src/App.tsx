import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy components
const Index = lazy(() => import('./pages/Index'));
const ContasPagar = lazy(() => import('./pages/ContasPagar'));
const ContasReceber = lazy(() => import('./pages/ContasReceber'));
const BI = lazy(() => import('./pages/BI'));
const NotasFiscais = lazy(() => import('./pages/NotasFiscais'));
const FluxoCaixa = lazy(() => import('./pages/FluxoCaixa'));
const Relatorios = lazy(() => import('./pages/Relatorios'));
const Expert = lazy(() => import('./pages/Expert'));

function PageSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/contas-pagar" element={<ContasPagar />} />
            <Route path="/contas-receber" element={<ContasReceber />} />
            <Route path="/bi" element={<BI />} />
            <Route path="/notas-fiscais" element={<NotasFiscais />} />
            <Route path="/fluxo-caixa" element={<FluxoCaixa />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/expert" element={<Expert />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

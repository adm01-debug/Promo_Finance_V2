import { useLocation } from 'react-router-dom';
import { BackButton } from '@/components/navigation/BackButton';
import { getRouteLabel } from '@/lib/navigation';

/**
 * App-bar mobile: botão Voltar sempre visível + título da página atual.
 * O gesto de swipe-back continua disponível como atalho; o botão é a
 * affordance visível (gestos não são descobríveis).
 */
export function MobileHeader() {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center gap-2 border-b border-white/10 bg-background/60 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-3xl md:hidden">
      <BackButton size="sm" variant="ghost" className="shrink-0 -ml-1" />
      {/* span, não h1: cada página já renderiza seu próprio título de
          nível 1 — um segundo heading deixaria a hierarquia ambígua. */}
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
        {getRouteLabel(location.pathname)}
      </span>
    </header>
  );
}

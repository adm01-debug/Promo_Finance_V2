interface SkipLinksProps {
  /** Âncora da navegação sempre montada no contexto atual. */
  navTarget?: string;
}

export function SkipLinks({ navTarget = '#main-nav' }: SkipLinksProps) {
  return (
    <div className="fixed top-0 left-0 z-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
      >
        Pular para conteúdo principal
      </a>
      <a
        href={navTarget}
        className="sr-only focus:not-sr-only focus:absolute focus:top-12 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
      >
        Pular para navegação
      </a>
    </div>
  );
}

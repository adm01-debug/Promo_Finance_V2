import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

export function SkipLink({ 
  href = '#main-content', 
  children = 'Pular para o conteúdo principal',
  className 
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100]',
        'bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'transition-all duration-200',
        className
      )}
    >
      {children}
    </a>
  );
}

// Additional skip links for complex layouts
export function SkipLinks() {
  return (
    <div className="skip-links">
      <SkipLink href="#main-content">
        Pular para o conteúdo principal
      </SkipLink>
      <SkipLink href="#navigation" className="focus:left-4 focus:top-14">
        Pular para navegação
      </SkipLink>
    </div>
  );
}

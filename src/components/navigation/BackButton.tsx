import { forwardRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  /** Override default back behavior with a specific path */
  fallbackPath?: string;
  /** Label to show next to the icon */
  label?: string;
  /** Whether to show the label or just the icon */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Variant */
  variant?: 'ghost' | 'outline' | 'default';
}

// Map child routes to their parent for smart fallback
const parentRouteMap: Record<string, string> = {
  '/bi': '/',
  '/fluxo-caixa': '/',
  '/contas-pagar': '/',
  '/contas-receber': '/',
  '/cobrancas': '/',
  '/boletos': '/',
  '/conciliacao': '/',
  '/notas-fiscais': '/',
  '/relatorios': '/',
  '/demonstrativos': '/',
  '/clientes': '/',
  '/fornecedores': '/',
  '/empresas': '/',
  '/centros-custo': '/',
  '/contas-bancarias': '/',
  '/pagamentos-recorrentes': '/',
  '/reforma-tributaria': '/',
  '/expert': '/',
  '/configuracoes': '/',
  '/seguranca': '/',
  '/alertas': '/',
  '/aprovacoes': '/',
  '/usuarios': '/configuracoes',
  '/pedidos': '/',
  '/gestor-compras': '/',
  '/catalogo': '/',
};

export const BackButton = forwardRef<HTMLButtonElement, BackButtonProps>(
  ({ fallbackPath, label, showLabel = false, className, size = 'default', variant = 'ghost' }, ref) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Don't render on home page
    if (location.pathname === '/' || location.pathname === '/dashboard') {
      return null;
    }

    const handleBack = () => {
      if (fallbackPath) {
        navigate(fallbackPath);
        return;
      }

      // Try to use browser history first
      if (window.history.length > 2) {
        navigate(-1);
        return;
      }

      // Fallback to parent route
      const parentRoute = parentRouteMap[location.pathname] || '/';
      navigate(parentRoute);
    };

    const tooltipLabel = label || 'Voltar';

    const sizeClasses = {
      sm: 'h-7 w-7',
      default: 'h-9 w-9',
      lg: 'h-11 w-11',
    };

    const iconSizes = {
      sm: 'h-3.5 w-3.5',
      default: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              ref={ref}
              variant={variant}
              size={showLabel ? size : 'icon'}
              onClick={handleBack}
              className={cn(
                'group transition-all duration-200',
                !showLabel && sizeClasses[size],
                className
              )}
              aria-label={tooltipLabel}
            >
              <ArrowLeft className={cn(
                iconSizes[size],
                'transition-transform group-hover:-translate-x-0.5'
              )} />
              {showLabel && (
                <span className="ml-1.5 text-sm">{tooltipLabel}</span>
              )}
            </Button>
          </motion.div>
        </TooltipTrigger>
        {!showLabel && (
          <TooltipContent side="bottom">
            <p>{tooltipLabel} <kbd className="ml-1 text-[10px] opacity-60">Alt+←</kbd></p>
          </TooltipContent>
        )}
      </Tooltip>
    );
  }
);

BackButton.displayName = 'BackButton';

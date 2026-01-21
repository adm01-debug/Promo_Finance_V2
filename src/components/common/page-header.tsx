import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  backButton?: boolean;
  backHref?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: ReactNode;
  tabs?: ReactNode;
  className?: string;
  sticky?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  description,
  action,
  secondaryAction,
  backButton = false,
  backHref,
  breadcrumbs,
  badge,
  tabs,
  className,
  sticky = false,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backHref) {
      navigate(backHref);
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      className={cn(
        'border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
        sticky && 'sticky top-0 z-10',
        className
      )}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 py-3 text-sm">
            {breadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && (
                  <span className="text-gray-400 dark:text-gray-500">/</span>
                )}
                {item.href ? (
                  <button
                    onClick={() => navigate(item.href!)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="text-gray-900 dark:text-white font-medium">
                    {item.label}
                  </span>
                )}
              </div>
            ))}
          </nav>
        )}

        {/* Main Header */}
        <div className="py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              {backButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="mt-1 shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {title}
                  </h1>
                  {badge}
                </div>
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {subtitle}
                  </p>
                )}
                {description && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
                    {description}
                  </p>
                )}
              </div>
            </div>
            {(action || secondaryAction) && (
              <div className="flex items-center gap-3 shrink-0">
                {secondaryAction}
                {action}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        {tabs && <div className="-mb-px">{tabs}</div>}
      </div>
    </div>
  );
}

// Compact Page Header (for modals, sidebars)
interface CompactPageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function CompactPageHeader({
  title,
  subtitle,
  action,
  onClose,
  className,
}: CompactPageHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {action}
        {onClose && (
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <span className="sr-only">Fechar</span>
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        )}
      </div>
    </div>
  );
}

// Section Header (for page sections)
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
  size = 'md',
}: SectionHeaderProps) {
  const sizes = {
    sm: {
      title: 'text-sm font-medium',
      subtitle: 'text-xs',
    },
    md: {
      title: 'text-base font-semibold',
      subtitle: 'text-sm',
    },
    lg: {
      title: 'text-lg font-semibold',
      subtitle: 'text-sm',
    },
  };

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <h3
          className={cn(
            'text-gray-900 dark:text-white',
            sizes[size].title
          )}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            className={cn(
              'text-gray-500 dark:text-gray-400 mt-0.5',
              sizes[size].subtitle
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export default PageHeader;

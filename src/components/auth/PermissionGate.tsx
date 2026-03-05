import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface PermissionGateProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showFallback?: boolean;
}

export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback,
  showFallback = false,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();
  const { isAdmin } = useAuth();

  // Admin always has access
  if (isAdmin) {
    return <>{children}</>;
  }

  // Still loading permissions
  if (isLoading) {
    return null;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions) 
      : hasAnyPermission(permissions);
  } else {
    // No permission specified, allow access
    hasAccess = true;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show fallback if provided and enabled
  if (showFallback) {
    return fallback || (
      <Alert variant="error" className="my-4">
        <ShieldX className="h-4 w-4" />
        <AlertDescription>
          Você não tem permissão para acessar este recurso.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

// HOC version for wrapping components
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: string
) {
  return function PermissionWrapper(props: P) {
    return (
      <PermissionGate permission={permission} showFallback>
        <WrappedComponent {...props} />
      </PermissionGate>
    );
  };
}

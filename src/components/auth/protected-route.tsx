import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Types
interface User {
  id: string;
  email: string;
  nome?: string;
  role?: 'admin' | 'user' | 'viewer';
  permissions?: string[];
}

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'user' | 'viewer';
  requiredPermissions?: string[];
  redirectTo?: string;
  loadingComponent?: ReactNode;
  unauthorizedComponent?: ReactNode;
}

// Mock auth check - replace with actual auth logic
async function checkAuth(): Promise<User | null> {
  // Check for auth token
  const token = localStorage.getItem('fh_secure_auth_token') || localStorage.getItem('auth_token');
  
  if (!token) {
    return null;
  }

  // In a real app, validate token with backend
  // For now, return mock user from localStorage
  try {
    const userData = localStorage.getItem('fh_user_data');
    if (userData) {
      return JSON.parse(userData) as User;
    }
    
    // Mock user for development
    if (import.meta.env.DEV) {
      return {
        id: 'dev-user',
        email: 'dev@example.com',
        nome: 'Developer',
        role: 'admin',
        permissions: ['*'],
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

// Check if user has required role
function hasRequiredRole(user: User, requiredRole?: string): boolean {
  if (!requiredRole) return true;
  
  const roleHierarchy: Record<string, number> = {
    viewer: 1,
    user: 2,
    admin: 3,
  };
  
  const userRoleLevel = roleHierarchy[user.role || 'viewer'] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
  
  return userRoleLevel >= requiredRoleLevel;
}

// Check if user has required permissions
function hasRequiredPermissions(user: User, requiredPermissions?: string[]): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  
  const userPermissions = user.permissions || [];
  
  // Admin with wildcard has all permissions
  if (userPermissions.includes('*')) return true;
  
  return requiredPermissions.every((perm) => userPermissions.includes(perm));
}

// Default loading component
function DefaultLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Verificando autenticação...</p>
      </div>
    </div>
  );
}

// Default unauthorized component
function DefaultUnauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
          <svg
            className="h-8 w-8 text-yellow-600 dark:text-yellow-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Acesso Não Autorizado
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Você não tem permissão para acessar esta página.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Voltar ao Início
        </a>
      </div>
    </div>
  );
}

// Main Protected Route component
export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermissions,
  redirectTo = '/login',
  loadingComponent,
  unauthorizedComponent,
}: ProtectedRouteProps) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function verifyAuth() {
      try {
        const currentUser = await checkAuth();
        
        if (!mounted) return;

        if (!currentUser) {
          setIsLoading(false);
          setUser(null);
          setIsAuthorized(false);
          return;
        }

        const roleOk = hasRequiredRole(currentUser, requiredRole);
        const permsOk = hasRequiredPermissions(currentUser, requiredPermissions);

        setUser(currentUser);
        setIsAuthorized(roleOk && permsOk);
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        if (mounted) {
          setIsLoading(false);
          setUser(null);
          setIsAuthorized(false);
        }
      }
    }

    verifyAuth();

    return () => {
      mounted = false;
    };
  }, [requiredRole, requiredPermissions]);

  // Show loading state
  if (isLoading) {
    return <>{loadingComponent || <DefaultLoading />}</>;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Show unauthorized if authenticated but not authorized
  if (!isAuthorized) {
    return <>{unauthorizedComponent || <DefaultUnauthorized />}</>;
  }

  // Render children if authorized
  return <>{children}</>;
}

// Higher-order component version
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  const displayName = Component.displayName || Component.name || 'Component';

  const WrappedComponent = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  WrappedComponent.displayName = `withProtectedRoute(${displayName})`;

  return WrappedComponent;
}

// Role-specific route components
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute {...props} requiredRole="admin">
      {children}
    </ProtectedRoute>
  );
}

export function UserRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute {...props} requiredRole="user">
      {children}
    </ProtectedRoute>
  );
}

// Permission-specific route
export function PermissionRoute({
  children,
  permissions,
  ...props
}: Omit<ProtectedRouteProps, 'requiredPermissions'> & { permissions: string[] }) {
  return (
    <ProtectedRoute {...props} requiredPermissions={permissions}>
      {children}
    </ProtectedRoute>
  );
}

// Public-only route (redirect if authenticated)
interface PublicOnlyRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export function PublicOnlyRoute({ children, redirectTo = '/' }: PublicOnlyRouteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function check() {
      const user = await checkAuth();
      setIsAuthenticated(!!user);
      setIsLoading(false);
    }
    check();
  }, []);

  if (isLoading) {
    return <DefaultLoading />;
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;

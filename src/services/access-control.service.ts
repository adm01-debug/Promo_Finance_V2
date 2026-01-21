/**
 * Access Control / Permissions Service
 * Role-based and permission-based access control
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Permission types
type Permission =
  // Contas a Pagar
  | 'contas_pagar:read'
  | 'contas_pagar:create'
  | 'contas_pagar:update'
  | 'contas_pagar:delete'
  | 'contas_pagar:pay'
  | 'contas_pagar:export'
  // Contas a Receber
  | 'contas_receber:read'
  | 'contas_receber:create'
  | 'contas_receber:update'
  | 'contas_receber:delete'
  | 'contas_receber:receive'
  | 'contas_receber:export'
  // Clientes
  | 'clientes:read'
  | 'clientes:create'
  | 'clientes:update'
  | 'clientes:delete'
  // Fornecedores
  | 'fornecedores:read'
  | 'fornecedores:create'
  | 'fornecedores:update'
  | 'fornecedores:delete'
  // Categorias
  | 'categorias:read'
  | 'categorias:create'
  | 'categorias:update'
  | 'categorias:delete'
  // Relatórios
  | 'relatorios:read'
  | 'relatorios:export'
  // Configurações
  | 'configuracoes:read'
  | 'configuracoes:update'
  // Usuários
  | 'usuarios:read'
  | 'usuarios:create'
  | 'usuarios:update'
  | 'usuarios:delete'
  // Integrações
  | 'integracoes:read'
  | 'integracoes:update'
  // Admin
  | 'admin:full_access';

// Role types
type Role = 'admin' | 'manager' | 'accountant' | 'viewer' | 'custom';

// Role definitions
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'admin:full_access',
    // All permissions
    'contas_pagar:read', 'contas_pagar:create', 'contas_pagar:update', 'contas_pagar:delete', 'contas_pagar:pay', 'contas_pagar:export',
    'contas_receber:read', 'contas_receber:create', 'contas_receber:update', 'contas_receber:delete', 'contas_receber:receive', 'contas_receber:export',
    'clientes:read', 'clientes:create', 'clientes:update', 'clientes:delete',
    'fornecedores:read', 'fornecedores:create', 'fornecedores:update', 'fornecedores:delete',
    'categorias:read', 'categorias:create', 'categorias:update', 'categorias:delete',
    'relatorios:read', 'relatorios:export',
    'configuracoes:read', 'configuracoes:update',
    'usuarios:read', 'usuarios:create', 'usuarios:update', 'usuarios:delete',
    'integracoes:read', 'integracoes:update',
  ],
  
  manager: [
    'contas_pagar:read', 'contas_pagar:create', 'contas_pagar:update', 'contas_pagar:pay', 'contas_pagar:export',
    'contas_receber:read', 'contas_receber:create', 'contas_receber:update', 'contas_receber:receive', 'contas_receber:export',
    'clientes:read', 'clientes:create', 'clientes:update',
    'fornecedores:read', 'fornecedores:create', 'fornecedores:update',
    'categorias:read', 'categorias:create', 'categorias:update',
    'relatorios:read', 'relatorios:export',
    'configuracoes:read',
  ],
  
  accountant: [
    'contas_pagar:read', 'contas_pagar:create', 'contas_pagar:update', 'contas_pagar:pay', 'contas_pagar:export',
    'contas_receber:read', 'contas_receber:create', 'contas_receber:update', 'contas_receber:receive', 'contas_receber:export',
    'clientes:read',
    'fornecedores:read',
    'categorias:read',
    'relatorios:read', 'relatorios:export',
  ],
  
  viewer: [
    'contas_pagar:read',
    'contas_receber:read',
    'clientes:read',
    'fornecedores:read',
    'categorias:read',
    'relatorios:read',
  ],
  
  custom: [],
};

// User interface
interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  permissions?: Permission[];
}

// Context
interface AccessControlContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  hasRole: (role: Role) => boolean;
  isAdmin: () => boolean;
  canAccess: (resource: string, action: string) => boolean;
}

const AccessControlContext = createContext<AccessControlContextValue | null>(null);

// Provider
interface AccessControlProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

export function AccessControlProvider({ children, initialUser = null }: AccessControlProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);

  const getUserPermissions = useCallback((): Permission[] => {
    if (!user) return [];
    
    // Get role permissions
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    
    // Merge with custom permissions
    const customPermissions = user.permissions || [];
    
    return [...new Set([...rolePermissions, ...customPermissions])];
  }, [user]);

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    
    const permissions = getUserPermissions();
    
    // Admin has full access
    if (permissions.includes('admin:full_access')) return true;
    
    return permissions.includes(permission);
  }, [user, getUserPermissions]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return permissions.some((p) => hasPermission(p));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    return permissions.every((p) => hasPermission(p));
  }, [hasPermission]);

  const hasRole = useCallback((role: Role): boolean => {
    return user?.role === role;
  }, [user]);

  const isAdmin = useCallback((): boolean => {
    return hasRole('admin');
  }, [hasRole]);

  const canAccess = useCallback((resource: string, action: string): boolean => {
    const permission = `${resource}:${action}` as Permission;
    return hasPermission(permission);
  }, [hasPermission]);

  const value: AccessControlContextValue = {
    user,
    setUser,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    canAccess,
  };

  return (
    <AccessControlContext.Provider value={value}>
      {children}
    </AccessControlContext.Provider>
  );
}

// Hook
export function useAccessControl(): AccessControlContextValue {
  const context = useContext(AccessControlContext);
  if (!context) {
    throw new Error('useAccessControl must be used within an AccessControlProvider');
  }
  return context;
}

// Shortcut hooks
export function usePermission(permission: Permission): boolean {
  const { hasPermission } = useAccessControl();
  return hasPermission(permission);
}

export function usePermissions(permissions: Permission[]): Record<Permission, boolean> {
  const { hasPermission } = useAccessControl();
  const result = {} as Record<Permission, boolean>;
  permissions.forEach((p) => {
    result[p] = hasPermission(p);
  });
  return result;
}

// Component for conditional rendering
interface CanProps {
  permission: Permission | Permission[];
  fallback?: ReactNode;
  children: ReactNode;
  matchAll?: boolean;
}

export function Can({ permission, fallback = null, children, matchAll = false }: CanProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = useAccessControl();
  
  const allowed = Array.isArray(permission)
    ? (matchAll ? hasAllPermissions(permission) : hasAnyPermission(permission))
    : hasPermission(permission);
  
  return allowed ? <>{children}</> : <>{fallback}</>;
}

// Guard component
interface PermissionGuardProps {
  permission: Permission | Permission[];
  redirect?: string;
  children: ReactNode;
}

export function PermissionGuard({ permission, redirect = '/unauthorized', children }: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission } = useAccessControl();
  
  const allowed = Array.isArray(permission)
    ? hasAnyPermission(permission)
    : hasPermission(permission);
  
  if (!allowed) {
    // In a real app, this would use React Router's Navigate
    window.location.href = redirect;
    return null;
  }
  
  return <>{children}</>;
}

// Role definitions export
export const ROLES: Record<Role, { name: string; description: string }> = {
  admin: {
    name: 'Administrador',
    description: 'Acesso total ao sistema',
  },
  manager: {
    name: 'Gerente',
    description: 'Gerencia contas, clientes e fornecedores',
  },
  accountant: {
    name: 'Contador',
    description: 'Acesso a contas e relatórios',
  },
  viewer: {
    name: 'Visualizador',
    description: 'Apenas visualização',
  },
  custom: {
    name: 'Personalizado',
    description: 'Permissões personalizadas',
  },
};

// Permission definitions export
export const PERMISSIONS: Record<string, { name: string; description: string }> = {
  'contas_pagar:read': { name: 'Ver Contas a Pagar', description: 'Visualizar contas a pagar' },
  'contas_pagar:create': { name: 'Criar Contas a Pagar', description: 'Criar novas contas a pagar' },
  'contas_pagar:update': { name: 'Editar Contas a Pagar', description: 'Editar contas a pagar existentes' },
  'contas_pagar:delete': { name: 'Excluir Contas a Pagar', description: 'Excluir contas a pagar' },
  'contas_pagar:pay': { name: 'Baixar Contas a Pagar', description: 'Registrar pagamentos' },
  'contas_pagar:export': { name: 'Exportar Contas a Pagar', description: 'Exportar relatórios de contas a pagar' },
  
  'contas_receber:read': { name: 'Ver Contas a Receber', description: 'Visualizar contas a receber' },
  'contas_receber:create': { name: 'Criar Contas a Receber', description: 'Criar novas contas a receber' },
  'contas_receber:update': { name: 'Editar Contas a Receber', description: 'Editar contas a receber existentes' },
  'contas_receber:delete': { name: 'Excluir Contas a Receber', description: 'Excluir contas a receber' },
  'contas_receber:receive': { name: 'Baixar Contas a Receber', description: 'Registrar recebimentos' },
  'contas_receber:export': { name: 'Exportar Contas a Receber', description: 'Exportar relatórios de contas a receber' },
  
  'clientes:read': { name: 'Ver Clientes', description: 'Visualizar clientes' },
  'clientes:create': { name: 'Criar Clientes', description: 'Cadastrar novos clientes' },
  'clientes:update': { name: 'Editar Clientes', description: 'Editar clientes existentes' },
  'clientes:delete': { name: 'Excluir Clientes', description: 'Excluir clientes' },
  
  'fornecedores:read': { name: 'Ver Fornecedores', description: 'Visualizar fornecedores' },
  'fornecedores:create': { name: 'Criar Fornecedores', description: 'Cadastrar novos fornecedores' },
  'fornecedores:update': { name: 'Editar Fornecedores', description: 'Editar fornecedores existentes' },
  'fornecedores:delete': { name: 'Excluir Fornecedores', description: 'Excluir fornecedores' },
  
  'categorias:read': { name: 'Ver Categorias', description: 'Visualizar categorias' },
  'categorias:create': { name: 'Criar Categorias', description: 'Criar novas categorias' },
  'categorias:update': { name: 'Editar Categorias', description: 'Editar categorias existentes' },
  'categorias:delete': { name: 'Excluir Categorias', description: 'Excluir categorias' },
  
  'relatorios:read': { name: 'Ver Relatórios', description: 'Acessar relatórios' },
  'relatorios:export': { name: 'Exportar Relatórios', description: 'Exportar relatórios' },
  
  'configuracoes:read': { name: 'Ver Configurações', description: 'Acessar configurações' },
  'configuracoes:update': { name: 'Editar Configurações', description: 'Alterar configurações' },
  
  'usuarios:read': { name: 'Ver Usuários', description: 'Visualizar usuários' },
  'usuarios:create': { name: 'Criar Usuários', description: 'Cadastrar novos usuários' },
  'usuarios:update': { name: 'Editar Usuários', description: 'Editar usuários existentes' },
  'usuarios:delete': { name: 'Excluir Usuários', description: 'Excluir usuários' },
  
  'integracoes:read': { name: 'Ver Integrações', description: 'Visualizar integrações' },
  'integracoes:update': { name: 'Configurar Integrações', description: 'Configurar integrações' },
  
  'admin:full_access': { name: 'Acesso Total', description: 'Acesso administrativo completo' },
};

export type { Permission, Role, User };
export default useAccessControl;

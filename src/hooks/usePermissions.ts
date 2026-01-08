import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

interface Permission {
  id: string;
  name: string;
  description: string | null;
  module: string;
}

export function usePermissions() {
  const { user, role, isAdmin } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch all permissions
      const { data: allPermissions, error: permError } = await supabase
        .from('permissions')
        .select('*')
        .order('module', { ascending: true });

      if (permError) {
        logger.error('Erro ao buscar permissões:', permError);
        return;
      }

      setPermissions(allPermissions || []);

      // If admin, has all permissions
      if (isAdmin) {
        setUserPermissions(allPermissions?.map(p => p.name) || []);
        return;
      }

      // Fetch user's role permissions
      if (role) {
        const { data: rolePerms, error: roleError } = await supabase
          .from('role_permissions')
          .select('permission_id, permissions(name)')
          .eq('role', role);

        if (roleError) {
          logger.error('Erro ao buscar permissões do role:', roleError);
          return;
        }

        const permNames = rolePerms
          ?.map((rp: any) => rp.permissions?.name)
          .filter(Boolean) || [];
        
        setUserPermissions(permNames);
      }
    } catch (error: unknown) {
      logger.error('Erro ao buscar permissões:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, role, isAdmin]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback((permissionName: string): boolean => {
    if (isAdmin) return true;
    return userPermissions.includes(permissionName);
  }, [userPermissions, isAdmin]);

  const hasAnyPermission = useCallback((permissionNames: string[]): boolean => {
    if (isAdmin) return true;
    return permissionNames.some(p => userPermissions.includes(p));
  }, [userPermissions, isAdmin]);

  const hasAllPermissions = useCallback((permissionNames: string[]): boolean => {
    if (isAdmin) return true;
    return permissionNames.every(p => userPermissions.includes(p));
  }, [userPermissions, isAdmin]);

  const getPermissionsByModule = useCallback((module: string): Permission[] => {
    return permissions.filter(p => p.module === module);
  }, [permissions]);

  const modules = [...new Set(permissions.map(p => p.module))];

  return {
    permissions,
    userPermissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissionsByModule,
    modules,
    refresh: fetchPermissions,
  };
}

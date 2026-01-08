import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { 
  Shield, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  Receipt,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Permission {
  id: string;
  name: string;
  description: string | null;
  module: string;
}

interface RolePermission {
  id: string;
  role: string;
  permission_id: string;
}

const ROLES = ['admin', 'financeiro', 'operacional', 'visualizador'] as const;
type Role = typeof ROLES[number];

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  financeiro: 'Financeiro',
  operacional: 'Operacional',
  visualizador: 'Visualizador',
};

const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-red-500/10 text-red-500 border-red-500/20',
  financeiro: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  operacional: 'bg-green-500/10 text-green-500 border-green-500/20',
  visualizador: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const MODULE_ICONS: Record<string, React.ReactNode> = {
  admin: <Settings className="h-4 w-4" />,
  cadastro: <Users className="h-4 w-4" />,
  dashboard: <BarChart3 className="h-4 w-4" />,
  financeiro: <Receipt className="h-4 w-4" />,
  fiscal: <FileText className="h-4 w-4" />,
  relatorios: <BarChart3 className="h-4 w-4" />,
};

const MODULE_LABELS: Record<string, string> = {
  admin: 'Administração',
  cadastro: 'Cadastros',
  dashboard: 'Dashboard',
  financeiro: 'Financeiro',
  fiscal: 'Fiscal',
  relatorios: 'Relatórios',
};

export function GerenciadorPermissoes() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
  const [activeRole, setActiveRole] = useState<Role>('admin');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [permResult, rolePermResult] = await Promise.all([
        supabase.from('permissions').select('*').order('module').order('name'),
        supabase.from('role_permissions').select('*'),
      ]);

      if (permResult.error) throw permResult.error;
      if (rolePermResult.error) throw rolePermResult.error;

      setPermissions(permResult.data || []);
      setRolePermissions(rolePermResult.data || []);
    } catch (error: unknown) {
      logger.error('Erro ao carregar permissões:', error);
      toast.error('Erro ao carregar permissões');
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (role: Role, permissionId: string): boolean => {
    const key = `${role}-${permissionId}`;
    if (pendingChanges.has(key)) {
      return pendingChanges.get(key)!;
    }
    return rolePermissions.some(rp => rp.role === role && rp.permission_id === permissionId);
  };

  const togglePermission = (role: Role, permissionId: string) => {
    const key = `${role}-${permissionId}`;
    const currentValue = hasPermission(role, permissionId);
    
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      const originalValue = rolePermissions.some(rp => rp.role === role && rp.permission_id === permissionId);
      
      if (currentValue === originalValue) {
        // Adding a change
        newMap.set(key, !currentValue);
      } else {
        // Reverting to original
        newMap.delete(key);
      }
      
      return newMap;
    });
  };

  const saveChanges = async () => {
    if (pendingChanges.size === 0) return;

    setIsSaving(true);
    try {
      const toAdd: { role: Role; permission_id: string }[] = [];
      const toRemove: string[] = [];

      pendingChanges.forEach((newValue, key) => {
        const [role, permissionId] = key.split('-');
        if (newValue) {
          toAdd.push({ role: role as Role, permission_id: permissionId });
        } else {
          const existing = rolePermissions.find(
            rp => rp.role === role && rp.permission_id === permissionId
          );
          if (existing) {
            toRemove.push(existing.id);
          }
        }
      });

      // Execute removals
      if (toRemove.length > 0) {
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .in('id', toRemove);
        if (error) throw error;
      }

      // Execute additions
      if (toAdd.length > 0) {
        const { error } = await supabase
          .from('role_permissions')
          .insert(toAdd);
        if (error) throw error;
      }

      toast.success('Permissões atualizadas com sucesso!');
      setPendingChanges(new Map());
      await fetchData();
    } catch (error: unknown) {
      logger.error('Erro ao salvar permissões:', error);
      toast.error('Erro ao salvar permissões');
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = () => {
    setPendingChanges(new Map());
  };

  const getModules = (): string[] => {
    return [...new Set(permissions.map(p => p.module))];
  };

  const getPermissionsByModule = (module: string): Permission[] => {
    return permissions.filter(p => p.module === module);
  };

  const getRolePermissionCount = (role: Role): number => {
    return permissions.filter(p => hasPermission(role, p.id)).length;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Gerenciador de Permissões</CardTitle>
              <CardDescription>
                Configure as permissões de cada perfil de usuário
              </CardDescription>
            </div>
          </div>
          
          <AnimatePresence>
            {pendingChanges.size > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2"
              >
                <Badge variant="outline" className="gap-1">
                  {pendingChanges.size} alteração{pendingChanges.size > 1 ? 'ões' : ''}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={discardChanges}
                  disabled={isSaving}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Descartar
                </Button>
                <Button
                  size="sm"
                  onClick={saveChanges}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Salvar
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeRole} onValueChange={(v) => setActiveRole(v as Role)}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            {ROLES.map(role => (
              <TabsTrigger key={role} value={role} className="gap-2">
                <span className="hidden sm:inline">{ROLE_LABELS[role]}</span>
                <span className="sm:hidden">{role.slice(0, 3).toUpperCase()}</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {getRolePermissionCount(role)}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {ROLES.map(role => (
            <TabsContent key={role} value={role} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge className={ROLE_COLORS[role]}>
                  {ROLE_LABELS[role]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {getRolePermissionCount(role)} de {permissions.length} permissões ativas
                </span>
              </div>

              <div className="grid gap-4">
                {getModules().map(module => (
                  <motion.div
                    key={module}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-muted rounded">
                        {MODULE_ICONS[module] || <Settings className="h-4 w-4" />}
                      </div>
                      <h4 className="font-medium">{MODULE_LABELS[module] || module}</h4>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {getPermissionsByModule(module).filter(p => hasPermission(role, p.id)).length}/
                        {getPermissionsByModule(module).length}
                      </Badge>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {getPermissionsByModule(module).map(permission => {
                        const isChecked = hasPermission(role, permission.id);
                        const key = `${role}-${permission.id}`;
                        const hasChange = pendingChanges.has(key);

                        return (
                          <TooltipProvider key={permission.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <label
                                  className={`
                                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                                    transition-all hover:bg-muted/50
                                    ${hasChange ? 'ring-2 ring-primary/50 bg-primary/5' : ''}
                                    ${isChecked ? 'border-primary/30' : 'border-border'}
                                  `}
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => togglePermission(role, permission.id)}
                                    disabled={role === 'admin'}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                      <span className="text-sm font-medium truncate">
                                        {permission.name.split('.')[1] || permission.name}
                                      </span>
                                      {hasChange && (
                                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                                          alterado
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  {isChecked ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                                  )}
                                </label>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-1">
                                  <p className="font-medium">{permission.name}</p>
                                  {permission.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {permission.description}
                                    </p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>

              {role === 'admin' && (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  <span>Administradores têm acesso total ao sistema. As permissões não podem ser alteradas.</span>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

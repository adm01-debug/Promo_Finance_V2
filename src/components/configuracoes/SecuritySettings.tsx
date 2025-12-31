import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Shield, 
  ShieldCheck,
  Globe,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { z } from 'zod';

const ipSchema = z.string().regex(
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/\d{1,2})?$/,
  'IP inválido. Use formato: 192.168.1.1 ou 192.168.1.0/24'
);

interface AllowedIP {
  id: string;
  user_id: string | null;
  ip_address: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
}

interface LoginAttempt {
  id: string;
  user_email: string;
  ip_address: string | null;
  success: boolean;
  blocked_reason: string | null;
  created_at: string;
}

interface SecuritySettingsData {
  id: string;
  require_2fa: boolean;
  restrict_by_ip: boolean;
  allowed_global_ips: string[];
}

export function SecuritySettings() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [addIpDialogOpen, setAddIpDialogOpen] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [newIpDesc, setNewIpDesc] = useState('');
  const [ipError, setIpError] = useState('');

  // Buscar configurações de segurança
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['security-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_settings')
        .select('*')
        .single();

      if (error) throw error;
      return data as SecuritySettingsData;
    }
  });

  // Buscar IPs permitidos
  const { data: allowedIps = [], isLoading: loadingIps } = useQuery({
    queryKey: ['allowed-ips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('allowed_ips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AllowedIP[];
    },
    enabled: isAdmin
  });

  // Buscar tentativas de login
  const { data: loginAttempts = [] } = useQuery({
    queryKey: ['login-attempts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as LoginAttempt[];
    },
    enabled: isAdmin
  });

  // Atualizar configurações
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<SecuritySettingsData>) => {
      const { error } = await supabase
        .from('security_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', settings?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Configurações atualizadas');
      queryClient.invalidateQueries({ queryKey: ['security-settings'] });
    },
    onError: () => {
      toast.error('Erro ao atualizar configurações');
    }
  });

  // Adicionar IP
  const addIpMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('allowed_ips')
        .insert({
          ip_address: newIp,
          descricao: newIpDesc || null,
          created_by: user?.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('IP adicionado');
      queryClient.invalidateQueries({ queryKey: ['allowed-ips'] });
      setAddIpDialogOpen(false);
      setNewIp('');
      setNewIpDesc('');
    },
    onError: () => {
      toast.error('Erro ao adicionar IP');
    }
  });

  // Remover IP
  const deleteIpMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('allowed_ips')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('IP removido');
      queryClient.invalidateQueries({ queryKey: ['allowed-ips'] });
    }
  });

  const handleAddIp = () => {
    try {
      ipSchema.parse(newIp);
      setIpError('');
      addIpMutation.mutate();
    } catch (e) {
      if (e instanceof z.ZodError) {
        setIpError(e.errors[0].message);
      }
    }
  };

  if (loadingSettings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configurações de Segurança
          </CardTitle>
          <CardDescription>
            Configure autenticação de dois fatores e restrições de IP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <Label>Exigir 2FA para todos os usuários</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Todos os usuários precisarão configurar autenticação de dois fatores
              </p>
            </div>
            <Switch
              checked={settings?.require_2fa ?? false}
              onCheckedChange={(checked) => updateSettingsMutation.mutate({ require_2fa: checked })}
              disabled={!isAdmin || updateSettingsMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <Label>Restringir acesso por IP</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Apenas IPs autorizados poderão acessar o sistema
              </p>
            </div>
            <Switch
              checked={settings?.restrict_by_ip ?? false}
              onCheckedChange={(checked) => updateSettingsMutation.mutate({ restrict_by_ip: checked })}
              disabled={!isAdmin || updateSettingsMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de IPs Permitidos */}
      {isAdmin && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                IPs Permitidos
              </CardTitle>
              <CardDescription>
                Lista de endereços IP autorizados a acessar o sistema
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setAddIpDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar IP
            </Button>
          </CardHeader>
          <CardContent>
            {loadingIps ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : allowedIps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum IP configurado</p>
                <p className="text-sm">Adicione IPs para restringir o acesso</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allowedIps.map((ip) => (
                  <div
                    key={ip.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <div>
                      <p className="font-mono font-medium">{ip.ip_address}</p>
                      {ip.descricao && (
                        <p className="text-sm text-muted-foreground">{ip.descricao}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={ip.ativo ? 'default' : 'secondary'}>
                        {ip.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteIpMutation.mutate(ip.id)}
                        disabled={deleteIpMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Histórico de Tentativas de Login */}
      {isAdmin && loginAttempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tentativas de Login Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {loginAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {attempt.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{attempt.user_email}</p>
                      <p className="text-xs text-muted-foreground">
                        IP: {attempt.ip_address || 'Desconhecido'}
                      </p>
                      {attempt.blocked_reason && (
                        <p className="text-xs text-destructive">{attempt.blocked_reason}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(attempt.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog Adicionar IP */}
      <Dialog open={addIpDialogOpen} onOpenChange={setAddIpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar IP Permitido
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ip-address">Endereço IP</Label>
              <Input
                id="ip-address"
                placeholder="192.168.1.1 ou 192.168.1.0/24"
                value={newIp}
                onChange={(e) => {
                  setNewIp(e.target.value);
                  setIpError('');
                }}
              />
              {ipError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {ipError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ip-desc">Descrição (opcional)</Label>
              <Input
                id="ip-desc"
                placeholder="Ex: Escritório principal"
                value={newIpDesc}
                onChange={(e) => setNewIpDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddIpDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddIp} disabled={addIpMutation.isPending || !newIp}>
              {addIpMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

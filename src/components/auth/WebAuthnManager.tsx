import { useState, useEffect } from 'react';
import { Fingerprint, Plus, Trash2, Loader2, Smartphone, Monitor, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatters';

interface WebAuthnCredential {
  id: string;
  credential_id: string;
  device_name: string;
  created_at: string;
}

export function WebAuthnManager() {
  const { user } = useAuth();
  const { registerCredential, isLoading: webAuthnLoading } = useWebAuthn();
  const [credentials, setCredentials] = useState<WebAuthnCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadCredentials();
  }, [user]);

  const loadCredentials = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('webauthn_credentials')
        .select('id, credential_id, device_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCredentials(data || []);
    } catch {
      // Table may not exist yet
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!deviceName.trim()) {
      toast.error('Informe um nome para o dispositivo');
      return;
    }
    setRegistering(true);
    try {
      await registerCredential(deviceName);
      toast.success(`Passkey "${deviceName}" registrada com sucesso!`);
      setRegisterOpen(false);
      setDeviceName('');
      loadCredentials();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar passkey');
    } finally {
      setRegistering(false);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('webauthn_credentials')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success(`Passkey "${name}" removida`);
      loadCredentials();
    } catch {
      toast.error('Erro ao remover passkey');
    }
  };

  const getDeviceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('phone') || lower.includes('celular') || lower.includes('mobile')) return Smartphone;
    if (lower.includes('pc') || lower.includes('desktop') || lower.includes('notebook')) return Monitor;
    return Fingerprint;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Passkeys / WebAuthn</CardTitle>
              <CardDescription>Gerencie dispositivos biométricos para login sem senha</CardDescription>
            </div>
          </div>
          <Button size="sm" onClick={() => setRegisterOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Adicionar Dispositivo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : credentials.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>Nenhuma passkey registrada.</p>
            <p className="text-sm">Adicione um dispositivo para login biométrico.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {credentials.map(cred => {
              const DeviceIcon = getDeviceIcon(cred.device_name);
              return (
                <div key={cred.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <DeviceIcon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{cred.device_name}</p>
                      <p className="text-xs text-muted-foreground">Registrado em {formatDate(cred.created_at)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(cred.id, cred.device_name)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" />
              Registrar Nova Passkey
            </DialogTitle>
            <DialogDescription>Dê um nome para identificar este dispositivo</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Ex: iPhone 15, Notebook Dell, Touch ID"
              value={deviceName}
              onChange={e => setDeviceName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRegisterOpen(false)}>Cancelar</Button>
              <Button onClick={handleRegister} disabled={registering || !deviceName.trim()} className="gap-2">
                {registering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
                Registrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

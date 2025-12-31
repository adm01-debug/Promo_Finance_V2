import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Trash2, 
  Shield, 
  ShieldOff,
  Chrome,
  Globe
} from 'lucide-react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface Device {
  id: string;
  device_fingerprint: string;
  browser: string | null;
  os: string | null;
  device_type: string | null;
  first_seen_at: string;
  last_seen_at: string;
  is_trusted: boolean | null;
}

export function KnownDevicesPanel() {
  const { user } = useAuth();
  const { getKnownDevices, removeDevice, trustDevice } = useDeviceDetection();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDevices();
    }
  }, [user]);

  const loadDevices = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getKnownDevices(user.id);
    setDevices(data);
    setLoading(false);
  };

  const handleRemove = async (deviceId: string) => {
    const success = await removeDevice(deviceId);
    if (success) {
      setDevices(devices.filter(d => d.id !== deviceId));
    }
  };

  const handleTrust = async (deviceId: string, trusted: boolean) => {
    const success = await trustDevice(deviceId, trusted);
    if (success) {
      setDevices(devices.map(d => 
        d.id === deviceId ? { ...d, is_trusted: trusted } : d
      ));
    }
  };

  const getDeviceIcon = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-5 w-5" />;
      case 'tablet': return <Tablet className="h-5 w-5" />;
      default: return <Monitor className="h-5 w-5" />;
    }
  };

  const getBrowserIcon = (browser: string | null) => {
    if (browser?.toLowerCase().includes('chrome')) {
      return <Chrome className="h-4 w-4" />;
    }
    return <Globe className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dispositivos Conhecidos</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Dispositivos Conhecidos
        </CardTitle>
        <CardDescription>
          Gerencie os dispositivos que acessaram sua conta ({devices.length} dispositivos)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhum dispositivo registrado ainda
          </p>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div 
                key={device.id} 
                className="flex items-center justify-between p-4 border rounded-lg bg-card"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-muted">
                    {getDeviceIcon(device.device_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {device.browser || 'Navegador desconhecido'} - {device.os || 'SO desconhecido'}
                      </span>
                      {device.is_trusted && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Confiável
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span>Primeiro acesso: {format(new Date(device.first_seen_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      <span className="mx-2">•</span>
                      <span>Último acesso: {format(new Date(device.last_seen_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleTrust(device.id, !device.is_trusted)}
                    title={device.is_trusted ? 'Remover confiança' : 'Marcar como confiável'}
                  >
                    {device.is_trusted ? (
                      <ShieldOff className="h-4 w-4" />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(device.id)}
                    className="text-destructive hover:text-destructive"
                    title="Remover dispositivo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

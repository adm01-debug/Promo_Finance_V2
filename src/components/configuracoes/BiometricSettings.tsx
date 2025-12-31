import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { useAuth } from '@/hooks/useAuth';
import { 
  Fingerprint, 
  Plus, 
  Trash2, 
  Smartphone, 
  Laptop,
  Loader2,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function BiometricSettings() {
  const { user } = useAuth();
  const {
    isSupported,
    isLoading,
    registeredCredentials,
    isPlatformAuthenticatorAvailable,
    registerCredential,
    removeCredential,
    fetchCredentials,
  } = useWebAuthn();

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const checkAvailability = async () => {
      const available = await isPlatformAuthenticatorAvailable();
      setBiometricAvailable(available);
    };
    
    checkAvailability();
    fetchCredentials();
  }, [isPlatformAuthenticatorAvailable, fetchCredentials]);

  const handleRegister = async () => {
    setIsRegistering(true);
    await registerCredential();
    setIsRegistering(false);
  };

  const handleRemove = async (credentialId: string) => {
    await removeCredential(credentialId);
  };

  const getDeviceIcon = (deviceName: string) => {
    if (deviceName.includes('iPhone') || deviceName.includes('Android')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Laptop className="h-4 w-4" />;
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Autenticação Biométrica
          </CardTitle>
          <CardDescription>
            WebAuthn não é suportado neste navegador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Seu navegador não suporta autenticação biométrica (WebAuthn). 
              Tente usar Chrome, Firefox, Safari ou Edge em suas versões mais recentes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!biometricAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Autenticação Biométrica
          </CardTitle>
          <CardDescription>
            Configure Face ID, Touch ID ou Windows Hello
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Autenticação biométrica não está disponível neste dispositivo. 
              Verifique se você tem Face ID, Touch ID ou Windows Hello configurado.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Autenticação Biométrica
        </CardTitle>
        <CardDescription>
          Gerencie seus dispositivos com Face ID, Touch ID ou Windows Hello
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium">
              {registeredCredentials.length > 0 
                ? `${registeredCredentials.length} dispositivo(s) registrado(s)`
                : 'Nenhum dispositivo registrado'
              }
            </span>
          </div>
          <Button 
            size="sm" 
            onClick={handleRegister}
            disabled={isRegistering || isLoading}
          >
            {isRegistering ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Adicionar
          </Button>
        </div>

        {/* Registered Credentials */}
        {registeredCredentials.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Dispositivos Registrados</h4>
            {registeredCredentials.map((credential) => (
              <div 
                key={credential.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getDeviceIcon(credential.device_name)}
                  <div>
                    <p className="text-sm font-medium">{credential.device_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Registrado em {format(new Date(credential.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Ativo
                  </Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover dispositivo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Você não poderá mais usar a biometria deste dispositivo para fazer login.
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleRemove(credential.credential_id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>• Clique em "Adicionar" para registrar a biometria deste dispositivo</p>
          <p>• Você precisará usar Face ID, Touch ID ou Windows Hello para confirmar</p>
          <p>• Após registrado, poderá fazer login usando apenas biometria</p>
        </div>
      </CardContent>
    </Card>
  );
}

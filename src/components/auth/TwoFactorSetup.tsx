import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ShieldCheck, 
  Smartphone, 
  Copy, 
  CheckCircle2,
  Loader2,
  QrCode
} from 'lucide-react';

interface TwoFactorSetupProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function TwoFactorSetup({ onComplete, onSkip }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'intro' | 'qr' | 'verify'>('intro');
  const [isLoading, setIsLoading] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');

  const handleEnroll = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (error) throw error;

      if (data) {
        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setStep('qr');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao configurar 2FA';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!factorId || verifyCode.length !== 6) {
      toast.error('Digite o código de 6 dígitos');
      return;
    }

    setIsLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode
      });

      if (verifyError) throw verifyError;

      toast.success('2FA configurado com sucesso!');
      onComplete?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Código inválido';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      toast.success('Código copiado!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Autenticação de Dois Fatores</CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'intro' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <Smartphone className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Como funciona?</p>
                  <p className="text-muted-foreground">
                    Use um aplicativo como Google Authenticator ou Authy para gerar códigos de verificação temporários.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {onSkip && (
                  <Button variant="outline" onClick={onSkip} className="flex-1">
                    Pular
                  </Button>
                )}
                <Button onClick={handleEnroll} disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Configurar 2FA
                </Button>
              </div>
            </div>
          )}

          {step === 'qr' && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Escaneie o QR Code com seu aplicativo autenticador
                </p>
                {qrCode && (
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />
                  </div>
                )}
              </div>

              {secret && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Ou digite manualmente:
                  </Label>
                  <div className="flex gap-2">
                    <Input value={secret} readOnly className="font-mono text-xs" />
                    <Button size="icon" variant="outline" onClick={copySecret}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <Button onClick={() => setStep('verify')} className="w-full">
                Próximo
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <div className="text-center">
                <QrCode className="h-12 w-12 mx-auto text-primary mb-2" />
                <p className="text-sm text-muted-foreground">
                  Digite o código de 6 dígitos do seu aplicativo
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verify-code">Código de Verificação</Label>
                <Input
                  id="verify-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('qr')} className="flex-1">
                  Voltar
                </Button>
                <Button 
                  onClick={handleVerify} 
                  disabled={isLoading || verifyCode.length !== 6}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Verificar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

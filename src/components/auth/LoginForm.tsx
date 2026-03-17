import { useState, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  LogIn, 
  Mail, 
  Lock, 
  Loader2,
  AlertTriangle,
  Fingerprint,
  Eye,
  EyeOff
} from 'lucide-react';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  errors: { email?: string; password?: string };
  isLoading: boolean;
  accountLocked: boolean;
  lockoutMessage: string;
  ipBlocked: boolean;
  geoBlocked: boolean;
  userIp: string | null;
  userCountry: string | null;
  biometricAvailable: boolean;
  webAuthnLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBiometricLogin: () => void;
  onForgotPassword: () => void;
}

export const LoginForm = forwardRef<HTMLDivElement, LoginFormProps>(function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  errors,
  isLoading,
  accountLocked,
  lockoutMessage,
  ipBlocked,
  geoBlocked,
  userIp,
  userCountry,
  biometricAvailable,
  webAuthnLoading,
  onSubmit,
  onBiometricLogin,
  onForgotPassword,
}, ref) {
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result?.error) {
        toast.error('Erro ao entrar com Google: ' + (result.error as Error).message);
      }
    } catch (err) {
      toast.error('Erro ao conectar com Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div ref={ref}>
      {accountLocked && (
        <Alert variant="error" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{lockoutMessage}</AlertDescription>
        </Alert>
      )}
      
      {ipBlocked && (
        <Alert variant="error" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Seu IP ({userIp}) não está autorizado para acessar o sistema.
            Entre em contato com o administrador para liberar o acesso.
          </AlertDescription>
        </Alert>
      )}
      
      {geoBlocked && (
        <Alert variant="error" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Acesso não permitido do seu país ({userCountry}).
            Entre em contato com o administrador para solicitar liberação.
          </AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="login-email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive"
            >
              {errors.email}
            </motion.p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive"
            >
              {errors.password}
            </motion.p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full gap-2" 
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          Entrar
        </Button>

        {/* Google Sign In */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          size="lg"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Entrar com Google
        </Button>

        {biometricAvailable && (

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={onBiometricLogin}
              disabled={webAuthnLoading || !email}
            >
              {webAuthnLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Fingerprint className="h-4 w-4" />
              )}
              Entrar com Biometria
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Face ID, Touch ID ou Windows Hello
            </p>
          </>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            Esqueci minha senha
          </button>
        </div>
      </form>
    </div>
  );
});

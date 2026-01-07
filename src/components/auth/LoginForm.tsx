import { useState } from 'react';
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

export function LoginForm({
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
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      {accountLocked && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{lockoutMessage}</AlertDescription>
        </Alert>
      )}
      
      {ipBlocked && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Seu IP ({userIp}) não está autorizado para acessar o sistema.
            Entre em contato com o administrador para liberar o acesso.
          </AlertDescription>
        </Alert>
      )}
      
      {geoBlocked && (
        <Alert variant="destructive" className="mb-4">
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

        {biometricAvailable && (
          <>
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
    </>
  );
}

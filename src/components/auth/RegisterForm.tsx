import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  UserPlus, 
  Mail, 
  Lock, 
  User,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';

interface RegisterFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  fullName: string;
  setFullName: (name: string) => void;
  errors: { email?: string; password?: string; fullName?: string };
  isLoading: boolean;
  onPasswordStrengthChange: (isStrong: boolean, isLeaked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function RegisterForm({
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  errors,
  isLoading,
  onSubmit,
  onPasswordStrengthChange,
}: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="register-name">Nome Completo</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="register-name"
            type="text"
            placeholder="Seu nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="pl-10"
            autoComplete="name"
          />
        </div>
        {errors.fullName && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive"
          >
            {errors.fullName}
          </motion.p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="register-email"
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
        <Label htmlFor="register-password">Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="register-password"
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10"
            autoComplete="new-password"
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
        <PasswordStrengthIndicator 
          password={password}
          onStrengthChange={onPasswordStrengthChange}
        />
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
          <UserPlus className="h-4 w-4" />
        )}
        Criar Conta
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Ao criar uma conta, você concorda com nossos{' '}
        <button type="button" className="text-primary hover:underline">
          Termos de Uso
        </button>{' '}
        e{' '}
        <button type="button" className="text-primary hover:underline">
          Política de Privacidade
        </button>
      </p>
    </form>
  );
}

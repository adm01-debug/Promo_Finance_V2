import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/forms/checkbox';
import { Alert } from '@/components/ui/alert';
import { useForm } from '@/hooks/useForm';
import { validateEmail, validateRequired } from '@/lib/validation';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const { values, errors, handleChange, handleBlur, handleSubmit, touched } = useForm({
    initialValues: {
      email: localStorage.getItem('rememberedEmail') || '',
      password: '',
    },
    validate: {
      email: (value: unknown) => {
        if (!value) return 'Email é obrigatório';
        if (!validateEmail(value as string)) return 'Email inválido';
        return undefined;
      },
      password: (value: unknown) => {
        if (!value) return 'Senha é obrigatória';
        if ((value as string).length < 6) return 'Senha deve ter no mínimo 6 caracteres';
        return undefined;
      },
    },
    onSubmit: async (formValues) => {
      setError(null);
      try {
        await signIn(formValues.email as string, formValues.password as string);
        
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formValues.email as string);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        navigate(from, { replace: true });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Credenciais inválidas. Verifique seu email e senha.';
        setError(message);
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/10">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Entrar no Finance Hub
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Ou{' '}
            <Link to="/auth/register" className="font-medium text-primary hover:text-primary/80">
              criar uma nova conta
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={values.email as string}
                  onChange={(e) => handleChange('email' as keyof typeof values, e.target.value as (typeof values)[keyof typeof values])}
                  onBlur={() => handleBlur('email' as keyof typeof values)}
                  className="pl-10"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={values.password as string}
                  onChange={(e) => handleChange('password' as keyof typeof values, e.target.value as (typeof values)[keyof typeof values])}
                  onBlur={() => handleBlur('password' as keyof typeof values)}
                  className="pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                label="Lembrar de mim"
              />
            </div>

            <div className="text-sm">
              <Link
                to="/auth/forgot-password"
                className="font-medium text-primary hover:text-primary/80"
              >
                Esqueceu a senha?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500">
                Finance Hub v2.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

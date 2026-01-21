import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/forms/input';
import { Alert } from '@/components/ui/alert';
import { useForm } from '@/hooks/useForm';
import { validateEmail } from '@/lib/validation';
import { UserPlus, Mail, Lock, User, Building, Eye, EyeOff, Check } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { values, errors, handleChange, handleBlur, handleSubmit, touched } = useForm({
    initialValues: {
      nome: '',
      empresa: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      nome: (value) => {
        if (!value) return 'Nome é obrigatório';
        if (value.length < 3) return 'Nome deve ter no mínimo 3 caracteres';
        return undefined;
      },
      email: (value) => {
        if (!value) return 'Email é obrigatório';
        if (!validateEmail(value)) return 'Email inválido';
        return undefined;
      },
      password: (value) => {
        if (!value) return 'Senha é obrigatória';
        if (value.length < 8) return 'Senha deve ter no mínimo 8 caracteres';
        if (!/[A-Z]/.test(value)) return 'Senha deve conter letra maiúscula';
        if (!/[a-z]/.test(value)) return 'Senha deve conter letra minúscula';
        if (!/[0-9]/.test(value)) return 'Senha deve conter número';
        return undefined;
      },
      confirmPassword: (value, allValues) => {
        if (!value) return 'Confirme sua senha';
        if (value !== allValues.password) return 'Senhas não conferem';
        return undefined;
      },
    },
    onSubmit: async (formValues) => {
      setError(null);
      try {
        await signUp(formValues.email, formValues.password, formValues.nome, formValues.empresa);
        setSuccess(true);
      } catch (err: any) {
        setError(err.message || 'Erro ao criar conta. Tente novamente.');
      }
    },
  });

  const passwordStrength = {
    hasLength: values.password.length >= 8,
    hasUpper: /[A-Z]/.test(values.password),
    hasLower: /[a-z]/.test(values.password),
    hasNumber: /[0-9]/.test(values.password),
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Conta criada com sucesso!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Enviamos um email de confirmação para <strong>{values.email}</strong>.
            Por favor, verifique sua caixa de entrada.
          </p>
          <Button onClick={() => navigate('/auth/login')}>
            Ir para Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/10">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Criar nova conta
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Ou{' '}
            <Link to="/auth/login" className="font-medium text-primary hover:text-primary/80">
              entrar em uma conta existente
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <Alert variant="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome completo
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="nome"
                  name="nome"
                  type="text"
                  autoComplete="name"
                  value={values.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  onBlur={() => handleBlur('nome')}
                  className="pl-10"
                  placeholder="Seu nome"
                  error={touched.nome && errors.nome ? errors.nome : undefined}
                />
              </div>
            </div>

            <div>
              <label htmlFor="empresa" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Empresa <span className="text-gray-400">(opcional)</span>
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="empresa"
                  name="empresa"
                  type="text"
                  autoComplete="organization"
                  value={values.empresa}
                  onChange={(e) => handleChange('empresa', e.target.value)}
                  className="pl-10"
                  placeholder="Nome da empresa"
                />
              </div>
            </div>

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
                  value={values.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className="pl-10"
                  placeholder="seu@email.com"
                  error={touched.email && errors.email ? errors.email : undefined}
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
                  autoComplete="new-password"
                  value={values.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className="pl-10 pr-10"
                  placeholder="••••••••"
                  error={touched.password && errors.password ? errors.password : undefined}
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
              
              {values.password && (
                <div className="mt-2 space-y-1 text-xs">
                  <div className={`flex items-center gap-1 ${passwordStrength.hasLength ? 'text-green-600' : 'text-gray-400'}`}>
                    <Check className="h-3 w-3" /> Mínimo 8 caracteres
                  </div>
                  <div className={`flex items-center gap-1 ${passwordStrength.hasUpper ? 'text-green-600' : 'text-gray-400'}`}>
                    <Check className="h-3 w-3" /> Letra maiúscula
                  </div>
                  <div className={`flex items-center gap-1 ${passwordStrength.hasLower ? 'text-green-600' : 'text-gray-400'}`}>
                    <Check className="h-3 w-3" /> Letra minúscula
                  </div>
                  <div className={`flex items-center gap-1 ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                    <Check className="h-3 w-3" /> Número
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirmar senha
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={values.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  className="pl-10"
                  placeholder="••••••••"
                  error={touched.confirmPassword && errors.confirmPassword ? errors.confirmPassword : undefined}
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Criando conta...' : 'Criar conta'}
          </Button>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Ao criar uma conta, você concorda com nossos{' '}
            <Link to="/terms" className="text-primary hover:underline">
              Termos de Serviço
            </Link>{' '}
            e{' '}
            <Link to="/privacy" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;

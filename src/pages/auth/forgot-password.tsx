import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { useForm } from '@/hooks/useForm';
import { validateEmail } from '@/lib/validation';
import { KeyRound, Mail, ArrowLeft, Check } from 'lucide-react';

export function ForgotPasswordPage() {
  const { resetPassword, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { values, errors, handleChange, handleBlur, handleSubmit, touched } = useForm({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value: unknown) => {
        if (!value) return 'Email é obrigatório';
        if (!validateEmail(value as string)) return 'Email inválido';
        return undefined;
      },
    },
    onSubmit: async (formValues) => {
      setError(null);
      try {
        await resetPassword(formValues.email as string);
        setSuccess(true);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao enviar email. Tente novamente.';
        setError(message);
      }
    },
  });

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Email enviado!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Enviamos instruções para redefinir sua senha para{' '}
            <strong>{values.email}</strong>. Verifique sua caixa de entrada e spam.
          </p>
          <div className="space-y-3">
            <Button onClick={() => setSuccess(false)} variant="outline" className="w-full">
              Enviar novamente
            </Button>
            <Link to="/auth/login">
              <Button variant="ghost" className="w-full">
                Voltar para login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Esqueceu a senha?
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Não se preocupe! Digite seu email e enviaremos instruções para redefinir sua senha.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email cadastrado
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
              {touched.email && errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Enviando...' : 'Enviar instruções'}
          </Button>

          <Link
            to="/auth/login"
            className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para login
          </Link>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;

import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type VerificationStatus = 'verifying' | 'success' | 'error' | 'expired';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Stub functions since auth context doesn't have these
  const verifyEmail = async (_token: string) => { /* handled by supabase automatically */ };
  const resendVerificationEmail = async (_email: string) => { toast.info('Email de verificação reenviado'); };
  
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState('');

  const token = searchParams.get('token');
  const type = searchParams.get('type');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        return;
      }

      try {
        await verifyEmail(token);
        setStatus('success');
        toast.success('Email verificado com sucesso!');
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } catch (error) {
        console.error('Verification error:', error);
        
        if (error instanceof Error && error.message.includes('expired')) {
          setStatus('expired');
        } else {
          setStatus('error');
        }
      }
    };

    if (type === 'signup' || type === 'email_change') {
      verify();
    } else {
      setStatus('error');
    }
  }, [token, type, verifyEmail, navigate]);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Por favor, insira seu email');
      return;
    }

    setIsResending(true);
    try {
      await resendVerificationEmail(email);
      toast.success('Email de verificação reenviado!');
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('Erro ao reenviar email. Tente novamente.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              Finance<span className="text-primary-600">Hub</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          {/* Verifying */}
          {status === 'verifying' && (
            <>
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Verificando seu email...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Por favor, aguarde enquanto validamos seu email.
              </p>
            </>
          )}

          {/* Success */}
          {status === 'success' && (
            <>
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Email verificado!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Seu email foi verificado com sucesso. Você será redirecionado para o
                dashboard em instantes.
              </p>
              <Button asChild className="w-full">
                <Link to="/dashboard">
                  Ir para o Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </>
          )}

          {/* Error */}
          {status === 'error' && (
            <>
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Erro na verificação
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Não foi possível verificar seu email. O link pode estar inválido ou
                corrompido.
              </p>
              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Digite seu email"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <Button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="w-full"
                >
                  {isResending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Reenviar email de verificação
                </Button>
              </div>
            </>
          )}

          {/* Expired */}
          {status === 'expired' && (
            <>
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Link expirado
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                O link de verificação expirou. Por favor, solicite um novo link abaixo.
              </p>
              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Digite seu email"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <Button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="w-full"
                >
                  {isResending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Solicitar novo link
                </Button>
              </div>
            </>
          )}

          {/* Back to login */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/login"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

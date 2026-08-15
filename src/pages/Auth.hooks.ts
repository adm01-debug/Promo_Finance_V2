// Estado, efeitos e handlers da página Auth — extraídos para zerar max-lines.
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { useAuthValidation } from '@/hooks/useAuthValidation';
import { readSloFailure, type SloFailureSnapshot } from '@/lib/sso-slo-state';

// Validation schemas
const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .regex(/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/~`]/, 'Senha deve conter caractere especial');

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

export { emailSchema, passwordSchema, containerVariants };

export function useAuthPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('email') ?? '';
  });
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [accountLocked, setAccountLocked] = useState(false);
  const [lockoutMessage, setLockoutMessage] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ isStrong: false, isLeaked: false });
  const [sloFailure, setSloFailureState] = useState<SloFailureSnapshot | null>(() => readSloFailure());

  const { checkDevice } = useDeviceDetection();
  const { isSupported: webAuthnSupported, isLoading: webAuthnLoading, authenticate, isPlatformAuthenticatorAvailable } = useWebAuthn();
  const {
    geoData,
    ipBlocked,
    geoBlocked,
    validateIp,
    validateGeo,
    checkBlockedIp,
    logLoginAttempt,
    resetBlocks
  } = useAuthValidation();

  // Toast único quando o usuário chega aqui após SSO Single Logout (?slo=ok)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('slo') !== 'ok') return;
    if (sessionStorage.getItem('sso-slo-done-shown') === '1') return;
    sessionStorage.setItem('sso-slo-done-shown', '1');
    toast.success('Sessão encerrada com segurança', { id: 'sso-slo-done' });
    const t = setTimeout(() => sessionStorage.removeItem('sso-slo-done-shown'), 5000);
    return () => clearTimeout(t);
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Feedback de Single Logout SSO / erros SSO via querystring
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('slo') === 'ok') {
      toast.success('Você saiu de todas as sessões corporativas');
      params.delete('slo');
      const qs = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
    } else if (params.get('slo') === 'fail') {
      // Banner é renderizado abaixo via state; apenas higieniza a URL.
      params.delete('slo');
      const qs = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
      // Recarrega snapshot caso tenha sido escrito após o mount inicial.
      setSloFailureState(readSloFailure());
    } else if (params.get('sso_error')) {
      toast.error('Falha no login SSO', { description: params.get('sso_error') ?? undefined });
      params.delete('sso_error');
      const qs = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
    }
  }, []);

  // Check biometric availability
  useEffect(() => {
    const checkBiometric = async () => {
      if (webAuthnSupported) {
        const available = await isPlatformAuthenticatorAvailable();
        setBiometricAvailable(available);
      }
    };
    checkBiometric();
  }, [webAuthnSupported, isPlatformAuthenticatorAvailable]);

  const validateForm = useCallback((isSignUp: boolean) => {
    const newErrors: typeof errors = {};

    try {
      emailSchema.parse(email);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        newErrors.email = error.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        newErrors.password = error.errors[0].message;
      }
    }

    if (isSignUp && !fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password, fullName]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm(false)) return;

    setIsLoading(true);
    resetBlocks();
    setAccountLocked(false);

    try {
      // Check account lockout
      const { data: lockoutData } = await supabase.rpc('get_lockout_details', { _email: email });

      if (lockoutData && lockoutData.length > 0 && lockoutData[0].is_locked) {
        const remainingMinutes = lockoutData[0].remaining_minutes;
        const lockoutCount = lockoutData[0].lockout_count;
        setAccountLocked(true);

        let timeMessage = '';
        if (remainingMinutes >= 60) {
          const hours = Math.floor(remainingMinutes / 60);
          const mins = remainingMinutes % 60;
          timeMessage = mins > 0 ? `${hours}h ${mins}min` : `${hours} hora(s)`;
        } else {
          timeMessage = `${remainingMinutes} minuto(s)`;
        }

        setLockoutMessage(
          `Sua conta foi bloqueada temporariamente (bloqueio #${lockoutCount}). ` +
          `Tente novamente em ${timeMessage}. `
        );
        await logLoginAttempt(email, false, 'Conta bloqueada');
        setIsLoading(false);
        return;
      }

      // Validate geo and IP
      const geoValidation = await validateGeo();
      if (!geoValidation.allowed) {
        await logLoginAttempt(email, false, geoValidation.reason);
        toast.error('Acesso bloqueado: País não autorizado');
        setIsLoading(false);
        return;
      }

      const ipValidation = await validateIp();
      if (!ipValidation.allowed) {
        await logLoginAttempt(email, false, ipValidation.reason);
        toast.error('Acesso bloqueado: IP não autorizado');
        setIsLoading(false);
        return;
      }

      const isBlocked = await checkBlockedIp();
      if (isBlocked) {
        await logLoginAttempt(email, false, 'IP bloqueado permanentemente');
        toast.error('Este IP está bloqueado. Contate o administrador.');
        setIsLoading(false);
        return;
      }

      // Sign in
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        await supabase.rpc('increment_failed_attempts', { _email: email });
        await logLoginAttempt(email, false, error.message);

        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Email não confirmado. Verifique sua caixa de entrada.');
        } else {
          toast.error(error.message);
        }
      } else {
        await supabase.rpc('reset_failed_attempts', { _email: email });
        await logLoginAttempt(email, true);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await checkDevice(user.id);
        }

        toast.success('Login realizado com sucesso!');
      }
    } catch {
      await logLoginAttempt(email, false, 'Erro desconhecido');
      toast.error('Erro ao realizar login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!email) {
      toast.error('Digite seu email primeiro');
      return;
    }

    try {
      emailSchema.parse(email);
    } catch {
      toast.error('Email inválido');
      return;
    }

    const result = await authenticate(email);

    if (result.success && result.userId) {
      toast.success('Autenticação biométrica bem-sucedida!');
      await logLoginAttempt(email, true);
      await checkDevice(result.userId);
      toast.info('Para completar o login biométrico, a integração com o backend é necessária.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm(true)) return;

    if (passwordStrength.isLeaked) {
      toast.error('Esta senha foi encontrada em vazamentos de dados. Escolha outra senha.');
      return;
    }

    if (!passwordStrength.isStrong) {
      toast.error('A senha não atende aos requisitos mínimos de segurança.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Conta criada com sucesso!');
      }
    } catch {
      toast.error('Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(email);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        setErrors({ email: error.errors[0].message });
        return;
      }
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('password_reset_requests')
        .insert({ user_email: email, status: 'pendente' });

      if (error) {
        toast.error('Erro ao solicitar reset de senha');
        logger.error('Erro ao solicitar reset de senha:', error);
      } else {
        setResetEmailSent(true);
        toast.success('Solicitação enviada! Aguarde a aprovação do gestor.');
      }
    } catch {
      toast.error('Erro ao solicitar reset de senha');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordStrengthChange = useCallback((isStrong: boolean, isLeaked: boolean) => {
    setPasswordStrength({ isStrong, isLeaked });
  }, []);

  return {
    email,
    setEmail,
    password,
    setPassword,
    fullName,
    setFullName,
    errors,
    isLoading,
    showForgotPassword,
    setShowForgotPassword,
    resetEmailSent,
    setResetEmailSent,
    accountLocked,
    lockoutMessage,
    biometricAvailable,
    sloFailure,
    setSloFailureState,
    ipBlocked,
    geoBlocked,
    geoData,
    webAuthnLoading,
    handleSignIn,
    handleBiometricLogin,
    handleSignUp,
    handleForgotPassword,
    handlePasswordStrengthChange,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LogIn, UserPlus, Shield } from 'lucide-react';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { useAuthValidation } from '@/hooks/useAuthValidation';
import { 
  AuthLeftPanel, 
  AuthMobileHeader, 
  AuthMobileBackground 
} from '@/components/auth/AuthBackground';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

// Validation schemas
const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .regex(/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/, 'Senha deve conter caractere especial');

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

export default function Auth() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [accountLocked, setAccountLocked] = useState(false);
  const [lockoutMessage, setLockoutMessage] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ isStrong: false, isLeaked: false });
  
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
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
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
      const { data: lockoutData } = await supabase
        .rpc('get_lockout_details', { _email: email });

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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      toast.error('Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors({ email: err.errors[0].message });
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
    } catch (error: unknown) {
      toast.error('Erro ao solicitar reset de senha');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordStrengthChange = useCallback((isStrong: boolean, isLeaked: boolean) => {
    setPasswordStrength({ isStrong, isLeaked });
  }, []);

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <ForgotPasswordForm
            email={email}
            setEmail={setEmail}
            errors={errors}
            isLoading={isLoading}
            resetEmailSent={resetEmailSent}
            onSubmit={handleForgotPassword}
            onBack={() => {
              setShowForgotPassword(false);
              setResetEmailSent(false);
            }}
          />
        </motion.div>
      </div>
    );
  }

  // Main Auth View
  return (
    <div className="min-h-screen relative overflow-hidden flex">
      <AuthLeftPanel />

      <div className="w-full lg:w-1/2 relative">
        <AuthMobileBackground />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 lg:p-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-md"
          >
            <AuthMobileHeader />

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-2 border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl shadow-black/5">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: 'spring' }}
                    >
                      <Shield className="h-5 w-5 text-primary" />
                    </motion.div>
                    Acesso ao Sistema
                  </CardTitle>
                  <CardDescription>
                    Entre com suas credenciais ou crie uma nova conta
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="login" className="gap-2">
                        <LogIn className="h-4 w-4" />
                        Entrar
                      </TabsTrigger>
                      <TabsTrigger value="register" className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Cadastrar
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                      <LoginForm
                        email={email}
                        setEmail={setEmail}
                        password={password}
                        setPassword={setPassword}
                        errors={errors}
                        isLoading={isLoading}
                        accountLocked={accountLocked}
                        lockoutMessage={lockoutMessage}
                        ipBlocked={ipBlocked}
                        geoBlocked={geoBlocked}
                        userIp={geoData.ip}
                        userCountry={geoData.country}
                        biometricAvailable={biometricAvailable}
                        webAuthnLoading={webAuthnLoading}
                        onSubmit={handleSignIn}
                        onBiometricLogin={handleBiometricLogin}
                        onForgotPassword={() => setShowForgotPassword(true)}
                      />
                    </TabsContent>

                    <TabsContent value="register">
                      <RegisterForm
                        email={email}
                        setEmail={setEmail}
                        password={password}
                        setPassword={setPassword}
                        fullName={fullName}
                        setFullName={setFullName}
                        errors={errors}
                        isLoading={isLoading}
                        onSubmit={handleSignUp}
                        onPasswordStrengthChange={handlePasswordStrengthChange}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

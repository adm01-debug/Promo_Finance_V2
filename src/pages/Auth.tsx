import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User,
  Loader2,
  Building2,
  Shield,
  AlertTriangle,
  Fingerprint,
  Scan
} from 'lucide-react';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { Separator } from '@/components/ui/separator';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'Senha deve ter no mínimo 6 caracteres');

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
  const [ipBlocked, setIpBlocked] = useState(false);
  const [userIp, setUserIp] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [geoBlocked, setGeoBlocked] = useState(false);
  const [accountLocked, setAccountLocked] = useState(false);
  const [lockoutMessage, setLockoutMessage] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const { checkDevice } = useDeviceDetection();
  const { isSupported: webAuthnSupported, isLoading: webAuthnLoading, authenticate, isPlatformAuthenticatorAvailable } = useWebAuthn();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();

    // Check biometric availability
    const checkBiometric = async () => {
      if (webAuthnSupported) {
        const available = await isPlatformAuthenticatorAvailable();
        setBiometricAvailable(available);
      }
    };
    checkBiometric();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, webAuthnSupported, isPlatformAuthenticatorAvailable]);

  const validateForm = (isSignUp: boolean) => {
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
  };

  // Fetch user IP and country on component mount
  useEffect(() => {
    const fetchIpAndGeo = async () => {
      try {
        // Use ip-api.com for IP and country detection
        const response = await fetch('http://ip-api.com/json/?fields=query,countryCode');
        const data = await response.json();
        setUserIp(data.query);
        setUserCountry(data.countryCode);
      } catch (error) {
        console.error('Erro ao obter IP/localização:', error);
        // Fallback to ipify for IP only
        try {
          const fallback = await fetch('https://api.ipify.org?format=json');
          const fallbackData = await fallback.json();
          setUserIp(fallbackData.ip);
        } catch (e) {
          console.error('Erro no fallback de IP:', e);
        }
      }
    };
    fetchIpAndGeo();
  }, []);

  // Validate IP against allowed list
  const validateIp = async (): Promise<{ allowed: boolean; reason?: string }> => {
    if (!userIp) {
      return { allowed: true }; // Allow if IP couldn't be fetched
    }

    try {
      // Check if IP restriction is enabled globally
      const { data: settings } = await supabase
        .from('security_settings')
        .select('restrict_by_ip, allowed_global_ips')
        .single();

      if (!settings?.restrict_by_ip) {
        return { allowed: true }; // IP restriction is disabled
      }

      // Check global allowed IPs
      const globalIps = settings.allowed_global_ips || [];
      if (globalIps.includes(userIp)) {
        return { allowed: true };
      }

      // Check if IP is in the allowed_ips table (for any user or globally)
      const { data: allowedIps } = await supabase
        .from('allowed_ips')
        .select('ip_address')
        .eq('ativo', true);

      const isAllowed = allowedIps?.some(ip => ip.ip_address === userIp);
      
      if (!isAllowed) {
        return { 
          allowed: false, 
          reason: `IP ${userIp} não autorizado para acesso` 
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Erro ao validar IP:', error);
      return { allowed: true }; // Allow on error to prevent lockout
    }
  };

  // Validate geographic location against whitelist
  const validateGeo = async (): Promise<{ allowed: boolean; reason?: string }> => {
    if (!userCountry) {
      return { allowed: true }; // Allow if country couldn't be detected
    }

    try {
      // Check if geo restriction is enabled
      const { data: settings } = await supabase
        .from('security_settings')
        .select('enable_geo_restriction')
        .limit(1)
        .maybeSingle();

      if (!settings?.enable_geo_restriction) {
        return { allowed: true }; // Geo restriction is disabled
      }

      // Check if country is in the whitelist
      const { data: allowedCountries } = await supabase
        .from('allowed_countries')
        .select('country_code')
        .eq('ativo', true);

      const isAllowed = allowedCountries?.some(c => c.country_code === userCountry);
      
      if (!isAllowed) {
        return { 
          allowed: false, 
          reason: `Acesso não permitido do país: ${userCountry}` 
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Erro ao validar localização:', error);
      return { allowed: true }; // Allow on error to prevent lockout
    }
  };

  // Log login attempt
  const logLoginAttempt = async (success: boolean, blockedReason?: string) => {
    try {
      await supabase.from('login_attempts').insert({
        user_email: email,
        ip_address: userIp,
        user_agent: navigator.userAgent,
        success,
        blocked_reason: blockedReason || null
      });
    } catch (error) {
      console.error('Erro ao registrar tentativa de login:', error);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(false)) return;

    setIsLoading(true);
    setIpBlocked(false);
    setAccountLocked(false);

    try {
      // Check account lockout first
      const { data: lockoutData } = await supabase
        .rpc('check_account_lockout', { _email: email });

      if (lockoutData === true) {
        setAccountLocked(true);
        setLockoutMessage('Sua conta foi bloqueada temporariamente devido a múltiplas tentativas falhas. Tente novamente em 30 minutos.');
        await logLoginAttempt(false, 'Conta bloqueada');
        setIsLoading(false);
        return;
      }

      // Validate geographic location before attempting login
      const geoValidation = await validateGeo();
      
      if (!geoValidation.allowed) {
        await logLoginAttempt(false, geoValidation.reason);
        setGeoBlocked(true);
        toast.error('Acesso bloqueado: País não autorizado');
        setIsLoading(false);
        return;
      }

      // Validate IP before attempting login
      const ipValidation = await validateIp();
      
      if (!ipValidation.allowed) {
        await logLoginAttempt(false, ipValidation.reason);
        setIpBlocked(true);
        toast.error('Acesso bloqueado: IP não autorizado');
        setIsLoading(false);
        return;
      }

      // Check if IP is in blocked_ips table
      const { data: blockedIp } = await supabase
        .from('blocked_ips')
        .select('id')
        .eq('ip_address', userIp)
        .is('unblocked_at', null)
        .maybeSingle();

      if (blockedIp) {
        await logLoginAttempt(false, 'IP bloqueado permanentemente');
        setIpBlocked(true);
        toast.error('Este IP está bloqueado. Contate o administrador.');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Increment failed attempts
        await supabase.rpc('increment_failed_attempts', { _email: email });
        await logLoginAttempt(false, error.message);
        
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Email não confirmado. Verifique sua caixa de entrada.');
        } else {
          toast.error(error.message);
        }
      } else {
        // Reset failed attempts on successful login
        await supabase.rpc('reset_failed_attempts', { _email: email });
        await logLoginAttempt(true);
        
        // Check for new device after successful login
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await checkDevice(user.id);
        }
        
        toast.success('Login realizado com sucesso!');
      }
    } catch (error) {
      await logLoginAttempt(false, 'Erro desconhecido');
      toast.error('Erro ao realizar login');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle biometric login
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
      // Sign in the user using a custom token or session
      // For WebAuthn, we need to create a session for the authenticated user
      // This typically requires a backend call to create a session
      toast.success('Autenticação biométrica bem-sucedida!');
      
      // Log the successful biometric login
      await supabase.from('login_attempts').insert({
        user_email: email,
        ip_address: userIp,
        user_agent: navigator.userAgent,
        success: true,
        blocked_reason: null
      });

      // Check device after biometric login
      await checkDevice(result.userId);
      
      // Navigate to home - the user will need to complete sign in
      // In a production app, you'd use a backend to create a session
      toast.info('Para completar o login biométrico, a integração com o backend é necessária.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(true)) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
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
    } catch (error) {
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
      // Criar solicitação de reset que precisa de aprovação do gestor
      const { error } = await supabase
        .from('password_reset_requests')
        .insert({
          user_email: email,
          status: 'pendente'
        });

      if (error) {
        toast.error('Erro ao solicitar reset de senha');
        console.error(error);
      } else {
        setResetEmailSent(true);
        toast.success('Solicitação enviada! Aguarde a aprovação do gestor.');
      }
    } catch (error) {
      toast.error('Erro ao solicitar reset de senha');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-2xl mb-4">
            <Building2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Promo Brindes</h1>
          <p className="text-muted-foreground mt-2">Sistema de Gestão Financeira</p>
        </div>

        <Card className="border-2">
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
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
                {accountLocked && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {lockoutMessage}
                    </AlertDescription>
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
                <form onSubmit={handleSignIn} className="space-y-4">
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
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="h-4 w-4" />
                    )}
                    Entrar
                  </Button>

                  {/* Biometric Login */}
                  {biometricAvailable && (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            ou
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={handleBiometricLogin}
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
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleSignUp} className="space-y-4">
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
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-sm text-red-500">{errors.fullName}</p>
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
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password}</p>
                    )}
                    <PasswordStrengthIndicator password={password} />
                  </div>

                  <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    Criar Conta
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    O primeiro usuário cadastrado receberá automaticamente o perfil de Administrador.
                  </p>
                </form>
              </TabsContent>
            </Tabs>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-background border rounded-lg p-6 w-full max-w-md"
                >
                  {resetEmailSent ? (
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center justify-center p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-lg font-semibold">Solicitação Enviada!</h3>
                      <p className="text-muted-foreground">
                        Sua solicitação foi enviada para aprovação. Você receberá um email quando o gestor aprovar.
                      </p>
                      <Button
                        onClick={() => {
                          setShowForgotPassword(false);
                          setResetEmailSent(false);
                          setEmail('');
                        }}
                        className="w-full"
                      >
                        Voltar ao Login
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold">Recuperar Senha</h3>
                        <p className="text-sm text-muted-foreground">
                          Digite seu email para receber as instruções de recuperação
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {errors.email && (
                          <p className="text-sm text-red-500">{errors.email}</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setErrors({});
                          }}
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1 gap-2" disabled={isLoading}>
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                          Enviar
                        </Button>
                      </div>
                    </form>
                  )}
                </motion.div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Sistema seguro com controle de acesso por perfis (RBAC)
        </p>
      </motion.div>
    </div>
  );
}

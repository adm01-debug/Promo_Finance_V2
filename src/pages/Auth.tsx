import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogIn, UserPlus, Shield } from 'lucide-react';
import { AuthMobileHeader } from '@/components/auth/AuthBackground';
import { AuroraBackground } from '@/components/effects/AuroraBackground';
import { BlurText } from '@/components/effects/BlurText';
import { LoginForm } from '@/components/auth/LoginForm';
import { AccountLockoutBanner } from '@/components/auth/AccountLockoutBanner';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { SloFailureBanner } from '@/components/auth/SloFailureBanner';
import { useAuthPage, containerVariants } from './Auth.hooks';

export default function Auth() {
  const {
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
  } = useAuthPage();

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
        {/* Fundo aurora Vela (Z3, CSS puro — mesmo efeito do login) */}
        <AuroraBackground className="-z-10" />
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
      {/* Fundo aurora Vela (Z3, CSS puro — port da maquete aprovada) */}
      <AuroraBackground className="-z-10" />

      <div className="hidden lg:flex w-1/2 items-center justify-center border-r border-white/10">
        <div className="max-w-md text-center space-y-4">
          <div className="h-16 w-16 bg-primary rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-primary/40">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
            Promo Finance
          </h2>
          <p className="text-white/70 text-lg font-medium leading-relaxed">
            Sua plataforma de inteligência financeira premium.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 relative">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm pointer-events-none" />

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
              <Card className="border border-border bg-card/95 backdrop-blur-md shadow-2xl shadow-foreground/10 rounded-2xl overflow-hidden">
                <CardHeader className="text-center p-8 pb-2">
                  <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                    <BlurText
                      text="Bem-vindo de volta"
                      animateBy="words"
                      delay={120}
                      stepDuration={0.4}
                      className="hero22-title-blur"
                    />
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-muted-foreground">
                    Acesse sua conta para continuar
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {sloFailure && (
                    <SloFailureBanner
                      failure={sloFailure}
                      onDismiss={() => setSloFailureState(null)}
                    />
                  )}
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList
                      className="grid w-full grid-cols-2 mb-8 bg-muted p-1 rounded-lg border border-border"
                      variant="bordered"
                    >
                      <TabsTrigger
                        value="login"
                        className="gap-2 rounded-md py-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                      >
                        <LogIn className="h-4 w-4" />
                        Acessar
                      </TabsTrigger>
                      <TabsTrigger
                        value="register"
                        className="gap-2 rounded-md py-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                      >
                        <UserPlus className="h-4 w-4" />
                        Criar Conta
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                      {accountLocked && (
                        <AccountLockoutBanner
                          locked={accountLocked}
                          remainingMinutes={parseInt(
                            lockoutMessage.match(/(\d+)\s*minuto/)?.[1] ?? '0'
                          )}
                        />
                      )}
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

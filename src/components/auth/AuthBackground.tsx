import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Building2, Shield, CheckCircle2 } from 'lucide-react';

export function AuthBackgroundOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 3, delay: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.3, y: 0 }}
        transition={{ duration: 2, delay: 1, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-primary/10 to-transparent rounded-full"
      />
    </div>
  );
}

export function AuthGridPattern() {
  return (
    <div 
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                         linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }}
    />
  );
}

export function AuthAnimatedLogo() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
      className="relative mb-8"
    >
      <motion.div
        animate={{ 
          boxShadow: [
            '0 0 20px hsl(var(--primary) / 0.3)',
            '0 0 40px hsl(var(--primary) / 0.5)',
            '0 0 20px hsl(var(--primary) / 0.3)',
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center"
      >
        <Building2 className="h-12 w-12 text-primary-foreground" />
      </motion.div>
      <motion.div
        animate={{ y: [-10, 10, -10], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-accent"
      />
      <motion.div
        animate={{ y: [10, -10, 10], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        className="absolute -bottom-2 -left-2 h-3 w-3 rounded-full bg-success"
      />
    </motion.div>
  );
}

export function AuthSocialProof() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium"
            >
              {String.fromCharCode(64 + i)}
            </motion.div>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          +500 empresas usando
        </span>
      </div>
      
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center gap-2"
        >
          <Shield className="h-4 w-4 text-success" />
          <span>SSL Seguro</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span>LGPD Compliant</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function AuthLeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5">
      <AuthBackgroundOrbs />
      <AuthGridPattern />
      
      <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-center">
        <AuthAnimatedLogo />
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-4xl font-display font-bold gradient-text mb-4"
        >
          Promo Finance
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-xl text-muted-foreground mb-8"
        >
          Sistema de Gestão Financeira
        </motion.p>

        <AuthSocialProof />
      </div>
    </div>
  );
}

export const AuthMobileHeader = forwardRef<HTMLDivElement>(function AuthMobileHeader(_, ref) {
  return (
    <motion.div 
      ref={ref}
      className="text-center mb-8 lg:hidden"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <motion.div 
        className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl mb-4 shadow-lg shadow-primary/10 backdrop-blur-sm border border-primary/10"
        whileHover={{ scale: 1.05, rotate: 5 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <Building2 className="h-10 w-10 text-primary" />
      </motion.div>
      <motion.h1 
        className="text-3xl font-bold gradient-text"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Promo Brindes
      </motion.h1>
      <motion.p 
        className="text-muted-foreground mt-2"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Sistema de Gestão Financeira
      </motion.p>
    </motion.div>
  );
});

export function AuthMobileBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 lg:hidden" />
      <div className="absolute inset-0 overflow-hidden lg:hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 1 }}
          className="absolute -top-20 -right-20 w-60 h-60 bg-primary/20 rounded-full blur-3xl"
        />
      </div>
    </>
  );
}

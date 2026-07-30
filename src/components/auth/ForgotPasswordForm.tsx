import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Mail, 
  Loader2,
  ArrowLeft,
  CheckCircle2,
  KeyRound
} from 'lucide-react';

interface ForgotPasswordFormProps {
  email: string;
  setEmail: (email: string) => void;
  errors: { email?: string };
  isLoading: boolean;
  resetEmailSent: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export function ForgotPasswordForm({
  email,
  setEmail,
  errors,
  isLoading,
  resetEmailSent,
  onSubmit,
  onBack,
}: ForgotPasswordFormProps) {
  if (resetEmailSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center"
        >
          <CheckCircle2 className="h-8 w-8 text-success" />
        </motion.div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Solicitação Enviada!</h3>
          <p className="text-muted-foreground text-sm">
            Sua solicitação de reset de senha foi enviada para aprovação.
            Você receberá um email assim que o gestor aprovar.
          </p>
        </div>
        
        <Button onClick={onBack} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Login
        </Button>
      </motion.div>
    );
  }

  return (
    <Card className="border-2 border-border/50 bg-card/80 backdrop-blur-xl">
      <CardHeader className="text-center pb-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <KeyRound className="h-6 w-6 text-primary" />
        </motion.div>
        <CardTitle>Recuperar Senha</CardTitle>
        <CardDescription>
          Digite seu email para solicitar a recuperação de senha
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="forgot-email"
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

          <Button 
            type="submit" 
            className="w-full gap-2" 
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Solicitar Recuperação
          </Button>

          <Button 
            type="button"
            variant="ghost" 
            className="w-full gap-2"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

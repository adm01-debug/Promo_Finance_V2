import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCcw, 
  ShieldCheck, 
  Database, 
  Zap,
  Lock
} from 'lucide-react';
import { useStartupDiagnostic, DiagnosticResult } from '@/hooks/useStartupDiagnostic';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

export const StartupDiagnostic: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { results, isComplete, hasError, retry } = useStartupDiagnostic();

  // If complete and no error, show the app
  if (isComplete && !hasError) {
    return <>{children}</>;
  }

  const successCount = results.filter(r => r.status === 'success').length;
  const progress = (successCount / results.length) * 100;

  const getIcon = (id: string, status: DiagnosticResult['status']) => {
    if (status === 'loading') return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    if (status === 'success') return <CheckCircle2 className="h-5 w-5 text-success" />;
    if (status === 'error') return <AlertCircle className="h-5 w-5 text-destructive" />;
    
    switch (id) {
      case 'connection': return <Database className="h-5 w-5 text-muted-foreground" />;
      case 'tables': return <Zap className="h-5 w-5 text-muted-foreground" />;
      case 'rpcs': return <ShieldCheck className="h-5 w-5 text-muted-foreground" />;
      case 'auth': return <Lock className="h-5 w-5 text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020202] flex flex-col items-center justify-center p-6">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-15%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            Verificação de Integridade
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Promo Finance</h1>
          <p className="text-white/40 text-sm">Validando infraestrutura neural e conectividade...</p>
        </div>

        <Card className="bg-card/5 border-white/10 backdrop-blur-xl overflow-hidden">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/40">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1.5 bg-card/10" />
            </div>

            <div className="space-y-4">
              {results.map((result) => (
                <motion.div 
                  key={result.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-card/[0.03] border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      result.status === 'success' ? 'bg-success/10' : 
                      result.status === 'error' ? 'bg-destructive/10' : 
                      'bg-card/5'
                    }`}>
                      {getIcon(result.id, result.status)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white/90">{result.name}</p>
                      {result.message && (
                        <p className={`text-[11px] ${result.status === 'error' ? 'text-destructive' : 'text-white/40'}`}>
                          {result.message}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {result.status === 'error' && (
                    <Badge variant="destructive" className="text-[10px] uppercase font-black">Falha</Badge>
                  )}
                  {result.status === 'success' && (
                    <Badge className="bg-success/20 text-success border-success/30 text-[10px] uppercase font-black">OK</Badge>
                  )}
                </motion.div>
              ))}
            </div>

            <AnimatePresence>
              {hasError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-4"
                >
                  <Button 
                    onClick={retry} 
                    className="w-full h-12 rounded-xl font-black uppercase tracking-widest group"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                    Tentar Novamente
                  </Button>
                  <p className="text-center text-[10px] text-white/20 mt-4 italic">
                    Se o problema persistir, entre em contato com o suporte técnico.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

const Badge: React.FC<{ children: React.ReactNode; variant?: 'default' | 'destructive'; className?: string }> = ({ 
  children, 
  variant = 'default', 
  className = '' 
}) => (
  <span className={`px-2 py-0.5 rounded-full ${
    variant === 'destructive' ? 'bg-destructive/20 text-destructive border border-destructive/30' : 
    'bg-primary/20 text-primary border border-primary/30'
  } ${className}`}>
    {children}
  </span>
);

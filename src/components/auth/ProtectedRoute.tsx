import { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ShieldAlert, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmpresaGuard } from './EmpresaGuard';

type AppRole = 'admin' | 'financeiro' | 'operacional' | 'visualizador';

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  financeiro: 'Financeiro',
  operacional: 'Operacional',
  visualizador: 'Visualizador',
};

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: AppRole[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, role, isLoading, hasRole } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    const requiredLabels = requiredRoles.map((r) => ROLE_LABELS[r]);
    const currentLabel = role ? ROLE_LABELS[role] : 'Não definido';
    const adminMailto = `mailto:?subject=${encodeURIComponent(
      'Solicitação de acesso — perfil ' + requiredLabels.join(' ou ')
    )}&body=${encodeURIComponent(
      `Olá,\n\nGostaria de solicitar acesso ao módulo restrito (perfil necessário: ${requiredLabels.join(
        ' ou '
      )}).\n\nMeu perfil atual é: ${currentLabel}.\nE-mail: ${user.email ?? ''}\n\nObrigado.`
    )}`;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full border-destructive/30">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Acesso restrito</CardTitle>
            <CardDescription>
              Esta área é exclusiva para usuários com perfil{' '}
              {requiredLabels.map((label, i) => (
                <span key={label}>
                  <Badge variant="outline" className="mx-1 border-primary/40 text-primary">
                    {label}
                  </Badge>
                  {i < requiredLabels.length - 1 && 'ou '}
                </span>
              ))}
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-sm">
              <p className="text-muted-foreground">
                Seu perfil atual é{' '}
                <Badge variant="secondary" className="mx-0.5">
                  {currentLabel}
                </Badge>
                , que não possui permissão para acessar este módulo.
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <p className="font-medium">Como solicitar acesso:</p>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>Entre em contato com o administrador da sua empresa.</li>
                <li>
                  Informe que precisa do perfil <strong>{requiredLabels.join(' ou ')}</strong> para
                  acessar esta funcionalidade.
                </li>
                <li>Após a aprovação, faça logout e login novamente para aplicar as mudanças.</li>
              </ol>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button asChild className="flex-1">
                <a href={adminMailto}>
                  <Mail className="mr-2 h-4 w-4" />
                  Solicitar acesso
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <EmpresaGuard>{children}</EmpresaGuard>;
}
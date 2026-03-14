import { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Search,
  Moon,
  Sun,
  ChevronDown,
  Building2,
  LogOut,
  User,
  Settings,
  Monitor,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useEmpresas } from '@/hooks/useFinancialData';
import { useAlertas } from '@/hooks/useAlertas';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HeaderProps {
  sidebarCollapsed?: boolean;
}

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrador', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  financeiro: { label: 'Financeiro', color: 'bg-secondary/10 text-secondary border-secondary/20' },
  operacional: { label: 'Operacional', color: 'bg-success/10 text-success border-success/20' },
  visualizador: { label: 'Visualizador', color: 'bg-muted text-muted-foreground' },
};

// Generate a consistent gradient from user name
function getAvatarGradient(name: string): string {
  const gradients = [
    'from-primary to-accent',
    'from-primary to-success',
    'from-accent to-warning',
    'from-success to-primary',
    'from-warning to-primary',
    'from-secondary to-primary',
    'from-streak to-primary',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function getInitialsFromName(name?: string | null, email?: string | null): string {
  if (name) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'U';
}

export const Header = forwardRef<HTMLElement, HeaderProps>(({ sidebarCollapsed }, ref) => {
  const { theme, setTheme, isDark } = useTheme();
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: empresas = [] } = useEmpresas();
  const { data: alertas = [] } = useAlertas();
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string | null>(null);
  
  const selectedEmpresa = useMemo(() => {
    if (selectedEmpresaId) return empresas.find(e => e.id === selectedEmpresaId);
    return empresas[0];
  }, [selectedEmpresaId, empresas]);
  
  const unreadAlerts = useMemo(() => alertas.filter((a) => !a.lido).length, [alertas]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Você saiu do sistema');
    navigate('/auth');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const initials = getInitialsFromName(profile?.full_name, user?.email);
  const avatarGradient = getAvatarGradient(displayName);

  const getThemeIcon = () => {
    if (theme === 'system') return Monitor;
    if (isDark) return Moon;
    return Sun;
  };

  const ThemeIcon = getThemeIcon();
  const roleInfo = role ? roleLabels[role] : null;

  return (
    <header
      ref={ref}
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-card/80 backdrop-blur-xl border-b border-border transition-all duration-300',
        sidebarCollapsed ? 'left-[72px]' : 'left-[260px]'
      )}
      style={{ boxShadow: 'var(--header-shadow)' }}
    >
      <div className="h-full flex items-center justify-between px-6">
        {/* Left: Search */}
        <div className="flex items-center gap-4 flex-1 max-w-xl" data-tour="search">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar transações, clientes, fornecedores... (Ctrl+K)"
              className="pl-10 bg-muted/50 border-transparent focus:bg-card focus:border-border h-10"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* CNPJ Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 gap-2 bg-card hover:bg-muted">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline text-sm font-medium">
                  {selectedEmpresa?.nome_fantasia || selectedEmpresa?.razao_social || 'Selecionar'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-popover">
              <DropdownMenuLabel>Selecionar Empresa</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {empresas.map((empresa) => (
                <DropdownMenuItem
                  key={empresa.id}
                  onClick={() => setSelectedEmpresaId(empresa.id)}
                  className={cn(
                    'flex flex-col items-start gap-0.5 cursor-pointer',
                    selectedEmpresa?.id === empresa.id && 'bg-primary/10'
                  )}
                >
                  <span className="font-medium">{empresa.nome_fantasia || empresa.razao_social}</span>
                  <span className="text-xs text-muted-foreground">{empresa.cnpj}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Keyboard Shortcuts */}
          <KeyboardShortcutsDialog />

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-tour="theme">
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={theme}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ThemeIcon className="h-5 w-5" />
                      </motion.div>
                    </AnimatePresence>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Alterar tema</TooltipContent>
              </Tooltip>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuLabel>Tema</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme('light')} className={cn("cursor-pointer gap-2", theme === 'light' && "bg-primary/10")}>
                <Sun className="h-4 w-4" /> Claro
                {theme === 'light' && <Badge variant="secondary" className="ml-auto">Ativo</Badge>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')} className={cn("cursor-pointer gap-2", theme === 'dark' && "bg-primary/10")}>
                <Moon className="h-4 w-4" /> Escuro
                {theme === 'dark' && <Badge variant="secondary" className="ml-auto">Ativo</Badge>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')} className={cn("cursor-pointer gap-2", theme === 'system' && "bg-primary/10")}>
                <Monitor className="h-4 w-4" /> Sistema
                {theme === 'system' && <Badge variant="secondary" className="ml-auto">Ativo</Badge>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-tour="notifications">
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 relative">
                    <Bell className="h-5 w-5" />
                    {unreadAlerts > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center font-bold"
                      >
                        {unreadAlerts > 9 ? '9+' : unreadAlerts}
                      </motion.span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {unreadAlerts > 0 ? `${unreadAlerts} notificações não lidas` : 'Notificações'}
                </TooltipContent>
              </Tooltip>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-popover">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notificações</span>
                <Badge variant="secondary">{unreadAlerts} novas</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {alertas.slice(0, 4).map((alerta) => (
                <DropdownMenuItem
                  key={alerta.id}
                  className={cn(
                    'flex flex-col items-start gap-1 p-3 cursor-pointer',
                    !alerta.lido && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className={cn(
                      'h-2 w-2 rounded-full',
                      alerta.prioridade === 'critica' && 'bg-destructive',
                      alerta.prioridade === 'alta' && 'bg-streak',
                      alerta.prioridade === 'media' && 'bg-warning',
                      alerta.prioridade === 'baixa' && 'bg-muted-foreground'
                    )} />
                    <span className="font-medium text-sm flex-1 truncate">{alerta.titulo}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 pl-4">{alerta.mensagem}</p>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-center text-primary font-medium cursor-pointer justify-center"
                onClick={() => navigate('/alertas')}
              >
                Ver todas as notificações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu with gradient avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 gap-2 pl-2 pr-3 hover:bg-muted">
                {/* Gradient Avatar */}
                <div className="relative">
                  <div className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br shadow-sm',
                    avatarGradient,
                  )}>
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-primary-foreground drop-shadow-sm">
                        {initials}
                      </span>
                    )}
                  </div>
                  {/* Online indicator */}
                  <span className="absolute -bottom-0 -right-0 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-card" />
                </div>

                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium leading-tight">{displayName}</span>
                  {roleInfo && (
                    <span className="text-[10px] text-muted-foreground leading-tight">{roleInfo.label}</span>
                  )}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-br shrink-0',
                    avatarGradient,
                  )}>
                    <span className="text-base font-bold text-primary-foreground">{initials}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-semibold truncate">{displayName}</span>
                    <span className="text-xs font-normal text-muted-foreground truncate">{user?.email}</span>
                    {roleInfo && (
                      <Badge variant="outline" className={cn("mt-0.5 w-fit text-[10px]", roleInfo.color)}>
                        <Shield className="h-2.5 w-2.5 mr-1" />
                        {roleInfo.label}
                      </Badge>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="h-4 w-4 mr-2" /> Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/configuracoes')}>
                <Settings className="h-4 w-4 mr-2" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
});
Header.displayName = 'Header';

import { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Search,
  Moon,
  Sun,
  ChevronDown,
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
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useAlertas } from '@/hooks/useAlertas';
import { useUserEmpresas } from '@/hooks/useUserEmpresas';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { EmpresaSwitcher } from './EmpresaSwitcher';
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
  const { user, profile, role, roleAtual, currentEmpresaId, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: alertas = [] } = useAlertas();
  const { data: vinculos = [] } = useUserEmpresas();

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
  const effectiveRole = roleAtual ?? role;
  const roleInfo = effectiveRole ? roleLabels[effectiveRole] : null;
  const isFallbackGlobal = !roleAtual && !!role;
  const currentEmpresa = useMemo(
    () => vinculos.find((v) => v.empresa_id === currentEmpresaId)?.empresa ?? null,
    [vinculos, currentEmpresaId],
  );
  const empresaLabel = currentEmpresa?.nome_fantasia || currentEmpresa?.razao_social || null;

  return (
    <header
      ref={ref}
      className={cn(
        'fixed top-0 right-0 z-30 h-20 bg-background/20 backdrop-blur-2xl border-b border-primary/5 transition-all duration-700 ease-apple',
        sidebarCollapsed ? 'left-[72px]' : 'left-[280px]'
      )}
      style={{ boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.03)' }}
    >
      <div className="h-full flex items-center justify-between px-8 gap-8">
        {/* Left: Search Command */}
        <div className="flex items-center flex-1 max-w-2xl group" data-tour="search">
          <div className="relative w-full">
            <div className="absolute inset-0 bg-white/5 rounded-2xl -m-0.5 opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm pointer-events-none" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-all duration-500 group-focus-within:scale-110" />
            <Input
              placeholder="Search Intelligence Command (⌘K)"
              className="pl-12 bg-white/5 border-white/5 focus:bg-background/80 focus:border-primary/30 h-12 rounded-2xl transition-all duration-500 font-medium text-sm shadow-inner placeholder:text-muted-foreground/30"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Empresa switcher with better styling */}
          <div className="bg-white/5 p-1 rounded-2xl border border-white/5">
            <EmpresaSwitcher />
          </div>

          <div className="w-px h-6 bg-white/10 mx-2 hidden lg:block" />

          {/* Action Buttons Grid */}
          <div className="flex items-center gap-1.5">
            {/* Keyboard Shortcuts */}
            <KeyboardShortcutsDialog />

            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild data-tour="theme">
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-white/5 hover:bg-primary/10 hover:text-primary border border-white/5 transition-all duration-300">
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
                  <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-300 relative">
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
              <Button variant="ghost" className="h-11 gap-3 pl-2 pr-4 hover:bg-primary/5 rounded-2xl transition-all duration-300 ring-1 ring-transparent hover:ring-primary/10">
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
                    <span className="text-[10px] text-muted-foreground leading-tight truncate max-w-[160px]">
                      {roleInfo.label}
                      {empresaLabel ? ` · ${empresaLabel}` : isFallbackGlobal ? ' · Global' : ''}
                    </span>
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
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        <Badge variant="outline" className={cn("w-fit text-[10px]", roleInfo.color)}>
                          <Shield className="h-2.5 w-2.5 mr-1" />
                          {roleInfo.label}
                        </Badge>
                        {empresaLabel ? (
                          <Badge variant="secondary" className="w-fit text-[10px] max-w-[140px] truncate">
                            {empresaLabel}
                          </Badge>
                        ) : isFallbackGlobal ? (
                          <Badge variant="outline" className="w-fit text-[10px] text-muted-foreground">
                            Global
                          </Badge>
                        ) : null}
                      </div>
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
    </div>
  </header>
);
});
Header.displayName = 'Header';
Header.displayName = 'Header';

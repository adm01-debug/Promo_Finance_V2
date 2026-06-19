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
  Languages,
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
import { useTranslation } from 'react-i18next';
import { useAlertas } from '@/hooks/useAlertas';
import { useUserEmpresas } from '@/hooks/useUserEmpresas';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { EmpresaScopeBar } from '@/components/empresa/EmpresaScopeBar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HeaderProps {
  sidebarCollapsed?: boolean;
}

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrador', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  financeiro: { label: 'Financeiro', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  operacional: { label: 'Operacional', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  visualizador: { label: 'Visualizador', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

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
  const { t, i18n } = useTranslation();
  const { data: alertas = [] } = useAlertas();
  const { data: vinculos = [] } = useUserEmpresas();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    toast.success(`Idioma alterado para ${lng === 'pt' ? 'Português' : lng === 'en' ? 'English' : 'Español'}`);
  };

  const unreadAlerts = useMemo(() => alertas.filter((a) => !a.lido).length, [alertas]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Você saiu do sistema');
    navigate('/auth');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const initials = getInitialsFromName(profile?.full_name, user?.email);

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
        'fixed top-0 right-0 z-30 h-16 border-b border-border transition-all duration-200 glass-effect bg-background/60 backdrop-blur-xl',
        sidebarCollapsed ? 'left-[80px]' : 'left-[280px]'
      )}
    >
      <div className="h-full flex items-center justify-between px-8 gap-6">
        <div className="flex items-center flex-1 max-w-xl gap-4">
          <div className="relative w-full max-w-sm group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Comando (Ctrl+K)..."
              className="pl-11 bg-muted/40 border-black/5 focus:bg-background focus:ring-1 focus:ring-primary/20 h-10 rounded-xl transition-all text-[13px] font-medium placeholder:text-muted-foreground/50 shadow-sm group-hover:bg-muted/60"
              onFocus={(e) => {
                e.preventDefault();
                e.target.blur();
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
              }}
            />
          </div>

          {empresaLabel && (
            <div className="hidden xl:flex items-center gap-2.5 px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 shadow-sm transition-all hover:bg-primary/10 cursor-default">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
              <span className="text-caption text-primary truncate max-w-[200px]">
                {empresaLabel}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <EmpresaSwitcher />
            
            <div className="w-px h-4 bg-border mx-1 hidden lg:block" />

            <KeyboardShortcutsDialog />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted">
                  <Languages className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="text-xs">Idioma</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => changeLanguage('pt')} className="text-sm">Português</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('en')} className="text-sm">English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('es')} className="text-sm">Español</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted">
                  <ThemeIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="text-xs">Tema</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme('light')} className="text-sm">Claro</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className="text-sm">Escuro</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')} className="text-sm">Sistema</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted relative">
                  <Bell className="h-4 w-4" />
                  {unreadAlerts > 0 && (
                    <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="text-xs font-bold px-4 py-3 border-b">Notificações</DropdownMenuLabel>
                <div className="max-h-[300px] overflow-y-auto">
                  {alertas.length > 0 ? (
                    alertas.slice(0, 5).map((alerta) => (
                      <DropdownMenuItem key={alerta.id} className="p-4 cursor-pointer border-b last:border-0 flex flex-col items-start gap-1">
                        <span className="font-semibold text-xs">{alerta.titulo}</span>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{alerta.mensagem}</p>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-muted-foreground">Sem notificações</div>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center py-2 text-primary font-bold text-[11px] cursor-pointer" onClick={() => navigate('/alertas')}>
                  Ver todas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="w-px h-6 bg-border mx-1 hidden lg:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 px-2 gap-2 hover:bg-muted transition-all"
                aria-label="Menu do usuário"
                data-testid="user-menu"
              >
                <div className="h-7 w-7 rounded bg-muted flex items-center justify-center font-bold text-muted-foreground text-[10px]">
                  {initials}
                </div>
                <div className="hidden sm:flex flex-col items-start text-left">
                  <span className="text-xs font-semibold text-foreground leading-none">{displayName}</span>
                  {roleInfo && (
                    <span className="text-[10px] text-muted-foreground mt-0.5">{roleInfo.label}</span>
                  )}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-bold text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/meu-perfil')} className="cursor-pointer">
                <User className="h-4 w-4 mr-2" /> Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/configuracoes')} className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" /> Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-rose-500 cursor-pointer focus:text-rose-500">
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
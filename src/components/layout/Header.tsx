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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockCNPJs, mockAlertas } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface HeaderProps {
  sidebarCollapsed?: boolean;
}

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrador', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  financeiro: { label: 'Financeiro', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  operacional: { label: 'Operacional', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  visualizador: { label: 'Visualizador', color: 'bg-muted text-muted-foreground' },
};

export const Header = ({ sidebarCollapsed }: HeaderProps) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedCNPJ, setSelectedCNPJ] = useState(mockCNPJs[0]);
  const unreadAlerts = mockAlertas.filter((a) => !a.lido).length;

  const isDark = resolvedTheme === 'dark';

  const handleSignOut = async () => {
    await signOut();
    toast.success('Você saiu do sistema');
    navigate('/auth');
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getThemeIcon = () => {
    if (theme === 'system') return Monitor;
    if (isDark) return Moon;
    return Sun;
  };

  const ThemeIcon = getThemeIcon();
  const roleInfo = role ? roleLabels[role] : null;

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-card/80 backdrop-blur-xl border-b border-border transition-all duration-300',
        sidebarCollapsed ? 'left-[72px]' : 'left-[260px]'
      )}
      style={{ boxShadow: 'var(--header-shadow)' }}
    >
      <div className="h-full flex items-center justify-between px-6">
        {/* Left: Search */}
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar transações, clientes, fornecedores..."
              className="pl-10 bg-muted/50 border-transparent focus:bg-card focus:border-border h-10"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* CNPJ Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 gap-2 bg-card hover:bg-muted"
              >
                <Building2 className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline text-sm font-medium">
                  {selectedCNPJ.nomeFantasia}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-popover">
              <DropdownMenuLabel>Selecionar Empresa</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {mockCNPJs.map((cnpj) => (
                <DropdownMenuItem
                  key={cnpj.id}
                  onClick={() => setSelectedCNPJ(cnpj)}
                  className={cn(
                    'flex flex-col items-start gap-0.5 cursor-pointer',
                    selectedCNPJ.id === cnpj.id && 'bg-primary/10'
                  )}
                >
                  <span className="font-medium">{cnpj.nomeFantasia}</span>
                  <span className="text-xs text-muted-foreground">
                    {cnpj.cnpj}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
              >
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
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuLabel>Tema</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setTheme('light')}
                className={cn("cursor-pointer gap-2", theme === 'light' && "bg-primary/10")}
              >
                <Sun className="h-4 w-4" />
                Claro
                {theme === 'light' && <Badge variant="secondary" className="ml-auto">Ativo</Badge>}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setTheme('dark')}
                className={cn("cursor-pointer gap-2", theme === 'dark' && "bg-primary/10")}
              >
                <Moon className="h-4 w-4" />
                Escuro
                {theme === 'dark' && <Badge variant="secondary" className="ml-auto">Ativo</Badge>}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setTheme('system')}
                className={cn("cursor-pointer gap-2", theme === 'system' && "bg-primary/10")}
              >
                <Monitor className="h-4 w-4" />
                Sistema
                {theme === 'system' && <Badge variant="secondary" className="ml-auto">Ativo</Badge>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 relative">
                <Bell className="h-5 w-5" />
                {unreadAlerts > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center font-bold animate-pulse">
                    {unreadAlerts}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-popover">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notificações</span>
                <Badge variant="secondary">{unreadAlerts} novas</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {mockAlertas.slice(0, 4).map((alerta) => (
                <DropdownMenuItem
                  key={alerta.id}
                  className={cn(
                    'flex flex-col items-start gap-1 p-3 cursor-pointer',
                    !alerta.lido && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        alerta.prioridade === 'critica' && 'bg-destructive',
                        alerta.prioridade === 'alta' && 'bg-orange-500',
                        alerta.prioridade === 'media' && 'bg-yellow-500',
                        alerta.prioridade === 'baixa' && 'bg-muted-foreground'
                      )}
                    />
                    <span className="font-medium text-sm flex-1 truncate">
                      {alerta.titulo}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 pl-4">
                    {alerta.mensagem}
                  </p>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="text-center text-primary font-medium cursor-pointer justify-center">
                <Link to="/alertas">Ver todas as notificações</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 gap-2 pl-2 pr-3 hover:bg-muted"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium leading-tight">
                    {profile?.full_name || user?.email?.split('@')[0] || 'Usuário'}
                  </span>
                  {roleInfo && (
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {roleInfo.label}
                    </span>
                  )}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <span>{profile?.full_name || 'Usuário'}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {user?.email}
                  </span>
                  {roleInfo && (
                    <Badge variant="outline" className={cn("mt-1 w-fit", roleInfo.color)}>
                      <Shield className="h-3 w-3 mr-1" />
                      {roleInfo.label}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="h-4 w-4 mr-2" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/configuracoes">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

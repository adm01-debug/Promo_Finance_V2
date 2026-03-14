import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, Bell, Search, Sun, Moon, Monitor,
  Command, MessageSquare, Calendar, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/theme/ThemeProvider';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onMenuClick?: () => void;
  className?: string;
}

export function Navbar({ onMenuClick, className }: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, setTheme, isDark } = useTheme();
  const navigate = useNavigate();

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-border/60',
        'bg-card/80 backdrop-blur-xl backdrop-saturate-150',
        'shadow-header',
        className
      )}
    >
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        {/* Left: Menu + Brand */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden h-9 w-9"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="hidden lg:flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow-primary">
            <span className="text-primary-foreground font-bold text-sm">P</span>
          </div>
          <div className="leading-none">
            <span className="text-sm font-bold text-foreground tracking-tight">Promo</span>
            <span className="text-[10px] block text-muted-foreground font-medium uppercase tracking-widest">Finance</span>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md mx-auto">
          <div
            className={cn(
              'relative flex items-center rounded-lg transition-all duration-200',
              'bg-muted/50 border border-transparent',
              'hover:border-border focus-within:border-primary/40 focus-within:bg-background',
              'focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]',
            )}
          >
            <Search className="h-4 w-4 ml-3 text-muted-foreground shrink-0" />
            <Input
              placeholder="Buscar transações, clientes, fornecedores..."
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-9 text-sm placeholder:text-muted-foreground/60"
            />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border/60 bg-muted/60 px-1.5 font-mono text-[10px] text-muted-foreground mr-2">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs">Tema</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="h-4 w-4 mr-2" /> Claro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="h-4 w-4 mr-2" /> Escuro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="h-4 w-4 mr-2" /> Sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="h-9 w-9 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center ring-2 ring-card">
              3
            </span>
          </Button>

          {/* Chat */}
          <Button variant="ghost" size="icon" className="h-9 w-9 hidden sm:flex">
            <MessageSquare className="h-4 w-4" />
          </Button>

          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 px-2">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-primary-foreground text-xs font-bold">JR</span>
                </div>
                <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
                  Joaquim Rosa
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">Joaquim Rosa</p>
                <p className="text-xs text-muted-foreground">Visualizador</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                <Settings className="h-4 w-4 mr-2" /> Configurações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

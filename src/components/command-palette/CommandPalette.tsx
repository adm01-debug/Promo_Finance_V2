/** Acesso rápido via CMD/Ctrl + K para navegação e ações globais. */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Search } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { buildManagementCommandGroups } from './commandPaletteManagement';
import { buildNavigationCommandGroups } from './commandPaletteNavigation';
import type { PaletteCommandGroup } from './commandPalette.types';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((isOpen) => !isOpen);
      }
      if (event.key === 'n' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const activeElement = document.activeElement;
        const isInput =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          activeElement?.getAttribute('contenteditable') === 'true';
        if (!isInput) {
          event.preventDefault();
          window.dispatchEvent(new CustomEvent('quick-create-open'));
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const commandGroups = useMemo<PaletteCommandGroup[]>(
    () => [
      ...buildNavigationCommandGroups(navigate),
      ...buildManagementCommandGroups(navigate, setTheme),
    ],
    [navigate, setTheme]
  );
  const filteredGroups = useMemo(() => {
    if (!search) return commandGroups;
    const searchLower = search.toLowerCase();
    return commandGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.title.toLowerCase().includes(searchLower) ||
            item.subtitle?.toLowerCase().includes(searchLower) ||
            item.keywords?.some((keyword) => keyword.includes(searchLower))
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [commandGroups, search]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="animate-[velaPop_0.28s_cubic-bezier(0.22,1,0.36,1)] rounded-lg border [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.08em]">
        <div
          aria-hidden
          className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        />
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 text-primary" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Digite um comando ou busque..."
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
            ESC
          </kbd>
        </div>
        <CommandList className="max-h-[400px]">
          <CommandEmpty className="py-6 text-center text-sm">
            <div className="flex flex-col items-center gap-2">
              <Search className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum resultado encontrado.</p>
              <p className="text-xs text-muted-foreground/70">
                Tente buscar por outra palavra-chave.
              </p>
            </div>
          </CommandEmpty>
          {filteredGroups.map((group, groupIndex) => (
            <CommandGroup key={group.heading} heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.subtitle || ''} ${item.keywords?.join(' ') || ''}`}
                  onSelect={() => runCommand(item.action)}
                  className="group flex items-center gap-3 py-3 cursor-pointer"
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg border border-transparent',
                      'bg-muted/50 text-muted-foreground',
                      'group-aria-selected:border-primary/25 group-aria-selected:bg-primary/10 group-aria-selected:text-primary'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant={item.badgeVariant || 'secondary'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    {item.subtitle && (
                      <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                    )}
                  </div>
                  {item.shortcut && (
                    <div className="hidden sm:flex items-center gap-0.5">
                      {item.shortcut.map((key, index) => (
                        <kbd
                          key={index}
                          className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground flex"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  )}
                </CommandItem>
              ))}
              {groupIndex < filteredGroups.length - 1 && <CommandSeparator />}
            </CommandGroup>
          ))}
        </CommandList>
        <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">↑↓</kbd>navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">↵</kbd>selecionar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">esc</kbd>fechar
            </span>
          </div>
          <span className="text-muted-foreground/70">
            Powered by <span className="font-medium text-primary">Expert IA</span>
          </span>
        </div>
      </Command>
    </CommandDialog>
  );
}

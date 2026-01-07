import * as React from "react";
import { type DialogProps } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import { Search, Loader2, X, ArrowRight, Hash, FileText, Settings, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// ============================================================================
// COMMAND BASE
// ============================================================================

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className,
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

// ============================================================================
// COMMAND DIALOG
// ============================================================================

interface CommandDialogProps extends DialogProps {}

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// COMMAND INPUT
// ============================================================================

interface CommandInputProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> {
  loading?: boolean;
  onClear?: () => void;
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  CommandInputProps
>(({ className, loading, onClear, value, ...props }, ref) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
        </motion.div>
      ) : (
        <motion.div
          key="search"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        </motion.div>
      )}
    </AnimatePresence>
    <CommandPrimitive.Input
      ref={ref}
      value={value}
      className={cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
    <AnimatePresence>
      {value && onClear && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={onClear}
          className="p-1 hover:bg-muted rounded"
        >
          <X className="h-4 w-4 opacity-50" />
        </motion.button>
      )}
    </AnimatePresence>
  </div>
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

// ============================================================================
// COMMAND LIST
// ============================================================================

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
));
CommandList.displayName = CommandPrimitive.List.displayName;

// ============================================================================
// COMMAND EMPTY
// ============================================================================

interface CommandEmptyProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty> {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
}

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  CommandEmptyProps
>(({ icon, title = "Nenhum resultado encontrado", description, ...props }, ref) => (
  <CommandPrimitive.Empty ref={ref} className="py-6 text-center" {...props}>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-2"
    >
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </motion.div>
  </CommandPrimitive.Empty>
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

// ============================================================================
// COMMAND GROUP
// ============================================================================

interface CommandGroupProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group> {
  icon?: React.ReactNode;
}

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  CommandGroupProps
>(({ className, icon, heading, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    heading={
      heading && (
        <div className="flex items-center gap-2">
          {icon && <span className="opacity-50">{icon}</span>}
          {heading}
        </div>
      )
    }
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className,
    )}
    {...props}
  />
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

// ============================================================================
// COMMAND SEPARATOR
// ============================================================================

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator ref={ref} className={cn("-mx-1 h-px bg-border", className)} {...props} />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

// ============================================================================
// COMMAND ITEM COM VARIANTES
// ============================================================================

interface CommandItemProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> {
  icon?: React.ReactNode;
  shortcut?: string[];
  description?: string;
  variant?: "default" | "destructive";
}

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  CommandItemProps
>(({ className, icon, shortcut, description, variant = "default", children, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
      "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
      "data-[selected='true']:bg-accent data-[selected=true]:text-accent-foreground",
      variant === "destructive" && "text-destructive data-[selected='true']:bg-destructive/10",
      className,
    )}
    {...props}
  >
    {icon && <span className="mr-2 h-4 w-4 shrink-0">{icon}</span>}
    <div className="flex-1">
      <span>{children}</span>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
    {shortcut && (
      <div className="ml-auto flex gap-1">
        {shortcut.map((key, i) => (
          <kbd
            key={i}
            className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground"
          >
            {key}
          </kbd>
        ))}
      </div>
    )}
  </CommandPrimitive.Item>
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

// ============================================================================
// COMMAND SHORTCUT
// ============================================================================

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)} {...props} />;
};
CommandShortcut.displayName = "CommandShortcut";

// ============================================================================
// SPOTLIGHT - Command Palette completo
// ============================================================================

interface SpotlightAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string[];
  description?: string;
  group?: string;
  onSelect: () => void;
}

interface SpotlightProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: SpotlightAction[];
  placeholder?: string;
  recentActions?: SpotlightAction[];
}

const Spotlight = ({
  open,
  onOpenChange,
  actions,
  placeholder = "Buscar ações...",
  recentActions = [],
}: SpotlightProps) => {
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const groupedActions = React.useMemo(() => {
    const groups: Record<string, SpotlightAction[]> = {};
    actions.forEach((action) => {
      const group = action.group || "Ações";
      if (!groups[group]) groups[group] = [];
      groups[group].push(action);
    });
    return groups;
  }, [actions]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder={placeholder}
        value={search}
        onValueChange={setSearch}
        onClear={() => setSearch("")}
      />
      <CommandList>
        <CommandEmpty
          icon={<Search className="h-10 w-10" />}
          title="Nenhum resultado"
          description="Tente buscar por outro termo"
        />

        {search === "" && recentActions.length > 0 && (
          <CommandGroup heading="Recentes" icon={<Hash className="h-3 w-3" />}>
            {recentActions.map((action) => (
              <CommandItem
                key={action.id}
                icon={action.icon}
                shortcut={action.shortcut}
                description={action.description}
                onSelect={() => {
                  action.onSelect();
                  onOpenChange(false);
                }}
              >
                {action.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {Object.entries(groupedActions).map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map((action) => (
              <CommandItem
                key={action.id}
                icon={action.icon}
                shortcut={action.shortcut}
                description={action.description}
                onSelect={() => {
                  action.onSelect();
                  onOpenChange(false);
                }}
              >
                {action.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>

      <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="rounded border px-1">↑↓</kbd> navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border px-1">↵</kbd> selecionar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border px-1">esc</kbd> fechar
          </span>
        </div>
        <span className="flex items-center gap-1">
          <kbd className="rounded border px-1">⌘</kbd>
          <kbd className="rounded border px-1">K</kbd>
        </span>
      </div>
    </CommandDialog>
  );
};

// ============================================================================
// COMMAND MENU HOOK
// ============================================================================

function useCommandMenu() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return { open, setOpen };
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
  Spotlight,
  useCommandMenu,
};

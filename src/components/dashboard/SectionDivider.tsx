export function SectionDivider({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="flex items-center gap-3 shrink-0">
        <div className="h-9 w-9 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 shadow-sm">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-caption text-muted-foreground/80">{label}</span>
      </div>
      <div className="flex-1 h-[2px] bg-gradient-to-r from-border/50 to-transparent rounded-full" />
    </div>
  );
}

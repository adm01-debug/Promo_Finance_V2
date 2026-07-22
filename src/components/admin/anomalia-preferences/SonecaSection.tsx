import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Props {
  silenciarAte: string | null;
  onChange: (iso: string | null) => void;
}

export function SonecaSection({ silenciarAte, onChange }: Props) {
  const ativo =
    silenciarAte && new Date(silenciarAte) > new Date() ? new Date(silenciarAte) : null;

  const silenciarPor = (horas: number) => {
    onChange(new Date(Date.now() + horas * 3600 * 1000).toISOString());
  };

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label className="flex flex-col gap-0.5">
          <span>Soneca temporária</span>
          {ativo ? (
            <span className="text-xs text-warning font-normal">
              Silenciado até{" "}
              {ativo.toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground font-normal">
              Sem soneca ativa
            </span>
          )}
        </Label>
        {ativo && (
          <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
            Reativar agora
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => silenciarPor(1)}>
          Silenciar 1h
        </Button>
        <Button size="sm" variant="outline" onClick={() => silenciarPor(8)}>
          Silenciar 8h
        </Button>
        <Button size="sm" variant="outline" onClick={() => silenciarPor(24)}>
          Silenciar 24h
        </Button>
      </div>
    </div>
  );
}

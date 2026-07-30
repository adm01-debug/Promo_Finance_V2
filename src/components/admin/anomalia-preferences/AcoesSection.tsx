import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MousePointerClick } from "lucide-react";

interface Option<K extends string> {
  key: K;
  label: string;
  hint: string;
}

interface Props<K extends string> {
  title: string;
  options: Array<Option<K>>;
  values: Record<K, boolean>;
  onChange: (values: Record<K, boolean>) => void;
  footerHint?: string;
}

export function AcoesSection<K extends string>({
  title,
  options,
  values,
  onChange,
  footerHint,
}: Props<K>) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <MousePointerClick className="h-4 w-4" />
        {title}
      </Label>
      <div className="grid sm:grid-cols-2 gap-2">
        {options.map((opt) => (
          <label
            key={opt.key}
            className="flex items-start gap-2 rounded-md border p-2.5 cursor-pointer"
          >
            <Checkbox
              checked={values[opt.key]}
              onChange={(e) => onChange({ ...values, [opt.key]: e.target.checked })}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{opt.label}</div>
              <div className="text-xs text-muted-foreground">{opt.hint}</div>
            </div>
          </label>
        ))}
      </div>
      {footerHint && <p className="text-xs text-muted-foreground">{footerHint}</p>}
    </div>
  );
}

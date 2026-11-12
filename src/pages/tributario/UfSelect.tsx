import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ALIQUOTAS_UF, UFS } from '@/lib/tributario/icms';
import type { UF } from '@/lib/tributario/icms';
import { pct } from './IcmsStDifal.helpers';

export function UfSelect({
  id,
  value,
  onChange,
  label,
}: {
  id: string;
  value: UF;
  onChange: (uf: UF) => void;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as UF)}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {UFS.map((uf) => (
            <SelectItem key={uf} value={uf}>
              {uf} — {ALIQUOTAS_UF[uf].nome} ({pct(ALIQUOTAS_UF[uf].interna)})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

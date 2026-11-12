import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { num } from './PisCofinsCreditos.helpers';

interface PisCofinsCreditosSaldoCredorPISProps {
  saldoPis: number;
  setSaldoPis: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<number>
  >;
  saldoCofins: number;
  setSaldoCofins: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<number>
  >;
  retPis: number;
  setRetPis: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<number>
  >;
  retCofins: number;
  setRetCofins: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<number>
  >;
}

export function PisCofinsCreditosSaldoCredorPIS({
  saldoPis,
  setSaldoPis,
  saldoCofins,
  setSaldoCofins,
  retPis,
  setRetPis,
  retCofins,
  setRetCofins,
}: PisCofinsCreditosSaldoCredorPISProps) {
  return (
    <CardContent className="grid gap-4 md:grid-cols-4">
      <div className="space-y-2">
        <Label>Saldo credor PIS</Label>
        <Input
          inputMode="decimal"
          value={String(saldoPis)}
          onChange={(e) => setSaldoPis(num(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label>Saldo credor COFINS</Label>
        <Input
          inputMode="decimal"
          value={String(saldoCofins)}
          onChange={(e) => setSaldoCofins(num(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label>Retenções PIS</Label>
        <Input
          inputMode="decimal"
          value={String(retPis)}
          onChange={(e) => setRetPis(num(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label>Retenções COFINS</Label>
        <Input
          inputMode="decimal"
          value={String(retCofins)}
          onChange={(e) => setRetCofins(num(e.target.value))}
        />
      </div>
    </CardContent>
  );
}

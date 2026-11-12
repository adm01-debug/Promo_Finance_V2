import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AuditLogsFiltrosConteudoProps {
  providerFilter: string;
  setProviderFilter: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  uniqueSsoProviders: string[];
  ssoFieldFilter: string;
  setSsoFieldFilter: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
}

export function AuditLogsFiltrosConteudo({
  providerFilter,
  setProviderFilter,
  uniqueSsoProviders,
  ssoFieldFilter,
  setSsoFieldFilter,
}: AuditLogsFiltrosConteudoProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 mt-4 p-3 rounded-lg border border-primary/30 bg-primary/5">
      <div>
        <label className="text-xs font-medium text-primary mb-1 block">Provider SSO</label>
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os providers</SelectItem>
            {uniqueSsoProviders.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-medium text-primary mb-1 block">Campo alterado</label>
        <Select value={ssoFieldFilter} onValueChange={setSsoFieldFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Campo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os campos</SelectItem>
            <SelectItem value="full_name">Nome completo</SelectItem>
            <SelectItem value="avatar_url">Foto de perfil</SelectItem>
            <SelectItem value="telefone">Telefone</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

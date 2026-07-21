import { Checkbox } from "@/components/ui/checkbox";
import { ALL_ROLES } from "./constants";
import type { AppRole } from "@/hooks/useSavedFilters";

interface RoleCheckboxGroupProps {
  idPrefix: string;
  roles: AppRole[];
  onChange: (roles: AppRole[]) => void;
}

export function RoleCheckboxGroup({ idPrefix, roles, onChange }: RoleCheckboxGroupProps) {
  const toggle = (role: AppRole, checked: boolean) => {
    onChange(checked ? [...roles, role] : roles.filter((r) => r !== role));
  };
  return (
    <div className="flex flex-wrap gap-2">
      {ALL_ROLES.map((r) => (
        <Checkbox
          key={r.key}
          id={`${idPrefix}-${r.key}`}
          checked={roles.includes(r.key)}
          onChange={(e) => toggle(r.key, (e.target as HTMLInputElement).checked)}
          label={r.label}
        />
      ))}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProfileMini {
  id: string;
  email: string | null;
  full_name: string | null;
}

/**
 * Resolve uma lista de user_ids para `{ id, email, full_name }`.
 * Retorna um Map<id, ProfileMini> pronto pra lookup O(1).
 *
 * Cacheia por conjunto de IDs (ordenados) — chamadas repetidas com o mesmo
 * conjunto reaproveitam o cache e não disparam novo SELECT.
 */
export function useProfilesByIds(userIds: Array<string | null | undefined>) {
  const ids = Array.from(
    new Set(userIds.filter((x): x is string => typeof x === "string" && x.length > 0)),
  ).sort();

  return useQuery({
    queryKey: ["profiles-by-ids", ids],
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, user_id")
        .in("user_id", ids);
      if (error) throw error;
      const map = new Map<string, ProfileMini>();
      for (const row of data ?? []) {
        const r = row as { id: string; email: string | null; full_name: string | null; user_id: string };
        map.set(r.user_id, { id: r.id, email: r.email, full_name: r.full_name });
      }
      return map;
    },
  });
}

/** Retorna "Nome" / "email" / "—" priorizando full_name. */
export function formatProfileLabel(p: ProfileMini | undefined | null): string {
  if (!p) return "—";
  if (p.full_name?.trim()) return p.full_name.trim();
  if (p.email?.trim()) return p.email.trim();
  return "—";
}

/** Mascara email para exibição: "jo***@dominio.com". */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const [user, domain] = email.split("@");
  if (!domain) return email;
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}${"*".repeat(Math.max(1, user.length - visible.length))}@${domain}`;
}

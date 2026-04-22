import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Filter, RefreshCw, Eye, Clock, AlertCircle } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { logger } from "@/lib/logger";

interface ScimLogRow {
  id: string;
  token_id: string | null;
  empresa_id: string | null;
  resource_type: string;
  operation: string;
  external_id: string | null;
  user_id: string | null;
  status_code: number;
  request_body: unknown;
  response_body: unknown;
  duration_ms: number | null;
  created_at: string;
}

const operations = ["all", "list", "get", "create", "update", "patch", "replace", "delete", "auth"];
const resources = ["all", "Users", "Groups", "ServiceProviderConfig", "Schemas", "ResourceTypes"];
const statusFilters = ["all", "2xx", "4xx", "5xx"] as const;

function statusVariant(code: number) {
  if (code >= 500) return "destructive" as const;
  if (code >= 400) return "secondary" as const;
  if (code >= 200 && code < 300) return "default" as const;
  return "outline" as const;
}

function formatMs(ms: number | null) {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export default function ScimAudit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const [empresaId, setEmpresaId] = useState<string>("all");
  const [userIdFilter, setUserIdFilter] = useState<string>("");
  const [resource, setResource] = useState<string>("all");
  const [operation, setOperation] = useState<string>("all");
  const [statusBucket, setStatusBucket] = useState<typeof statusFilters[number]>("all");
  const [search, setSearch] = useState<string>("");
  const [selected, setSelected] = useState<ScimLogRow | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data, error }) => {
      if (error) {
        logger.error("Erro ao verificar role admin", error);
        setIsAdmin(false);
        return;
      }
      setIsAdmin(!!data);
      if (!data) navigate("/");
    });
  }, [user, navigate]);

  const { data: empresas } = useQuery({
    queryKey: ["scim-audit-empresas"],
    enabled: isAdmin === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("id, razao_social, nome_fantasia")
        .order("razao_social");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: logs, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["scim-audit-logs", empresaId, userIdFilter, resource, operation, statusBucket],
    enabled: isAdmin === true,
    refetchInterval: 30_000,
    queryFn: async () => {
      let q = supabase
        .from("scim_operations_log" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (empresaId !== "all") q = q.eq("empresa_id", empresaId);
      if (userIdFilter.trim()) q = q.eq("user_id", userIdFilter.trim());
      if (resource !== "all") q = q.eq("resource_type", resource);
      if (operation !== "all") q = q.eq("operation", operation);
      if (statusBucket === "2xx") q = q.gte("status_code", 200).lt("status_code", 300);
      if (statusBucket === "4xx") q = q.gte("status_code", 400).lt("status_code", 500);
      if (statusBucket === "5xx") q = q.gte("status_code", 500).lt("status_code", 600);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ScimLogRow[];
    },
  });

  const filtered = useMemo(() => {
    if (!logs) return [];
    const term = search.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((r) =>
      [r.external_id, r.user_id, r.empresa_id, r.resource_type, r.operation, String(r.status_code)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [logs, search]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const errors = filtered.filter((r) => r.status_code >= 400).length;
    const errorRate = total ? (errors / total) * 100 : 0;
    const durations = filtered.map((r) => r.duration_ms ?? 0).filter((d) => d > 0).sort((a, b) => a - b);
    const p50 = durations.length ? durations[Math.floor(durations.length * 0.5)] : 0;
    const p95 = durations.length ? durations[Math.floor(durations.length * 0.95)] : 0;
    return { total, errors, errorRate, p50, p95 };
  }, [filtered]);

  const empresaName = (id: string | null) => {
    if (!id) return "—";
    const e = empresas?.find((x) => x.id === id);
    return e ? (e.nome_fantasia || e.razao_social) : id.slice(0, 8);
  };

  if (isAdmin === null) {
    return <div className="container mx-auto p-6"><Skeleton className="h-12 w-64" /></div>;
  }
  if (isAdmin === false) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-display-md text-foreground flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-primary" /> Auditoria SCIM
            </h1>
            <p className="text-muted-foreground mt-1">
              Histórico de operações de provisionamento por empresa, usuário e status
            </p>
          </div>
        </div>
        <Button onClick={() => refetch()} variant="outline" disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Operações</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Erros</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold flex items-center gap-2">
              {stats.errors}
              <Badge variant={stats.errorRate > 10 ? "destructive" : "secondary"}>
                {stats.errorRate.toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> p50</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{formatMs(stats.p50)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> p95</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-semibold">{formatMs(stats.p95)}</div></CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Filter className="h-4 w-4" /> Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <Select value={empresaId} onValueChange={setEmpresaId}>
            <SelectTrigger><SelectValue placeholder="Empresa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {(empresas ?? []).map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="user_id (UUID)"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
          />
          <Select value={resource} onValueChange={setResource}>
            <SelectTrigger><SelectValue placeholder="Recurso" /></SelectTrigger>
            <SelectContent>
              {resources.map((r) => <SelectItem key={r} value={r}>{r === "all" ? "Todos recursos" : r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={operation} onValueChange={setOperation}>
            <SelectTrigger><SelectValue placeholder="Operação" /></SelectTrigger>
            <SelectContent>
              {operations.map((o) => <SelectItem key={o} value={o}>{o === "all" ? "Todas ops" : o}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusBucket} onValueChange={(v) => setStatusBucket(v as typeof statusFilters[number])}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="2xx">2xx — sucesso</SelectItem>
              <SelectItem value="4xx">4xx — cliente</SelectItem>
              <SelectItem value="5xx">5xx — servidor</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Buscar (externalId, etc)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Operações recentes <span className="text-muted-foreground text-sm font-normal">(últimas 500)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8" />
              Nenhuma operação encontrada para os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Operação</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>External ID</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right">Duração</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-sm">{empresaName(r.empresa_id)}</TableCell>
                      <TableCell><Badge variant="outline">{r.resource_type}</Badge></TableCell>
                      <TableCell className="text-sm">{r.operation}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.user_id ? r.user_id.slice(0, 8) : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[180px] truncate">
                        {r.external_id || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={statusVariant(r.status_code)}>{r.status_code}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatMs(r.duration_ms)}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => setSelected(r)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalhe */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant={selected ? statusVariant(selected.status_code) : "outline"}>
                {selected?.status_code}
              </Badge>
              {selected?.resource_type} · {selected?.operation}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Quando:</span> {new Date(selected.created_at).toLocaleString("pt-BR")}</div>
                <div><span className="text-muted-foreground">Duração:</span> {formatMs(selected.duration_ms)}</div>
                <div><span className="text-muted-foreground">Empresa:</span> {empresaName(selected.empresa_id)}</div>
                <div><span className="text-muted-foreground">User ID:</span> <span className="font-mono text-xs">{selected.user_id || "—"}</span></div>
                <div><span className="text-muted-foreground">External ID:</span> <span className="font-mono text-xs">{selected.external_id || "—"}</span></div>
                <div><span className="text-muted-foreground">Token:</span> <span className="font-mono text-xs">{selected.token_id?.slice(0, 8) || "—"}</span></div>
              </div>

              <div>
                <h4 className="font-medium mb-1">Request</h4>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-60">
                  {JSON.stringify(selected.request_body ?? null, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-1">Response</h4>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-60">
                  {JSON.stringify(selected.response_body ?? null, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, DollarSign, Users, Building2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  isConnected: boolean;
  autoSync: boolean;
  syncInterval: string;
  onAutoSyncChange: (v: boolean) => void;
  onSyncIntervalChange: (v: string) => void;
  onTestConnection: () => void;
  onSyncDeals: () => void;
  onSyncContacts: () => void;
  onSyncCompanies: () => void;
  onExportPaymentStatus: () => void;
}

export function BitrixConfigTab({
  isConnected, autoSync, syncInterval,
  onAutoSyncChange, onSyncIntervalChange, onTestConnection,
  onSyncDeals, onSyncContacts, onSyncCompanies, onExportPaymentStatus,
}: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Conexão OAuth 2.0</CardTitle>
          <CardDescription>Status da conexão com o Bitrix24</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={cn(
            "p-4 rounded-lg border flex items-center gap-4",
            isConnected ? "border-success bg-success/5" : "border-destructive bg-destructive/5"
          )}>
            {isConnected ? <CheckCircle2 className="h-8 w-8 text-success" /> : <XCircle className="h-8 w-8 text-destructive" />}
            <div>
              <p className="font-semibold">{isConnected ? 'Conectado ao Bitrix24' : 'Não conectado'}</p>
              <p className="text-sm text-muted-foreground">
                {isConnected ? 'OAuth 2.0 ativo e tokens válidos' : 'Verifique as credenciais OAuth'}
              </p>
            </div>
          </div>

          <Button className="w-full" onClick={onTestConnection}>
            <CheckCircle2 className="h-4 w-4 mr-2" />Testar Conexão
          </Button>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Ações Manuais</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={onSyncDeals}>
                <DollarSign className="h-4 w-4 mr-2" />Sync Deals
              </Button>
              <Button variant="outline" size="sm" onClick={onSyncContacts}>
                <Users className="h-4 w-4 mr-2" />Sync Contatos
              </Button>
              <Button variant="outline" size="sm" onClick={onSyncCompanies}>
                <Building2 className="h-4 w-4 mr-2" />Sync Empresas
              </Button>
              <Button variant="outline" size="sm" onClick={onExportPaymentStatus}>
                <ExternalLink className="h-4 w-4 mr-2" />Exportar Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sincronização Automática</CardTitle>
          <CardDescription>Configure a frequência de sincronização</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sync Automática</p>
              <p className="text-sm text-muted-foreground">Sincronizar dados automaticamente</p>
            </div>
            <Switch checked={autoSync} onCheckedChange={onAutoSyncChange} />
          </div>
          <Separator />
          <div className="grid gap-2">
            <Label>Intervalo de Sincronização</Label>
            <Select value={syncInterval} onValueChange={onSyncIntervalChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">A cada 5 minutos</SelectItem>
                <SelectItem value="15">A cada 15 minutos</SelectItem>
                <SelectItem value="30">A cada 30 minutos</SelectItem>
                <SelectItem value="60">A cada 1 hora</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">* Configuração de cron job requer setup adicional no backend</p>
          </div>
          <div className="grid gap-2">
            <Label>Entidades para Sincronizar</Label>
            <div className="space-y-2">
              {['Deals → Contas a Receber', 'Contatos → Clientes', 'Empresas → Clientes', 'Status de Pagamento'].map(entity => (
                <div key={entity} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm">{entity}</span>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

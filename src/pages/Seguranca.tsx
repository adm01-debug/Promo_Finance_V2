import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MFASettings } from '@/components/auth/MFASettings';
import { RateLimitDashboard } from '@/components/security/RateLimitDashboard';
import { SecuritySettings } from '@/components/configuracoes/SecuritySettings';
import { KnownDevicesPanel } from '@/components/security/KnownDevicesPanel';
import { GeoRestrictionPanel } from '@/components/security/GeoRestrictionPanel';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { useAuth } from '@/hooks/useAuth';
import {
  Shield,
  Key,
  Activity,
  Settings,
  UserCog,
  Monitor,
  Globe,
} from 'lucide-react';

export default function Seguranca() {
  const { isAdmin } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto p-6 space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Central de Segurança</h1>
          <p className="text-muted-foreground">
            Gerencie autenticação, permissões e monitoramento de segurança
          </p>
        </div>
      </div>

      <Tabs defaultValue="mfa" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="mfa" className="gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">Minha Conta</span>
          </TabsTrigger>
          <TabsTrigger value="devices" className="gap-2">
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">Dispositivos</span>
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="geo" className="gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Geográfico</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Configurações</span>
              </TabsTrigger>
              <TabsTrigger value="ratelimit" className="gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Rate Limit</span>
              </TabsTrigger>
              <TabsTrigger value="audit" className="gap-2">
                <UserCog className="h-4 w-4" />
                <span className="hidden sm:inline">Auditoria</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="mfa" className="mt-6">
          <MFASettings />
        </TabsContent>

        <TabsContent value="devices" className="mt-6">
          <KnownDevicesPanel />
        </TabsContent>

        <PermissionGate permission="security.manage">
          <TabsContent value="geo" className="mt-6">
            <GeoRestrictionPanel />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="ratelimit" className="mt-6">
            <RateLimitDashboard />
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Logs de Auditoria</CardTitle>
                <CardDescription>
                  Acesse os logs completos em Configurações → Logs de Auditoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Os logs de auditoria estão disponíveis na página dedicada.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </PermissionGate>
      </Tabs>
    </motion.div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KeyRound, Activity, BookOpen, Settings as SettingsIcon, ShieldCheck, FlaskConical } from 'lucide-react';
import { SSOProvidersList } from '@/components/admin/sso/SSOProvidersList';
import { SSOWizardDialog } from '@/components/admin/sso/SSOWizardDialog';
import { SSOMetricsPanel } from '@/components/admin/sso/SSOMetricsPanel';
import { SSODocumentacao } from '@/components/admin/sso/SSODocumentacao';
import { ScimTokensTab } from '@/components/admin/sso/ScimTokensTab';
import { SSOSandboxPanel } from '@/components/admin/sso/SSOSandboxPanel';
import type { SSOProvider } from '@/hooks/useSSO';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function SSOAdmin() {
  const { isAdmin, isLoading } = useAuth();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<SSOProvider | null>(null);

  if (isLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const openCreate = () => { setEditing(null); setWizardOpen(true); };
  const openEdit = (p: SSOProvider) => { setEditing(p); setWizardOpen(true); };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">SSO Empresarial</h1>
          <p className="text-muted-foreground">
            Configure provedores de identidade (Azure AD, Okta, Google Workspace) para login corporativo
          </p>
        </div>
      </div>

      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers" className="gap-2"><SettingsIcon className="h-4 w-4" />Provedores</TabsTrigger>
          <TabsTrigger value="scim" className="gap-2"><ShieldCheck className="h-4 w-4" />SCIM</TabsTrigger>
          <TabsTrigger value="sandbox" className="gap-2"><FlaskConical className="h-4 w-4" />Sandbox</TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2"><Activity className="h-4 w-4" />Monitoramento</TabsTrigger>
          <TabsTrigger value="docs" className="gap-2"><BookOpen className="h-4 w-4" />Documentação</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="mt-6">
          <SSOProvidersList onEdit={openEdit} onCreate={openCreate} />
        </TabsContent>
        <TabsContent value="scim" className="mt-6">
          <ScimTokensTab />
        </TabsContent>
        <TabsContent value="sandbox" className="mt-6">
          <SSOSandboxPanel />
        </TabsContent>
        <TabsContent value="metrics" className="mt-6">
          <SSOMetricsPanel />
        </TabsContent>
        <TabsContent value="docs" className="mt-6">
          <SSODocumentacao />
        </TabsContent>
      </Tabs>

      <SSOWizardDialog open={wizardOpen} onOpenChange={setWizardOpen} editing={editing} />
    </motion.div>
  );
}

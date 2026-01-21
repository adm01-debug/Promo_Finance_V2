import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { PageHeader } from '@/components/common/page-header';
import { Card } from '@/components/common/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/common/alert';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Sun, 
  Moon, 
  Loader2,
  Save
} from 'lucide-react';

type TabKey = 'perfil' | 'notificacoes' | 'aparencia' | 'seguranca';

export default function ConfiguracoesPage() {
  const { user, updateProfile, updatePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('perfil');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const tabs = [
    { key: 'perfil' as TabKey, label: 'Perfil', icon: User },
    { key: 'notificacoes' as TabKey, label: 'Notificações', icon: Bell },
    { key: 'aparencia' as TabKey, label: 'Aparência', icon: Palette },
    { key: 'seguranca' as TabKey, label: 'Segurança', icon: Shield },
  ];

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    setMessage(null);
    const { error } = await updateProfile({ fullName });
    setIsLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    const { error } = await updatePassword(newPassword);
    setIsLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie suas preferências"
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-64">
          <Card className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {message && (
            <Alert
              variant={message.type}
              className="mb-4"
              onClose={() => setMessage(null)}
            >
              {message.text}
            </Alert>
          )}

          {activeTab === 'perfil' && (
            <Card title="Informações do Perfil">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleUpdateProfile}
                  disabled={isLoading}
                  leftIcon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                >
                  Salvar alterações
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'notificacoes' && (
            <Card title="Preferências de Notificação">
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Notificações por email
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-300 text-primary"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Contas vencendo
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-300 text-primary"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Resumo semanal
                  </span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary"
                  />
                </label>
              </div>
            </Card>
          )}

          {activeTab === 'aparencia' && (
            <Card title="Aparência">
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Escolha o tema da aplicação
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 ${
                      theme === 'light'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <Sun className="h-4 w-4" />
                    Claro
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 ${
                      theme === 'dark'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <Moon className="h-4 w-4" />
                    Escuro
                  </button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'seguranca' && (
            <Card title="Alterar Senha">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Senha atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">Nova senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleUpdatePassword}
                  disabled={isLoading || !newPassword}
                  leftIcon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                >
                  Alterar senha
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

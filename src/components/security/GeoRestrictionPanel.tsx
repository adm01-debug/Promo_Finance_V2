import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Globe, Plus, Trash2, Loader2, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AllowedCountry {
  id: string;
  country_code: string;
  country_name: string;
  ativo: boolean;
  created_at: string;
}

// Lista de países mais comuns
const COUNTRIES = [
  { code: 'BR', name: 'Brasil' },
  { code: 'PT', name: 'Portugal' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colômbia' },
  { code: 'MX', name: 'México' },
  { code: 'PE', name: 'Peru' },
  { code: 'UY', name: 'Uruguai' },
  { code: 'PY', name: 'Paraguai' },
  { code: 'ES', name: 'Espanha' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'FR', name: 'França' },
  { code: 'IT', name: 'Itália' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'CA', name: 'Canadá' },
  { code: 'JP', name: 'Japão' },
  { code: 'CN', name: 'China' },
  { code: 'AU', name: 'Austrália' },
  { code: 'NZ', name: 'Nova Zelândia' },
];

export function GeoRestrictionPanel() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');

  // Buscar configuração de geo restriction
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['security-settings-geo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Buscar países permitidos
  const { data: countries, isLoading: loadingCountries } = useQuery({
    queryKey: ['allowed-countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('allowed_countries')
        .select('*')
        .order('country_name');
      if (error) throw error;
      return data as AllowedCountry[];
    },
  });

  // Toggle geo restriction
  const toggleGeoMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (settings?.id) {
        const { error } = await supabase
          .from('security_settings')
          .update({ enable_geo_restriction: enabled })
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('security_settings')
          .insert({ enable_geo_restriction: enabled });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-settings-geo'] });
      toast.success('Configuração atualizada');
    },
    onError: () => {
      toast.error('Erro ao atualizar configuração');
    },
  });

  // Adicionar país
  const addCountryMutation = useMutation({
    mutationFn: async (countryCode: string) => {
      const country = COUNTRIES.find(c => c.code === countryCode);
      if (!country) throw new Error('País não encontrado');
      
      const { error } = await supabase
        .from('allowed_countries')
        .insert({
          country_code: country.code,
          country_name: country.name,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowed-countries'] });
      toast.success('País adicionado à whitelist');
      setAddDialogOpen(false);
      setSelectedCountry('');
    },
    onError: (error: Error & { code?: string }) => {
      if (error.code === '23505') {
        toast.error('Este país já está na whitelist');
      } else {
        toast.error('Erro ao adicionar país');
      }
    },
  });

  // Remover país
  const removeCountryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('allowed_countries')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowed-countries'] });
      toast.success('País removido da whitelist');
    },
    onError: () => {
      toast.error('Erro ao remover país');
    },
  });

  // Países disponíveis para adicionar (não estão na lista)
  const availableCountries = COUNTRIES.filter(
    c => !countries?.some(ac => ac.country_code === c.code)
  );

  if (loadingSettings || loadingCountries) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isEnabled = settings?.enable_geo_restriction ?? false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <CardTitle>Bloqueio Geográfico</CardTitle>
        </div>
        <CardDescription>
          Restrinja o acesso ao sistema apenas para países autorizados (Whitelist)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle de ativação */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
          <div className="space-y-1">
            <Label htmlFor="geo-toggle" className="font-medium">
              Ativar Bloqueio Geográfico
            </Label>
            <p className="text-sm text-muted-foreground">
              Apenas usuários de países na whitelist poderão acessar
            </p>
          </div>
          <Switch
            id="geo-toggle"
            checked={isEnabled}
            onCheckedChange={(checked) => toggleGeoMutation.mutate(checked)}
            disabled={!isAdmin || toggleGeoMutation.isPending}
          />
        </div>

        {/* Aviso quando ativado */}
        {isEnabled && (
          <div className="flex items-start gap-3 p-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-700 dark:text-yellow-500">
                Bloqueio geográfico ativo
              </p>
              <p className="text-yellow-600 dark:text-yellow-400">
                Usuários fora dos países listados abaixo não conseguirão fazer login.
              </p>
            </div>
          </div>
        )}

        {/* Lista de países permitidos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Países Permitidos</Label>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddDialogOpen(true)}
                disabled={availableCountries.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar País
              </Button>
            )}
          </div>

          {countries && countries.length > 0 ? (
            <div className="grid gap-2">
              {countries.map((country) => (
                <div
                  key={country.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {getFlagEmoji(country.country_code)}
                    </span>
                    <div>
                      <p className="font-medium">{country.country_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Código: {country.country_code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={country.ativo ? 'default' : 'secondary'}>
                      {country.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                    {isAdmin && countries.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCountryMutation.mutate(country.id)}
                        disabled={removeCountryMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg bg-muted/30">
              <Shield className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhum país na whitelist</p>
              <p className="text-sm text-muted-foreground">
                Adicione países para permitir o acesso
              </p>
            </div>
          )}
        </div>

        {/* Dialog para adicionar país */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar País</DialogTitle>
              <DialogDescription>
                Selecione um país para adicionar à whitelist de acesso
              </DialogDescription>
            </DialogHeader>

            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um país" />
              </SelectTrigger>
              <SelectContent>
                {availableCountries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {getFlagEmoji(country.code)} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => addCountryMutation.mutate(selectedCountry)}
                disabled={!selectedCountry || addCountryMutation.isPending}
              >
                {addCountryMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Converter código de país em emoji de bandeira
function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

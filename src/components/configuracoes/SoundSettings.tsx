import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Volume2, VolumeX, Bell, CheckCircle, AlertTriangle, XCircle, Banknote, Trophy, MessageSquare } from 'lucide-react';
import { useSoundFeedback, sounds } from '@/lib/sound-feedback';

export function SoundSettings() {
  const { config, toggle, setVolume } = useSoundFeedback();

  const testSounds = [
    { name: 'Sucesso', icon: CheckCircle, sound: sounds.success, color: 'text-success' },
    { name: 'Erro', icon: XCircle, sound: sounds.error, color: 'text-destructive' },
    { name: 'Aviso', icon: AlertTriangle, sound: sounds.warning, color: 'text-warning' },
    { name: 'Notificação', icon: Bell, sound: sounds.notification, color: 'text-primary' },
    { name: 'Pagamento', icon: Banknote, sound: sounds.payment, color: 'text-success' },
    { name: 'Meta', icon: Trophy, sound: sounds.goal, color: 'text-warning' },
    { name: 'Mensagem', icon: MessageSquare, sound: sounds.message, color: 'text-muted-foreground' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {config.enabled ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
          Feedback Sonoro
        </CardTitle>
        <CardDescription>
          Configure os sons de feedback para eventos importantes do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle principal */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sound-enabled">Sons ativados</Label>
            <p className="text-sm text-muted-foreground">
              Receba feedback sonoro para ações importantes
            </p>
          </div>
          <Switch
            id="sound-enabled"
            checked={config.enabled}
            onCheckedChange={toggle}
          />
        </div>

        {/* Volume */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Volume</Label>
            <span className="text-sm text-muted-foreground">
              {Math.round(config.volume * 100)}%
            </span>
          </div>
          <Slider
            value={[config.volume * 100]}
            onValueChange={([value]) => setVolume(value / 100)}
            max={100}
            step={5}
            disabled={!config.enabled}
            className="w-full"
          />
        </div>

        {/* Test sounds */}
        <div className="space-y-3">
          <Label>Testar sons</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {testSounds.map((item) => (
              <Button
                key={item.name}
                variant="outline"
                size="sm"
                onClick={item.sound}
                disabled={!config.enabled}
                className="flex items-center gap-2"
              >
                <item.icon className={`h-4 w-4 ${item.color}`} />
                <span className="text-xs">{item.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

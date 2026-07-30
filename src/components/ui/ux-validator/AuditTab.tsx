import { Palette, Type } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckItem, TokenItem, TypographyRow } from './helpers';

export function AuditTab() {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h3 className="text-foreground font-bold flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" /> Tokens de Design Atuais
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <TokenItem name="Background" value="hsl(222.2 84% 4.9%)" type="color" />
          <TokenItem name="Primary" value="hsl(217.2 91.2% 59.8%)" type="color" />
          <TokenItem name="Border" value="hsl(217.2 32.6% 17.5%)" type="color" />
          <TokenItem name="Card" value="hsl(222.2 84% 4.9%)" type="color" />
        </div>

        <h3 className="text-foreground font-bold flex items-center gap-2 pt-4">
          <Type className="h-5 w-5 text-primary" /> Tipografia & Escala
        </h3>
        <div className="space-y-3 bg-card/5 p-4 rounded-xl border border-white/5">
          <TypographyRow label="Display XL" value="4rem / 64px" sub="Tracking: -0.05em" />
          <TypographyRow label="Heading L1" value="2.25rem / 36px" sub="Tracking: -0.025em" />
          <TypographyRow label="Body Base" value="0.875rem / 14px" sub="Leading: 1.5" />
          <TypographyRow label="Caption" value="0.625rem / 10px" sub="Weight: 700" />
        </div>
      </div>

      <div className="space-y-6">
        <Card className="bg-primary/5 border-primary/20 premium-card">
          <CardHeader><CardTitle className="text-foreground text-lg">Checklist de Auditoria</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <CheckItem checked label="Margens laterais (layout-container)" />
            <CheckItem checked label="Font Family 'Outfit' em Headings" />
            <CheckItem checked label="Contraste Dark Mode (AA Passed)" />
            <CheckItem checked label="Alinhamento de ícones centralizados" />
            <CheckItem checked label="Shadow-xl em componentes premium" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

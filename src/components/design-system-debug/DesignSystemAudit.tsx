import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export const DesignSystemAudit = () => {
  const [tokens, setTokens] = useState<any>({
    colors: [],
    fonts: [],
    spacing: [],
    radius: []
  });

  useEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const bodyStyles = getComputedStyle(document.body);
    
    // Attempt to extract some CSS variables
    const colors = [
      { name: 'Primary', value: rootStyles.getPropertyValue('--primary') },
      { name: 'Secondary', value: rootStyles.getPropertyValue('--secondary') },
      { name: 'Background', value: rootStyles.getPropertyValue('--background') },
      { name: 'Foreground', value: rootStyles.getPropertyValue('--foreground') },
      { name: 'Muted', value: rootStyles.getPropertyValue('--muted') },
      { name: 'Accent', value: rootStyles.getPropertyValue('--accent') },
    ];

    const fonts = [
      { name: 'Body Font', value: bodyStyles.fontFamily },
      { name: 'Heading Font', value: rootStyles.getPropertyValue('--font-heading') || 'Outfit' },
    ];

    const spacing = [
      { name: 'Radius', value: rootStyles.getPropertyValue('--radius') },
    ];

    setTokens({ colors, fonts, spacing });
  }, []);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold font-heading">Design System Audit</h1>
        <p className="text-muted-foreground">Detailed view of the current design system tokens and scales.</p>
      </header>

      <Tabs defaultValue="typography" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="spacing">Spacing & Layout</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
        </TabsList>

        <TabsContent value="typography" className="space-y-4 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Font Scale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-4 font-bold border-b pb-2">
                  <div>Level</div>
                  <div>Sample</div>
                  <div>Size / Line Height</div>
                  <div>Weight</div>
                </div>
                {[
                  { level: 'Display', class: 'text-4xl font-bold', size: '2.25rem', lh: '2.5rem', w: '700' },
                  { level: 'H1', class: 'text-3xl font-bold', size: '1.875rem', lh: '2.25rem', w: '700' },
                  { level: 'H2', class: 'text-2xl font-semibold', size: '1.5rem', lh: '2rem', w: '600' },
                  { level: 'H3', class: 'text-xl font-semibold', size: '1.25rem', lh: '1.75rem', w: '600' },
                  { level: 'Large', class: 'text-lg font-medium', size: '1.125rem', lh: '1.75rem', w: '500' },
                  { level: 'Base', class: 'text-base', size: '1rem', lh: '1.5rem', w: '400' },
                  { level: 'Small', class: 'text-sm', size: '0.875rem', lh: '1.25rem', w: '400' },
                  { level: 'XS', class: 'text-xs', size: '0.75rem', lh: '1rem', w: '400' },
                ].map((item) => (
                  <div key={item.level} className="grid grid-cols-4 items-center border-b border-muted py-4 last:border-0">
                    <div className="text-sm font-medium text-muted-foreground">{item.level}</div>
                    <div className={item.class}>The quick brown fox</div>
                    <div className="text-xs font-mono">{item.size} / {item.lh}</div>
                    <div className="text-xs font-mono">{item.w}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tokens.colors.map((color: any) => (
                  <div key={color.name} className="flex items-center space-x-4 p-4 rounded-lg border">
                    <div 
                      className="w-12 h-12 rounded-md border" 
                      style={{ backgroundColor: `hsl(${color.value})` }}
                    />
                    <div>
                      <div className="font-bold">{color.name}</div>
                      <div className="text-xs font-mono text-muted-foreground">hsl({color.value})</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spacing" className="pt-6">
           <Card>
            <CardHeader>
              <CardTitle>Spacing Scale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 4, 6, 8, 12, 16, 20].map(s => (
                  <div key={s} className="flex items-center space-x-4">
                    <div className="w-12 text-sm font-mono text-muted-foreground">p-{s}</div>
                    <div className={`bg-primary/20 h-6`} style={{ width: `${s * 0.25}rem` }} />
                    <div className="text-xs font-mono">{s * 4}px / {s * 0.25}rem</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Cards</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Card className="premium-card p-4">
                  <p className="font-heading font-semibold">Premium Card Utility</p>
                  <p className="text-sm text-muted-foreground">Using .premium-card class</p>
                </Card>
                <Card className="p-4 shadow-sm border border-border">
                  <p className="font-semibold">Standard Card</p>
                  <p className="text-sm text-muted-foreground">Using shadcn default</p>
                </Card>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Buttons</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <button className="premium-button">Premium Button</button>
                <div className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Standard Primary</div>
                <div className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium">Secondary</div>
                <div className="px-4 py-2 border border-input bg-background rounded-md text-sm font-medium">Outline</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

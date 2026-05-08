import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  Palette, 
  Type, 
  Layout, 
  Activity, 
  MousePointer2, 
  Focus, 
  Loader2, 
  LayoutPanelLeft,
  Search,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const Section = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
  <motion.section 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
    </div>
    {children}
  </motion.section>
);

const ColorSwatch = ({ name, variable, description }: { name: string, variable: string, description: string }) => (
  <div className="space-y-2">
    <div 
      className="h-24 w-full rounded-2xl border border-border shadow-sm transition-transform hover:scale-[1.02]" 
      style={{ backgroundColor: `hsl(var(${variable}))` }}
    />
    <div>
      <p className="font-bold text-sm uppercase tracking-wider">{name}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
      <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">{variable}</code>
    </div>
  </div>
);

export default function StyleGuide() {
  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-16 pb-20">
        <div className="space-y-4">
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-widest">
            Design System v2.0
          </Badge>
          <h1 className="text-5xl font-black tracking-tighter">Guia de Estilo Corporativo</h1>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Padronização visual e de interação para o Grupo Promo Brindes. Use estes tokens e componentes para manter a consistência em todo o ecossistema.
          </p>
        </div>

        {/* Cores */}
        <Section title="Paleta de Cores" icon={Palette}>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            <ColorSwatch name="Background" variable="--background" description="Fundo principal da aplicação" />
            <ColorSwatch name="Card" variable="--card" description="Superfícies de destaque e cards" />
            <ColorSwatch name="Primary" variable="--primary" description="Cor de destaque e ações principais" />
            <ColorSwatch name="Secondary" variable="--secondary" description="Ações secundárias e elementos neutros" />
            <ColorSwatch name="Muted" variable="--muted" description="Textos de apoio e bordas sutis" />
            <ColorSwatch name="Success" variable="--success" description="Confirmações e estados positivos" />
            <ColorSwatch name="Warning" variable="--warning" description="Alertas e atenção necessária" />
            <ColorSwatch name="Destructive" variable="--destructive" description="Erros, exclusões e perigo" />
            <ColorSwatch name="Info" variable="--info" description="Informativos e guias" />
            <ColorSwatch name="Accent" variable="--accent" description="Destaques sutis em hover/seleção" />
          </div>
        </Section>

        {/* Tipografia */}
        <Section title="Tipografia" icon={Type}>
          <div className="grid gap-12">
            <Card className="premium-card">
              <CardContent className="p-8 space-y-8">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">Display Font: Outfit</p>
                  <div className="space-y-4">
                    <h1 className="text-6xl font-black tracking-tighter">Heading Level 1</h1>
                    <h2 className="text-4xl font-bold tracking-tight">Heading Level 2</h2>
                    <h3 className="text-2xl font-semibold">Heading Level 3</h3>
                  </div>
                </div>
                <div className="space-y-2 pt-4 border-t">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">Body Font: Inter</p>
                  <p className="text-lg leading-relaxed">
                    A fonte Inter é usada para todo o corpo de texto, garantindo máxima legibilidade corporativa. 
                    <strong> Este é um texto em negrito</strong> e <em>este é um texto em itálico</em>.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tamanhos menores são usados para metadados e legendas, mantendo o contraste necessário.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Estados de UI */}
        <Section title="Estados de Interface" icon={MousePointer2}>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="text-lg">Botões & Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase opacity-50">Normal</p>
                    <Button>Primary Button</Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase opacity-50">Ghost</p>
                    <Button variant="ghost">Ghost Button</Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase opacity-50">Outline</p>
                    <Button variant="outline">Outline Button</Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase opacity-50">Loading</p>
                    <Button disabled>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="text-lg">Inputs & Formulários</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase opacity-50">Default / Focus</p>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Clique para ver o foco..." className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase opacity-50">Error State</p>
                    <Input className="border-destructive focus-visible:ring-destructive" defaultValue="Valor inválido" />
                    <p className="text-[10px] text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Este campo é obrigatório
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Animações */}
        <Section title="Animações & Feedback" icon={Activity}>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="premium-card p-6 flex flex-col items-center justify-center gap-4 group cursor-pointer">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110 group-active:scale-95 duration-500 ease-apple">
                <MousePointer2 className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold">Hover Spring</p>
              <p className="text-center text-xs text-muted-foreground">Efeito Apple-like em cards e ícones</p>
            </div>
            
            <div className="premium-card p-6 flex flex-col items-center justify-center gap-4">
              <div className="h-2 w-full max-w-[150px] overflow-hidden rounded-full bg-muted">
                <motion.div 
                  className="h-full bg-primary"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                />
              </div>
              <p className="text-sm font-bold">Progress Loader</p>
              <p className="text-center text-xs text-muted-foreground">Feedback de carregamento linear</p>
            </div>

            <div className="premium-card p-6 flex flex-col items-center justify-center gap-4">
              <div className="h-12 w-full rounded-xl shimmer" />
              <p className="text-sm font-bold">Skeleton Shimmer</p>
              <p className="text-center text-xs text-muted-foreground">Estados de espera para dados</p>
            </div>
          </div>
        </Section>
      </div>
    </MainLayout>
  );
}

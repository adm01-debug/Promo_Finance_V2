import { useState } from 'react';
import { Save, FolderOpen, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useFilterPresets } from '@/hooks/useFilterPresets';
import { useAuth } from '@/hooks/useAuth';
import { logUserAction } from '@/lib/audit-logger';

interface FilterPresetsManagerProps {
  entityType: string;
  empresaId?: string;
  currentFilters: any;
  onLoadPreset: (filters: any) => void;
}

export function FilterPresetsManager({ 
  entityType, 
  empresaId, 
  currentFilters, 
  onLoadPreset 
}: FilterPresetsManagerProps) {
  const { user } = useAuth();
  const { presets, savePreset, deletePreset } = useFilterPresets(entityType, empresaId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const handleSave = async () => {
    if (!newPresetName.trim()) return;
    
    await savePreset.mutateAsync({
      name: newPresetName,
      filters: currentFilters
    });

    if (user) {
      await logUserAction({
        userId: user.id,
        actionType: 'preset_saved',
        entityType,
        newValue: { name: newPresetName, filters: currentFilters }
      });
    }

    setNewPresetName('');
    setIsDialogOpen(false);
  };

  const handleLoad = async (preset: any) => {
    onLoadPreset(preset.filters);
    
    if (user) {
      await logUserAction({
        userId: user.id,
        actionType: 'preset_loaded',
        entityType,
        metadata: { presetId: preset.id, presetName: preset.name }
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-10 rounded-xl border-white/10 bg-white/5 gap-2 px-4 font-bold">
            <FolderOpen className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">Presets</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl" align="end">
          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-40">Meus Presets</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/5" />
          
          {presets.length === 0 ? (
            <div className="px-2 py-4 text-center text-xs text-muted-foreground italic">
              Nenhum preset salvo
            </div>
          ) : (
            presets.map((preset) => (
              <div key={preset.id} className="flex items-center group">
                <DropdownMenuItem 
                  className="flex-1 rounded-xl cursor-pointer"
                  onClick={() => handleLoad(preset)}
                >
                  <span className="font-bold">{preset.name}</span>
                </DropdownMenuItem>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePreset.mutate(preset.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
          
          <DropdownMenuSeparator className="bg-white/5" />
          <DropdownMenuItem 
            className="rounded-xl cursor-pointer text-primary focus:text-primary gap-2"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="font-bold">Salvar atual</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md border-none bg-background/95 backdrop-blur-3xl shadow-3xl rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Salvar Novo Preset</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Ex: Fechamento Mensal, Auditoria Anual..."
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="h-12 bg-white/5 border-white/10 rounded-xl font-bold"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl font-black bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Save className="h-4 w-4 mr-2" />
              Salvar Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

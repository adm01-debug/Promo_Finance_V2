import { Download, FileArchive, FileDown, FileJson, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  errosTotal: number;
  avisosTotal: number;
  errosFiltradosTotal: number;
  avisosFiltradosTotal: number;
  temFiltro: boolean;
  podeExportarFiltrado: boolean;
  bloqueado: boolean;
  isRejeitado: boolean;
  onClose: () => void;
  onExportPdf: (filtrado: boolean) => void;
  onExportJson: (filtrado: boolean) => void;
  onDownloadTxt: () => void;
  onDownloadZip: () => void;
}

export function FooterActions({
  errosTotal,
  avisosTotal,
  errosFiltradosTotal,
  avisosFiltradosTotal,
  temFiltro,
  podeExportarFiltrado,
  bloqueado,
  isRejeitado,
  onClose,
  onExportPdf,
  onExportJson,
  onDownloadTxt,
  onDownloadZip,
}: Props) {
  const bloqueioMsg = isRejeitado ? 'Bloqueado: arquivo rejeitado' : 'Bloqueado por erros de validação';
  return (
    <DialogFooter className="gap-2">
      <Button variant="ghost" onClick={onClose}>
        Fechar
      </Button>
      <div className="h-6 w-px bg-border mx-2 hidden sm:block" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            data-testid="btn-exportar-validacoes"
            disabled={errosTotal === 0 && avisosTotal === 0}
            className="gap-2 font-bold shadow-sm"
          >
            <FileDown className="h-4 w-4" />
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest opacity-50 px-2 py-1">
            Relatório Completo
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onExportPdf(false)} className="gap-3 py-2 rounded-lg cursor-pointer">
            <div className="p-1.5 bg-destructive/10 rounded-md">
              <FileText className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold">PDF (.pdf)</span>
              <span className="text-[10px] text-muted-foreground">{errosTotal + avisosTotal} item(ns)</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExportJson(false)} className="gap-3 py-2 rounded-lg cursor-pointer">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <FileJson className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold">JSON (.json)</span>
              <span className="text-[10px] text-muted-foreground">{errosTotal + avisosTotal} item(ns)</span>
            </div>
          </DropdownMenuItem>
          {temFiltro && (
            <>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest opacity-50 px-2 py-1">
                Apenas Filtrados
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onExportPdf(true)}
                disabled={!podeExportarFiltrado}
                data-testid="btn-exportar-pdf-filtrado"
                className="gap-3 py-2 rounded-lg cursor-pointer"
              >
                <div className="p-1.5 bg-destructive/10 rounded-md">
                  <FileText className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold">PDF Filtrado</span>
                  <span className="text-[10px] text-muted-foreground">
                    {errosFiltradosTotal + avisosFiltradosTotal} item(ns)
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onExportJson(true)}
                disabled={!podeExportarFiltrado}
                data-testid="btn-exportar-json-filtrado"
                className="gap-3 py-2 rounded-lg cursor-pointer"
              >
                <div className="p-1.5 bg-primary/10 rounded-md">
                  <FileJson className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold">JSON Filtrado</span>
                  <span className="text-[10px] text-muted-foreground">
                    {errosFiltradosTotal + avisosFiltradosTotal} item(ns)
                  </span>
                </div>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                variant="outline"
                onClick={onDownloadZip}
                disabled={bloqueado}
                aria-disabled={bloqueado}
                data-testid="btn-download-zip"
              >
                <FileArchive className="h-4 w-4 mr-2" />
                Baixar .zip
              </Button>
            </span>
          </TooltipTrigger>
          {bloqueado && <TooltipContent>{bloqueioMsg}</TooltipContent>}
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                onClick={onDownloadTxt}
                disabled={bloqueado}
                aria-disabled={bloqueado}
                data-testid="btn-download-txt"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar .txt
              </Button>
            </span>
          </TooltipTrigger>
          {bloqueado && <TooltipContent>{bloqueioMsg}</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    </DialogFooter>
  );
}

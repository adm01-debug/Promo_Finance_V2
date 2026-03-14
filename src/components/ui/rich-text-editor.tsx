import { useState, useCallback, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Link, Image, Code, Quote, Undo, Redo, Type, Heading1, Heading2, Heading3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string; onChange: (value: string) => void; placeholder?: string;
  minHeight?: number; maxHeight?: number; readOnly?: boolean; className?: string;
  toolbar?: boolean; onFocus?: () => void; onBlur?: () => void;
}

function ToolbarButton({ icon: Icon, command, value, active, onClick, title }: {
  icon: typeof Bold; command: string; value?: string; active?: boolean; onClick?: () => void; title: string;
}) {
  const handleClick = () => { if (onClick) onClick(); else document.execCommand(command, false, value); };
  return (
    <button type="button" onClick={handleClick} title={title} className={cn('p-1.5 rounded hover:bg-muted transition-colors', active && 'bg-accent')}>
      <Icon className="w-4 h-4" />
    </button>
  );
}

function ToolbarDivider() { return <div className="w-px h-6 bg-border mx-1" />; }

export function RichTextEditor({ value, onChange, placeholder = 'Digite aqui...', minHeight = 200, maxHeight = 500, readOnly = false, className, toolbar = true, onFocus, onBlur }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectionState, setSelectionState] = useState({ bold: false, italic: false, underline: false, strikethrough: false, orderedList: false, unorderedList: false });

  useEffect(() => { if (editorRef.current && editorRef.current.innerHTML !== value) editorRef.current.innerHTML = value; }, [value]);
  const handleInput = useCallback(() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }, [onChange]);
  const updateSelectionState = useCallback(() => {
    setSelectionState({ bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic'), underline: document.queryCommandState('underline'), strikethrough: document.queryCommandState('strikeThrough'), orderedList: document.queryCommandState('insertOrderedList'), unorderedList: document.queryCommandState('insertUnorderedList') });
  }, []);
  const handleFocus = useCallback(() => { setIsFocused(true); onFocus?.(); }, [onFocus]);
  const handleBlur = useCallback(() => { setIsFocused(false); onBlur?.(); }, [onBlur]);
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '    '); }
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b': e.preventDefault(); document.execCommand('bold'); break;
        case 'i': e.preventDefault(); document.execCommand('italic'); break;
        case 'u': e.preventDefault(); document.execCommand('underline'); break;
        case 'z': e.preventDefault(); document.execCommand(e.shiftKey ? 'redo' : 'undo'); break;
      }
      updateSelectionState();
    }
  }, [updateSelectionState]);
  const insertLink = useCallback(() => { const url = prompt('Digite a URL:'); if (url) document.execCommand('createLink', false, url); }, []);
  const insertImage = useCallback(() => { const url = prompt('Digite a URL da imagem:'); if (url) document.execCommand('insertImage', false, url); }, []);
  const formatBlock = useCallback((tag: string) => { document.execCommand('formatBlock', false, tag); }, []);

  return (
    <div className={cn('border rounded-lg overflow-hidden', isFocused ? 'border-primary ring-1 ring-primary' : 'border-border', className)}>
      {toolbar && !readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/50">
          <ToolbarButton icon={Bold} command="bold" active={selectionState.bold} title="Negrito (Ctrl+B)" />
          <ToolbarButton icon={Italic} command="italic" active={selectionState.italic} title="Itálico (Ctrl+I)" />
          <ToolbarButton icon={Underline} command="underline" active={selectionState.underline} title="Sublinhado (Ctrl+U)" />
          <ToolbarButton icon={Strikethrough} command="strikeThrough" active={selectionState.strikethrough} title="Tachado" />
          <ToolbarDivider />
          <ToolbarButton icon={Type} command="formatBlock" value="p" onClick={() => formatBlock('p')} title="Parágrafo" />
          <ToolbarButton icon={Heading1} command="formatBlock" value="h1" onClick={() => formatBlock('h1')} title="Título 1" />
          <ToolbarButton icon={Heading2} command="formatBlock" value="h2" onClick={() => formatBlock('h2')} title="Título 2" />
          <ToolbarButton icon={Heading3} command="formatBlock" value="h3" onClick={() => formatBlock('h3')} title="Título 3" />
          <ToolbarDivider />
          <ToolbarButton icon={List} command="insertUnorderedList" active={selectionState.unorderedList} title="Lista" />
          <ToolbarButton icon={ListOrdered} command="insertOrderedList" active={selectionState.orderedList} title="Lista numerada" />
          <ToolbarDivider />
          <ToolbarButton icon={AlignLeft} command="justifyLeft" title="Alinhar à esquerda" />
          <ToolbarButton icon={AlignCenter} command="justifyCenter" title="Centralizar" />
          <ToolbarButton icon={AlignRight} command="justifyRight" title="Alinhar à direita" />
          <ToolbarDivider />
          <ToolbarButton icon={Link} command="createLink" onClick={insertLink} title="Inserir link" />
          <ToolbarButton icon={Image} command="insertImage" onClick={insertImage} title="Inserir imagem" />
          <ToolbarButton icon={Quote} command="formatBlock" value="blockquote" onClick={() => formatBlock('blockquote')} title="Citação" />
          <ToolbarButton icon={Code} command="formatBlock" value="pre" onClick={() => formatBlock('pre')} title="Código" />
          <ToolbarDivider />
          <ToolbarButton icon={Undo} command="undo" title="Desfazer (Ctrl+Z)" />
          <ToolbarButton icon={Redo} command="redo" title="Refazer (Ctrl+Shift+Z)" />
        </div>
      )}
      <div ref={editorRef} contentEditable={!readOnly} onInput={handleInput} onFocus={handleFocus} onBlur={handleBlur} onKeyDown={handleKeyDown} onMouseUp={updateSelectionState} onKeyUp={updateSelectionState} data-placeholder={placeholder}
        className={cn('p-4 outline-none bg-background', 'prose prose-sm dark:prose-invert max-w-none', 'overflow-y-auto', readOnly && 'cursor-default', !value && 'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground')}
        style={{ minHeight, maxHeight }} suppressContentEditableWarning />
    </div>
  );
}

interface MarkdownEditorProps { value: string; onChange: (value: string) => void; placeholder?: string; minHeight?: number; className?: string; }

export function MarkdownEditor({ value, onChange, placeholder = 'Escreva em markdown...', minHeight = 200, className }: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  return (
    <div className={cn('border rounded-lg overflow-hidden border-border', className)}>
      <div className="flex border-b border-border">
        <button type="button" onClick={() => setShowPreview(false)} className={cn('px-4 py-2 text-sm font-medium transition-colors', !showPreview ? 'bg-background text-primary border-b-2 border-primary' : 'bg-muted/50 text-muted-foreground')}>Editar</button>
        <button type="button" onClick={() => setShowPreview(true)} className={cn('px-4 py-2 text-sm font-medium transition-colors', showPreview ? 'bg-background text-primary border-b-2 border-primary' : 'bg-muted/50 text-muted-foreground')}>Visualizar</button>
      </div>
      {showPreview ? (
        <div className="p-4 prose prose-sm dark:prose-invert max-w-none bg-background" style={{ minHeight }} dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(value) }} />
      ) : (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full p-4 bg-background resize-none outline-none font-mono text-sm" style={{ minHeight }} />
      )}
    </div>
  );
}

function simpleMarkdownToHtml(markdown: string): string {
  return markdown.replace(/^### (.*$)/gim, '<h3>$1</h3>').replace(/^## (.*$)/gim, '<h2>$1</h2>').replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>').replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/\n/g, '<br>').replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>').replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
}

export default RichTextEditor;

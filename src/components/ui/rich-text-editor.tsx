import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Image,
  Code,
  Quote,
  Undo,
  Redo,
  Type,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  readOnly?: boolean;
  className?: string;
  toolbar?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

interface ToolbarButtonProps {
  icon: typeof Bold;
  command: string;
  value?: string;
  active?: boolean;
  onClick?: () => void;
  title: string;
}

function ToolbarButton({ icon: Icon, command, value, active, onClick, title }: ToolbarButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      document.execCommand(command, false, value);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title}
      className={cn(
        'p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
        active && 'bg-gray-200 dark:bg-gray-600'
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Digite aqui...',
  minHeight = 200,
  maxHeight = 500,
  readOnly = false,
  className,
  toolbar = true,
  onFocus,
  onBlur,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectionState, setSelectionState] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    orderedList: false,
    unorderedList: false,
  });

  // Set initial content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Handle input
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // Update selection state
  const updateSelectionState = useCallback(() => {
    setSelectionState({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikeThrough'),
      orderedList: document.queryCommandState('insertOrderedList'),
      unorderedList: document.queryCommandState('insertUnorderedList'),
    });
  }, []);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '    ');
    }
    
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline');
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            document.execCommand('redo');
          } else {
            document.execCommand('undo');
          }
          break;
      }
      updateSelectionState();
    }
  }, [updateSelectionState]);

  // Insert link
  const insertLink = useCallback(() => {
    const url = prompt('Digite a URL:');
    if (url) {
      document.execCommand('createLink', false, url);
    }
  }, []);

  // Insert image
  const insertImage = useCallback(() => {
    const url = prompt('Digite a URL da imagem:');
    if (url) {
      document.execCommand('insertImage', false, url);
    }
  }, []);

  // Format block
  const formatBlock = useCallback((tag: string) => {
    document.execCommand('formatBlock', false, tag);
  }, []);

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden',
        isFocused
          ? 'border-primary-500 ring-1 ring-primary-500'
          : 'border-gray-300 dark:border-gray-600',
        className
      )}
    >
      {/* Toolbar */}
      {toolbar && !readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          {/* Text formatting */}
          <ToolbarButton
            icon={Bold}
            command="bold"
            active={selectionState.bold}
            title="Negrito (Ctrl+B)"
          />
          <ToolbarButton
            icon={Italic}
            command="italic"
            active={selectionState.italic}
            title="Itálico (Ctrl+I)"
          />
          <ToolbarButton
            icon={Underline}
            command="underline"
            active={selectionState.underline}
            title="Sublinhado (Ctrl+U)"
          />
          <ToolbarButton
            icon={Strikethrough}
            command="strikeThrough"
            active={selectionState.strikethrough}
            title="Tachado"
          />

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarButton
            icon={Type}
            command="formatBlock"
            value="p"
            onClick={() => formatBlock('p')}
            title="Parágrafo"
          />
          <ToolbarButton
            icon={Heading1}
            command="formatBlock"
            value="h1"
            onClick={() => formatBlock('h1')}
            title="Título 1"
          />
          <ToolbarButton
            icon={Heading2}
            command="formatBlock"
            value="h2"
            onClick={() => formatBlock('h2')}
            title="Título 2"
          />
          <ToolbarButton
            icon={Heading3}
            command="formatBlock"
            value="h3"
            onClick={() => formatBlock('h3')}
            title="Título 3"
          />

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton
            icon={List}
            command="insertUnorderedList"
            active={selectionState.unorderedList}
            title="Lista"
          />
          <ToolbarButton
            icon={ListOrdered}
            command="insertOrderedList"
            active={selectionState.orderedList}
            title="Lista numerada"
          />

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarButton
            icon={AlignLeft}
            command="justifyLeft"
            title="Alinhar à esquerda"
          />
          <ToolbarButton
            icon={AlignCenter}
            command="justifyCenter"
            title="Centralizar"
          />
          <ToolbarButton
            icon={AlignRight}
            command="justifyRight"
            title="Alinhar à direita"
          />

          <ToolbarDivider />

          {/* Insert */}
          <ToolbarButton
            icon={Link}
            command="createLink"
            onClick={insertLink}
            title="Inserir link"
          />
          <ToolbarButton
            icon={Image}
            command="insertImage"
            onClick={insertImage}
            title="Inserir imagem"
          />
          <ToolbarButton
            icon={Quote}
            command="formatBlock"
            value="blockquote"
            onClick={() => formatBlock('blockquote')}
            title="Citação"
          />
          <ToolbarButton
            icon={Code}
            command="formatBlock"
            value="pre"
            onClick={() => formatBlock('pre')}
            title="Código"
          />

          <ToolbarDivider />

          {/* History */}
          <ToolbarButton
            icon={Undo}
            command="undo"
            title="Desfazer (Ctrl+Z)"
          />
          <ToolbarButton
            icon={Redo}
            command="redo"
            title="Refazer (Ctrl+Shift+Z)"
          />
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onMouseUp={updateSelectionState}
        onKeyUp={updateSelectionState}
        data-placeholder={placeholder}
        className={cn(
          'p-4 outline-none bg-white dark:bg-gray-800',
          'prose prose-sm dark:prose-invert max-w-none',
          'overflow-y-auto',
          readOnly && 'cursor-default',
          !value && 'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400'
        )}
        style={{
          minHeight,
          maxHeight,
        }}
        suppressContentEditableWarning
      />
    </div>
  );
}

// Simple text area with markdown preview
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Escreva em markdown...',
  minHeight = 200,
  className,
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className={cn('border rounded-lg overflow-hidden border-gray-300 dark:border-gray-600', className)}>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setShowPreview(false)}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            !showPreview
              ? 'bg-white dark:bg-gray-800 text-primary-600 border-b-2 border-primary-600'
              : 'bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400'
          )}
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            showPreview
              ? 'bg-white dark:bg-gray-800 text-primary-600 border-b-2 border-primary-600'
              : 'bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400'
          )}
        >
          Visualizar
        </button>
      </div>

      {/* Content */}
      {showPreview ? (
        <div
          className="p-4 prose prose-sm dark:prose-invert max-w-none bg-white dark:bg-gray-800"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(value) }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 bg-white dark:bg-gray-800 resize-none outline-none font-mono text-sm"
          style={{ minHeight }}
        />
      )}
    </div>
  );
}

// Simple markdown to HTML converter (basic support)
function simpleMarkdownToHtml(markdown: string): string {
  return markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br>')
    // Lists
    .replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
}

export default RichTextEditor;

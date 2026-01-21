import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface RichTextDisplayProps {
  content: string;
  className?: string;
  maxLength?: number;
  showReadMore?: boolean;
  onReadMore?: () => void;
}

/**
 * Display rich text content with formatting
 * Supports: bold, italic, links, lists, line breaks
 */
export function RichTextDisplay({
  content,
  className,
  maxLength,
  showReadMore = false,
  onReadMore,
}: RichTextDisplayProps) {
  const processedContent = useMemo(() => {
    let text = content;

    // Truncate if needed
    if (maxLength && text.length > maxLength) {
      text = text.substring(0, maxLength);
      // Don't cut in the middle of a word
      const lastSpace = text.lastIndexOf(' ');
      if (lastSpace > maxLength - 20) {
        text = text.substring(0, lastSpace);
      }
      text += '...';
    }

    // Convert markdown-like formatting to HTML
    return parseContent(text);
  }, [content, maxLength]);

  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <div dangerouslySetInnerHTML={{ __html: processedContent }} />
      {showReadMore && maxLength && content.length > maxLength && (
        <button
          onClick={onReadMore}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-1"
        >
          Ler mais
        </button>
      )}
    </div>
  );
}

/**
 * Parse content and convert formatting to HTML
 */
function parseContent(text: string): string {
  let html = escapeHtml(text);

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Strikethrough: ~~text~~
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

  // Code: `code`
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">$1</code>');

  // Links: [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Auto-link URLs
  html = html.replace(
    /(?<!["\'])(https?:\/\/[^\s<]+)/g,
    '<a href="$1" class="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  // Wrap in paragraph
  html = `<p>${html}</p>`;

  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// Text with highlights
interface HighlightedTextProps {
  text: string;
  highlight: string;
  className?: string;
  highlightClassName?: string;
  caseSensitive?: boolean;
}

export function HighlightedText({
  text,
  highlight,
  className,
  highlightClassName = 'bg-yellow-200 dark:bg-yellow-800',
  caseSensitive = false,
}: HighlightedTextProps) {
  if (!highlight.trim()) {
    return <span className={className}>{text}</span>;
  }

  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(`(${escapeRegExp(highlight)})`, flags);
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = caseSensitive
          ? part === highlight
          : part.toLowerCase() === highlight.toLowerCase();

        return isMatch ? (
          <mark key={index} className={cn('rounded px-0.5', highlightClassName)}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Expandable text
interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  className?: string;
}

export function ExpandableText({
  text,
  maxLines = 3,
  className,
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={className}>
      <p
        className={cn(
          'transition-all',
          !isExpanded && `line-clamp-${maxLines}`
        )}
        style={!isExpanded ? { WebkitLineClamp: maxLines, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' } : undefined}
      >
        {text}
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-1"
      >
        {isExpanded ? 'Ver menos' : 'Ver mais'}
      </button>
    </div>
  );
}

import { useState } from 'react';

// Copy text button
interface CopyTextProps {
  text: string;
  children: React.ReactNode;
  className?: string;
  onCopy?: () => void;
}

export function CopyText({ text, children, className, onCopy }: CopyTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1 transition-colors',
        copied ? 'text-green-600' : 'hover:text-primary-600',
        className
      )}
      title={copied ? 'Copiado!' : 'Copiar'}
    >
      {children}
      {copied && <span className="text-xs">✓</span>}
    </button>
  );
}

// Truncated text with tooltip
interface TruncatedTextProps {
  text: string;
  maxWidth?: number | string;
  className?: string;
}

export function TruncatedText({
  text,
  maxWidth = 200,
  className,
}: TruncatedTextProps) {
  return (
    <span
      className={cn('block truncate', className)}
      style={{ maxWidth }}
      title={text}
    >
      {text}
    </span>
  );
}

// Number with animation
interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (value: number) => string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1000,
  format = (v) => v.toLocaleString('pt-BR'),
  className,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const diff = value - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setDisplayValue(startValue + diff * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span className={className}>{format(Math.round(displayValue))}</span>;
}

import { useEffect } from 'react';

// Text with typing effect
interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export function TypewriterText({
  text,
  speed = 50,
  className,
  onComplete,
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else {
      onComplete?.();
    }
  }, [currentIndex, text, speed, onComplete]);

  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <span className={className}>
      {displayText}
      {currentIndex < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
}

export default RichTextDisplay;

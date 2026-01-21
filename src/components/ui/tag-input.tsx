import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tag {
  id: string;
  label: string;
  color?: string;
}

interface TagInputProps {
  tags: Tag[];
  onChange: (tags: Tag[]) => void;
  suggestions?: Tag[];
  placeholder?: string;
  maxTags?: number;
  allowCustom?: boolean;
  disabled?: boolean;
  className?: string;
  colors?: string[];
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'filled';
}

const DEFAULT_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1',
];

export function TagInput({
  tags,
  onChange,
  suggestions = [],
  placeholder = 'Adicionar tag...',
  maxTags,
  allowCustom = true,
  disabled = false,
  className,
  colors = DEFAULT_COLORS,
  size = 'md',
  variant = 'default',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input
  const filteredSuggestions = suggestions.filter(
    (s) =>
      !tags.some((t) => t.id === s.id) &&
      s.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Get random color
  const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

  // Add tag
  const addTag = useCallback(
    (tag: Tag | string) => {
      if (maxTags && tags.length >= maxTags) return;

      let newTag: Tag;
      if (typeof tag === 'string') {
        const trimmed = tag.trim();
        if (!trimmed) return;
        if (tags.some((t) => t.label.toLowerCase() === trimmed.toLowerCase())) return;

        newTag = {
          id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          label: trimmed,
          color: getRandomColor(),
        };
      } else {
        if (tags.some((t) => t.id === tag.id)) return;
        newTag = tag;
      }

      onChange([...tags, newTag]);
      setInputValue('');
      setSelectedIndex(0);
    },
    [tags, onChange, maxTags, getRandomColor]
  );

  // Remove tag
  const removeTag = useCallback(
    (tagId: string) => {
      onChange(tags.filter((t) => t.id !== tagId));
    },
    [tags, onChange]
  );

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuggestions.length > 0 && showSuggestions) {
        addTag(filteredSuggestions[selectedIndex]);
      } else if (allowCustom && inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1].id);
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Size styles
  const sizeStyles = {
    sm: {
      container: 'min-h-[32px] text-sm',
      tag: 'px-2 py-0.5 text-xs',
      input: 'text-sm',
    },
    md: {
      container: 'min-h-[40px] text-sm',
      tag: 'px-2.5 py-1 text-sm',
      input: 'text-sm',
    },
    lg: {
      container: 'min-h-[48px] text-base',
      tag: 'px-3 py-1.5 text-base',
      input: 'text-base',
    },
  };

  const styles = sizeStyles[size];

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 p-2 rounded-lg border transition-colors',
          variant === 'default' && 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
          variant === 'outline' && 'border-gray-300 dark:border-gray-600 bg-transparent',
          variant === 'filled' && 'border-transparent bg-gray-100 dark:bg-gray-700',
          'focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-900',
          styles.container
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Tags */}
        {tags.map((tag) => (
          <span
            key={tag.id}
            className={cn(
              'inline-flex items-center gap-1 rounded-full font-medium',
              styles.tag
            )}
            style={{
              backgroundColor: tag.color ? `${tag.color}20` : '#e5e7eb',
              color: tag.color || '#374151',
            }}
          >
            {tag.color && (
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
            )}
            <span>{tag.label}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag.id);
                }}
                className="ml-0.5 hover:bg-black/10 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        {/* Input */}
        {(!maxTags || tags.length < maxTags) && !disabled && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
              setSelectedIndex(0);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ''}
            className={cn(
              'flex-1 min-w-[100px] bg-transparent border-none outline-none',
              'placeholder:text-gray-400',
              styles.input
            )}
          />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => addTag(suggestion)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                index === selectedIndex
                  ? 'bg-primary-50 dark:bg-primary-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
            >
              {suggestion.color && (
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: suggestion.color }}
                />
              )}
              <span className="text-gray-900 dark:text-white">{suggestion.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Helper text */}
      {maxTags && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {tags.length}/{maxTags} tags
        </p>
      )}
    </div>
  );
}

// Simple tags display (read-only)
interface TagsDisplayProps {
  tags: Tag[];
  size?: 'sm' | 'md' | 'lg';
  maxVisible?: number;
  className?: string;
}

export function TagsDisplay({ tags, size = 'md', maxVisible, className }: TagsDisplayProps) {
  const visibleTags = maxVisible ? tags.slice(0, maxVisible) : tags;
  const hiddenCount = maxVisible ? Math.max(0, tags.length - maxVisible) : 0;

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  if (tags.length === 0) {
    return (
      <span className="text-gray-400 text-sm">Sem tags</span>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {visibleTags.map((tag) => (
        <span
          key={tag.id}
          className={cn(
            'inline-flex items-center gap-1 rounded-full font-medium',
            sizeStyles[size]
          )}
          style={{
            backgroundColor: tag.color ? `${tag.color}20` : '#e5e7eb',
            color: tag.color || '#374151',
          }}
        >
          {tag.color && (
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
          )}
          <span>{tag.label}</span>
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className={cn('text-gray-500', sizeStyles[size])}>
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}

// Clickable tag button
interface TagButtonProps {
  tag: Tag;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function TagButton({ tag, selected, onClick, size = 'md' }: TagButtonProps) {
  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium transition-all',
        selected
          ? 'ring-2 ring-offset-2 ring-primary-500'
          : 'hover:shadow-md',
        sizeStyles[size]
      )}
      style={{
        backgroundColor: tag.color ? `${tag.color}${selected ? '40' : '20'}` : '#e5e7eb',
        color: tag.color || '#374151',
      }}
    >
      {tag.color && (
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: tag.color }}
        />
      )}
      <span>{tag.label}</span>
    </button>
  );
}

// Tag filter (for filtering lists by tags)
interface TagFilterProps {
  tags: Tag[];
  selectedTags: string[];
  onChange: (selectedIds: string[]) => void;
  multiSelect?: boolean;
  className?: string;
}

export function TagFilter({
  tags,
  selectedTags,
  onChange,
  multiSelect = true,
  className,
}: TagFilterProps) {
  const handleToggle = (tagId: string) => {
    if (multiSelect) {
      if (selectedTags.includes(tagId)) {
        onChange(selectedTags.filter((id) => id !== tagId));
      } else {
        onChange([...selectedTags, tagId]);
      }
    } else {
      if (selectedTags.includes(tagId)) {
        onChange([]);
      } else {
        onChange([tagId]);
      }
    }
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {tags.map((tag) => (
        <TagButton
          key={tag.id}
          tag={tag}
          selected={selectedTags.includes(tag.id)}
          onClick={() => handleToggle(tag.id)}
          size="sm"
        />
      ))}
    </div>
  );
}

export type { Tag };
export default TagInput;

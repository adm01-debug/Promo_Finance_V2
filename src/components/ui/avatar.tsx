import * as React from 'react';
import { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
  '2xl': 'h-20 w-20 text-2xl',
};

const statusClasses = {
  online: 'bg-success',
  offline: 'bg-muted-foreground',
  busy: 'bg-destructive',
  away: 'bg-warning',
};

const statusSizeClasses = {
  xs: 'h-1.5 w-1.5 -right-0 -bottom-0',
  sm: 'h-2 w-2 -right-0 -bottom-0',
  md: 'h-2.5 w-2.5 -right-0.5 -bottom-0.5',
  lg: 'h-3 w-3 -right-0.5 -bottom-0.5',
  xl: 'h-3.5 w-3.5 -right-0.5 -bottom-0.5',
  '2xl': 'h-4 w-4 -right-1 -bottom-1',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-destructive',
    'bg-warning',
    'bg-warning',
    'bg-warning',
    'bg-success',
    'bg-success',
    'bg-success',
    'bg-accent',
    'bg-accent',
    'bg-primary',
    'bg-primary',
    'bg-secondary',
    'bg-secondary',
    'bg-streak',
    'bg-streak',
    'bg-xp',
    'bg-coins',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(function Avatar(
  {
    src,
    alt,
    name,
    size = 'md',
    shape = 'circle',
    status,
    className,
  },
  ref
) {
  const [imageError, setImageError] = useState(false);
  const showImage = src && !imageError;
  const showInitials = !showImage && name;

  return (
    <div ref={ref} className={cn('relative inline-flex', className)}>
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden',
          'bg-muted',
          shape === 'circle' ? 'rounded-full' : 'rounded-lg',
          sizeClasses[size],
          showInitials && getColorFromName(name)
        )}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover"
          />
        ) : showInitials ? (
          <span className="font-medium text-primary-foreground">{getInitials(name)}</span>
        ) : (
          <User className="h-1/2 w-1/2 text-muted-foreground" />
        )}
      </div>

      {status && (
        <span
          className={cn(
            'absolute rounded-full ring-2 ring-background',
            statusClasses[status],
            statusSizeClasses[size]
          )}
        />
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';

// Avatar Group
interface AvatarGroupProps {
  avatars: Array<{
    src?: string;
    name?: string;
    alt?: string;
  }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AvatarGroup({
  avatars,
  max = 5,
  size = 'md',
  className,
}: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  const overlapClasses = {
    xs: '-ml-1.5',
    sm: '-ml-2',
    md: '-ml-2.5',
    lg: '-ml-3',
    xl: '-ml-4',
  };

  return (
    <div className={cn('flex items-center', className)}>
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className={cn(
            'ring-2 ring-background rounded-full',
            index > 0 && overlapClasses[size]
          )}
        >
          <Avatar
            src={avatar.src}
            name={avatar.name}
            alt={avatar.alt}
            size={size}
          />
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={cn(
            'flex items-center justify-center',
            'bg-muted text-muted-foreground',
            'font-medium rounded-full ring-2 ring-background',
            sizeClasses[size],
            overlapClasses[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

// Avatar with Name
interface AvatarWithNameProps extends Omit<AvatarProps, 'size'> {
  name: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  reverse?: boolean;
}

export function AvatarWithName({
  name,
  subtitle,
  size = 'md',
  reverse = false,
  ...avatarProps
}: AvatarWithNameProps) {
  const textSizes = {
    sm: { name: 'text-sm', subtitle: 'text-xs' },
    md: { name: 'text-base', subtitle: 'text-sm' },
    lg: { name: 'text-lg', subtitle: 'text-base' },
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3',
        reverse && 'flex-row-reverse'
      )}
    >
      <Avatar name={name} size={size} {...avatarProps} />
      <div className={reverse ? 'text-right' : ''}>
        <p className={cn('font-medium text-foreground', textSizes[size].name)}>
          {name}
        </p>
        {subtitle && (
          <p className={cn('text-muted-foreground', textSizes[size].subtitle)}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// Compatibilidade com shadcn/ui Avatar API
interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
}

export function AvatarImage({ src, alt, className, ...props }: AvatarImageProps) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      className={cn('aspect-square h-full w-full object-cover', className)}
      {...props}
    />
  );
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  delayMs?: number;
}

export function AvatarFallback({ children, className, ...props }: AvatarFallbackProps) {
  return (
    <span
      className={cn(
        'flex h-full w-full items-center justify-center bg-muted font-medium',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Re-export for compatibility
export { Avatar as AvatarRoot };
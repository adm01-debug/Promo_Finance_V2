import { cn } from '@/lib/utils';

interface AvatarItem {
  id: string;
  name: string;
  image?: string;
  color?: string;
}

interface AvatarGroupProps {
  items: AvatarItem[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

const overlapClasses = {
  sm: '-ml-2',
  md: '-ml-3',
  lg: '-ml-4',
};

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getRandomColor(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];

  // Simple hash to consistently get same color for same name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function AvatarGroup({
  items,
  max = 4,
  size = 'md',
  className,
}: AvatarGroupProps) {
  const visibleItems = items.slice(0, max);
  const remainingCount = items.length - max;

  return (
    <div className={cn('flex items-center', className)}>
      {visibleItems.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            'relative rounded-full ring-2 ring-white dark:ring-gray-800',
            sizeClasses[size],
            index > 0 && overlapClasses[size]
          )}
          style={{ zIndex: visibleItems.length - index }}
          title={item.name}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div
              className={cn(
                'w-full h-full rounded-full flex items-center justify-center text-white font-medium',
                item.color || getRandomColor(item.name)
              )}
            >
              {getInitials(item.name)}
            </div>
          )}
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={cn(
            'relative rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium',
            sizeClasses[size],
            overlapClasses[size]
          )}
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

// Single avatar component
interface AvatarProps {
  name: string;
  image?: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const singleSizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

export function Avatar({
  name,
  image,
  color,
  size = 'md',
  className,
}: AvatarProps) {
  return (
    <div
      className={cn(
        'relative rounded-full',
        singleSizeClasses[size],
        className
      )}
      title={name}
    >
      {image ? (
        <img
          src={image}
          alt={name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div
          className={cn(
            'w-full h-full rounded-full flex items-center justify-center text-white font-medium',
            color || getRandomColor(name)
          )}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}

// Avatar with status indicator
interface AvatarWithStatusProps extends AvatarProps {
  status?: 'online' | 'offline' | 'away' | 'busy';
}

const statusClasses = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
};

export function AvatarWithStatus({
  status,
  ...props
}: AvatarWithStatusProps) {
  return (
    <div className="relative inline-block">
      <Avatar {...props} />
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white dark:ring-gray-800',
            statusClasses[status]
          )}
        />
      )}
    </div>
  );
}

export default AvatarGroup;

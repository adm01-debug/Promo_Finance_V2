import { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

// Container widths
type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'prose';

interface ContainerProps {
  children: ReactNode;
  size?: ContainerSize;
  centered?: boolean;
  padding?: boolean | 'x' | 'y' | 'none';
  className?: string;
}

const containerSizes: Record<ContainerSize, string> = {
  sm: 'max-w-screen-sm',     // 640px
  md: 'max-w-screen-md',     // 768px
  lg: 'max-w-screen-lg',     // 1024px
  xl: 'max-w-screen-xl',     // 1280px
  '2xl': 'max-w-screen-2xl', // 1536px
  full: 'max-w-full',
  prose: 'max-w-prose',      // 65ch
};

export function Container({
  children,
  size = 'xl',
  centered = true,
  padding = true,
  className,
}: ContainerProps) {
  return (
    <div
      className={cn(
        containerSizes[size],
        centered && 'mx-auto',
        padding === true && 'px-4 sm:px-6 lg:px-8',
        padding === 'x' && 'px-4 sm:px-6 lg:px-8',
        padding === 'y' && 'py-4 sm:py-6 lg:py-8',
        className
      )}
    >
      {children}
    </div>
  );
}

// Grid system
type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 12;
type GridGap = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface GridProps {
  children: ReactNode;
  cols?: GridColumns | { sm?: GridColumns; md?: GridColumns; lg?: GridColumns; xl?: GridColumns };
  gap?: GridGap;
  rowGap?: GridGap;
  colGap?: GridGap;
  className?: string;
}

const gapSizes: Record<GridGap, string> = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const colClasses: Record<GridColumns, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
};

export function Grid({
  children,
  cols = 1,
  gap = 'md',
  rowGap,
  colGap,
  className,
}: GridProps) {
  const getColsClass = () => {
    if (typeof cols === 'number') {
      return colClasses[cols];
    }

    const classes: string[] = [];
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    return classes.join(' ') || 'grid-cols-1';
  };

  return (
    <div
      className={cn(
        'grid',
        getColsClass(),
        !rowGap && !colGap && gapSizes[gap],
        rowGap && `row-gap-${rowGap === 'none' ? '0' : rowGap === 'sm' ? '2' : rowGap === 'md' ? '4' : rowGap === 'lg' ? '6' : '8'}`,
        colGap && `col-gap-${colGap === 'none' ? '0' : colGap === 'sm' ? '2' : colGap === 'md' ? '4' : colGap === 'lg' ? '6' : '8'}`,
        className
      )}
    >
      {children}
    </div>
  );
}

// Flex container
type FlexDirection = 'row' | 'col' | 'row-reverse' | 'col-reverse';
type FlexAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
type FlexJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
type FlexWrap = 'wrap' | 'nowrap' | 'wrap-reverse';

interface FlexProps {
  children: ReactNode;
  direction?: FlexDirection;
  align?: FlexAlign;
  justify?: FlexJustify;
  wrap?: FlexWrap;
  gap?: GridGap;
  inline?: boolean;
  className?: string;
}

const directionClasses: Record<FlexDirection, string> = {
  row: 'flex-row',
  col: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'col-reverse': 'flex-col-reverse',
};

const alignClasses: Record<FlexAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const justifyClasses: Record<FlexJustify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const wrapClasses: Record<FlexWrap, string> = {
  wrap: 'flex-wrap',
  nowrap: 'flex-nowrap',
  'wrap-reverse': 'flex-wrap-reverse',
};

export function Flex({
  children,
  direction = 'row',
  align = 'stretch',
  justify = 'start',
  wrap = 'nowrap',
  gap = 'none',
  inline = false,
  className,
}: FlexProps) {
  return (
    <div
      className={cn(
        inline ? 'inline-flex' : 'flex',
        directionClasses[direction],
        alignClasses[align],
        justifyClasses[justify],
        wrapClasses[wrap],
        gapSizes[gap],
        className
      )}
    >
      {children}
    </div>
  );
}

// Stack (vertical flex)
interface StackProps {
  children: ReactNode;
  gap?: GridGap;
  align?: FlexAlign;
  className?: string;
}

export function Stack({ children, gap = 'md', align = 'stretch', className }: StackProps) {
  return (
    <Flex direction="col" gap={gap} align={align} className={className}>
      {children}
    </Flex>
  );
}

// HStack (horizontal flex)
interface HStackProps {
  children: ReactNode;
  gap?: GridGap;
  align?: FlexAlign;
  justify?: FlexJustify;
  wrap?: boolean;
  className?: string;
}

export function HStack({
  children,
  gap = 'md',
  align = 'center',
  justify = 'start',
  wrap = false,
  className,
}: HStackProps) {
  return (
    <Flex
      direction="row"
      gap={gap}
      align={align}
      justify={justify}
      wrap={wrap ? 'wrap' : 'nowrap'}
      className={className}
    >
      {children}
    </Flex>
  );
}

// Center (centered content)
interface CenterProps {
  children: ReactNode;
  className?: string;
}

export function Center({ children, className }: CenterProps) {
  return (
    <Flex align="center" justify="center" className={className}>
      {children}
    </Flex>
  );
}

// Spacer (flexible space)
interface SpacerProps {
  size?: number | string;
  axis?: 'horizontal' | 'vertical';
}

export function Spacer({ size, axis }: SpacerProps) {
  const style: CSSProperties = {};
  
  if (size) {
    if (axis === 'horizontal') {
      style.width = typeof size === 'number' ? `${size}px` : size;
      style.minWidth = style.width;
    } else if (axis === 'vertical') {
      style.height = typeof size === 'number' ? `${size}px` : size;
      style.minHeight = style.height;
    } else {
      style.flexGrow = 1;
    }
  } else {
    style.flexGrow = 1;
  }

  return <div style={style} />;
}

// Box (generic wrapper)
interface BoxProps {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  bg?: 'white' | 'gray' | 'primary' | 'transparent';
  className?: string;
}

const paddingSizes: Record<string, string> = {
  none: 'p-0',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

const marginSizes: Record<string, string> = {
  none: 'm-0',
  sm: 'm-2',
  md: 'm-4',
  lg: 'm-6',
  xl: 'm-8',
  auto: 'm-auto',
};

const roundedSizes: Record<string, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

const shadowSizes: Record<string, string> = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
};

const bgColors: Record<string, string> = {
  white: 'bg-card',
  gray: 'bg-muted',
  primary: 'bg-primary/5',
  transparent: 'bg-transparent',
};
...
        bgColors[bg],
        border && 'border border-border',
        className
      )}
    >
      {children}
    </div>
  );
}

// Aspect ratio box
interface AspectRatioProps {
  children: ReactNode;
  ratio?: number | '16/9' | '4/3' | '1/1' | '21/9';
  className?: string;
}

export function AspectRatio({ children, ratio = '16/9', className }: AspectRatioProps) {
  const ratioValue = typeof ratio === 'number'
    ? ratio
    : ratio === '16/9' ? 16 / 9
    : ratio === '4/3' ? 4 / 3
    : ratio === '21/9' ? 21 / 9
    : 1;

  return (
    <div className={cn('relative w-full', className)} style={{ paddingBottom: `${100 / ratioValue}%` }}>
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

// Responsive visibility
interface ShowProps {
  children: ReactNode;
  above?: 'sm' | 'md' | 'lg' | 'xl';
  below?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Show({ children, above, below }: ShowProps) {
  let className = '';

  if (above) {
    className = `hidden ${above}:block`;
  } else if (below) {
    className = `block ${below}:hidden`;
  }

  return <div className={className}>{children}</div>;
}

// Hide component
export function Hide({ children, above, below }: ShowProps) {
  let className = '';

  if (above) {
    className = `block ${above}:hidden`;
  } else if (below) {
    className = `hidden ${below}:block`;
  }

  return <div className={className}>{children}</div>;
}

export default Container;

/**
 * Skeleton Loaders Personalizados
 * Loading states específicos para cada tipo de conteúdo
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================
// Base Skeleton with animation variants
// ============================================
interface AnimatedSkeletonProps {
  className?: string;
  variant?: 'pulse' | 'shimmer' | 'wave';
}

export function AnimatedSkeleton({ className, variant = 'pulse' }: AnimatedSkeletonProps) {
  const variantClasses = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]',
    wave: 'animate-wave',
  };

  return (
    <div className={cn('bg-muted rounded', variantClasses[variant], className)} />
  );
}

// ============================================
// KPI Card Skeleton
// ============================================
export function KPICardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================
// Table Skeleton
// ============================================
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export function TableSkeleton({ rows = 5, columns = 5, showHeader = true }: TableSkeletonProps) {
  return (
    <div className="w-full">
      {showHeader && (
        <div className="flex gap-4 p-4 border-b bg-muted/30">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton 
              key={i} 
              className="h-4" 
              style={{ width: `${100 / columns}%` }} 
            />
          ))}
        </div>
      )}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                className="h-5" 
                style={{ 
                  width: colIndex === 0 ? '40%' : `${60 / (columns - 1)}%`,
                }} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Chart Skeleton
// ============================================
interface ChartSkeletonProps {
  type?: 'bar' | 'line' | 'pie' | 'area';
  height?: number;
}

export function ChartSkeleton({ type = 'bar', height = 300 }: ChartSkeletonProps) {
  if (type === 'pie') {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <div className="relative">
            <Skeleton className="h-48 w-48 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-24 w-24 rounded-full bg-background" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent style={{ height }}>
        <div className="flex items-end justify-between gap-2 h-full pb-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className="flex-1 rounded-t"
              style={{ 
                height: `${Math.random() * 60 + 20}%`,
              }} 
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// List Item Skeleton
// ============================================
interface ListSkeletonProps {
  count?: number;
  showAvatar?: boolean;
  showBadge?: boolean;
}

export function ListSkeleton({ count = 5, showAvatar = true, showBadge = false }: ListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20" />
            {showBadge && <Skeleton className="h-5 w-16 rounded-full" />}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Form Skeleton
// ============================================
interface FormSkeletonProps {
  fields?: number;
  showTitle?: boolean;
}

export function FormSkeleton({ fields = 4, showTitle = true }: FormSkeletonProps) {
  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      )}
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

// ============================================
// Dashboard Skeleton
// ============================================
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* KPIs */}
      <KPICardSkeleton count={4} />

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton type="bar" />
        <ChartSkeleton type="pie" />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={5} columns={6} />
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Profile/Settings Skeleton
// ============================================
export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================
// Card Grid Skeleton
// ============================================
interface CardGridSkeletonProps {
  count?: number;
  columns?: 2 | 3 | 4;
}

export function CardGridSkeleton({ count = 6, columns = 3 }: CardGridSkeletonProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns])}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex justify-between pt-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================
// Stats Row Skeleton
// ============================================
export function StatsRowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0 p-4 rounded-lg border bg-card min-w-[200px]">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-7 w-24 mb-1" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

// ============================================
// Timeline Skeleton
// ============================================
export function TimelineSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Skeleton className="h-3 w-3 rounded-full" />
            {i < count - 1 && <Skeleton className="w-0.5 h-full min-h-[60px]" />}
          </div>
          <div className="flex-1 pb-4">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Comment/Message Skeleton
// ============================================
export function MessageSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn('flex gap-3', i % 2 === 1 && 'flex-row-reverse')}>
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className={cn('space-y-2 max-w-[70%]', i % 2 === 1 && 'items-end')}>
            <Skeleton className="h-4 w-20" />
            <Skeleton 
              className="h-16 rounded-lg" 
              style={{ width: `${Math.random() * 40 + 60}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

import React from 'react';

export interface TypographySpec {
  name: string;
  size: string;
  px: string;
  weight: string;
  family: string;
  lh: string;
  usage: string;
}

export interface ColorTokenSpec {
  name: string;
  value: string;
  status: string;
  hex: string;
}

export interface SpacingSpec {
  name: string;
  value: string;
  px: string;
  token: string;
}

export interface AuditResultsState {
  typography: TypographySpec[];
  colors: ColorTokenSpec[];
  spacing: SpacingSpec[];
  violations: number;
  score: number;
  scanning: boolean;
  fontFamilies?: string[];
}

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'warning';
}

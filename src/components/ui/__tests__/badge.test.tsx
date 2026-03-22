import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Badge } from '../badge';

describe('Badge', () => {
  it('renders with children', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('renders default variant with bg-primary', () => {
    render(<Badge>Primary</Badge>);
    expect(screen.getByText('Primary')).toHaveClass('bg-primary');
  });

  it('renders secondary variant', () => {
    render(<Badge variant="secondary">Secondary</Badge>);
    expect(screen.getByText('Secondary')).toHaveClass('bg-secondary');
  });

  it('renders destructive variant', () => {
    render(<Badge variant="destructive">Destructive</Badge>);
    expect(screen.getByText('Destructive')).toHaveClass('bg-destructive');
  });

  it('renders outline variant', () => {
    render(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText('Outline')).toHaveClass('text-foreground');
  });

  it('renders success variant', () => {
    render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toHaveClass('text-success');
  });

  it('renders warning variant', () => {
    render(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText('Warning')).toHaveClass('text-warning');
  });

  it('renders removable badge with X button', () => {
    const onRemove = vi.fn();
    render(<Badge removable onRemove={onRemove}>Removable</Badge>);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(onRemove).toHaveBeenCalled();
  });

  it('does not render remove button without removable', () => {
    render(<Badge>No remove</Badge>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Badge className="custom">Custom</Badge>);
    expect(screen.getByText('Custom')).toHaveClass('custom');
  });

  it('has rounded-full class', () => {
    render(<Badge>Rounded</Badge>);
    expect(screen.getByText('Rounded')).toHaveClass('rounded-full');
  });

  it('has text-xs font-semibold', () => {
    render(<Badge>Styled</Badge>);
    const el = screen.getByText('Styled');
    expect(el).toHaveClass('text-xs');
    expect(el).toHaveClass('font-semibold');
  });
});

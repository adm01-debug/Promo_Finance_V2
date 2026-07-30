import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from '../alert';

describe('Alert', () => {
  it('renders with children', () => {
    render(<Alert>Alert message</Alert>);
    expect(screen.getByText('Alert message')).toBeInTheDocument();
  });

  it('has role="alert"', () => {
    render(<Alert>Accessible</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders default variant with bg-muted', () => {
    const { container } = render(<Alert>Default</Alert>);
    expect(container.firstChild).toHaveClass('bg-muted');
  });

  it('renders info variant', () => {
    const { container } = render(<Alert variant="info">Info</Alert>);
    expect(container.firstChild).toHaveClass('bg-primary/10');
  });

  it('renders success variant', () => {
    const { container } = render(<Alert variant="success">Success</Alert>);
    expect(container.firstChild).toHaveClass('bg-success/10');
  });

  it('renders warning variant', () => {
    const { container } = render(<Alert variant="warning">Warning</Alert>);
    expect(container.firstChild).toHaveClass('bg-warning/10');
  });

  it('renders error variant', () => {
    const { container } = render(<Alert variant="error">Error</Alert>);
    expect(container.firstChild).toHaveClass('bg-destructive/10');
  });

  it('renders title prop', () => {
    render(<Alert title="My Title">Content</Alert>);
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('renders close button when onClose provided', () => {
    const onClose = vi.fn();
    render(<Alert onClose={onClose}>Closable</Alert>);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render close button without onClose', () => {
    render(<Alert>No close</Alert>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Alert className="custom-alert">Custom</Alert>);
    expect(container.firstChild).toHaveClass('custom-alert');
  });
});

describe('AlertTitle', () => {
  it('renders text with font-medium', () => {
    render(<AlertTitle>Title</AlertTitle>);
    expect(screen.getByText('Title')).toHaveClass('font-medium');
  });
});

describe('AlertDescription', () => {
  it('renders text with text-sm', () => {
    render(<AlertDescription>Desc</AlertDescription>);
    expect(screen.getByText('Desc')).toHaveClass('text-sm');
  });
});

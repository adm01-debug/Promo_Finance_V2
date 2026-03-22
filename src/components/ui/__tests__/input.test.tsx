import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../input';

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders default variant with border', () => {
    const { container } = render(<Input placeholder="test" />);
    expect(container.querySelector('input')).toHaveClass('border');
  });

  it('renders filled variant', () => {
    render(<Input variant="filled" placeholder="filled" />);
    expect(screen.getByPlaceholderText('filled')).toHaveClass('bg-muted');
  });

  it('renders underline variant', () => {
    render(<Input variant="underline" placeholder="under" />);
    expect(screen.getByPlaceholderText('under')).toHaveClass('border-b-2');
  });

  it('renders sm size', () => {
    render(<Input inputSize="sm" placeholder="sm" />);
    expect(screen.getByPlaceholderText('sm')).toHaveClass('h-8');
  });

  it('renders lg size', () => {
    render(<Input inputSize="lg" placeholder="lg" />);
    expect(screen.getByPlaceholderText('lg')).toHaveClass('h-12');
  });

  it('renders error state', () => {
    render(<Input error placeholder="err" />);
    expect(screen.getByPlaceholderText('err')).toHaveClass('border-destructive');
  });

  it('renders success state', () => {
    render(<Input success placeholder="ok" />);
    expect(screen.getByPlaceholderText('ok')).toHaveClass('border-success');
  });

  it('handles onChange', () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} placeholder="test" />);
    fireEvent.change(screen.getByPlaceholderText('test'), { target: { value: 'hi' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('can be disabled', () => {
    render(<Input disabled placeholder="disabled" />);
    expect(screen.getByPlaceholderText('disabled')).toBeDisabled();
  });

  it('supports type attribute', () => {
    render(<Input type="email" placeholder="email" />);
    expect(screen.getByPlaceholderText('email')).toHaveAttribute('type', 'email');
  });

  it('applies custom className', () => {
    render(<Input className="custom" placeholder="custom" />);
    expect(screen.getByPlaceholderText('custom')).toHaveClass('custom');
  });

  it('forwards ref', () => {
    const ref = vi.fn();
    render(<Input ref={ref} placeholder="ref" />);
    expect(ref).toHaveBeenCalled();
  });

  it('supports controlled value', () => {
    render(<Input value="controlled" onChange={() => {}} placeholder="ctrl" />);
    expect(screen.getByPlaceholderText('ctrl')).toHaveValue('controlled');
  });
});

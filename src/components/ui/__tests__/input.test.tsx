import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText(/enter text/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('renders different types', () => {
    const { rerender } = render(<Input type="email" placeholder="email" />);
    expect(screen.getByPlaceholderText(/email/i)).toHaveAttribute('type', 'email');

    rerender(<Input type="password" placeholder="password" />);
    expect(screen.getByPlaceholderText(/password/i)).toHaveAttribute('type', 'password');

    rerender(<Input type="number" placeholder="number" />);
    expect(screen.getByPlaceholderText(/number/i)).toHaveAttribute('type', 'number');
  });

  it('handles value changes', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} placeholder="test" />);
    
    const input = screen.getByPlaceholderText(/test/i);
    fireEvent.change(input, { target: { value: 'new value' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('handles blur events', () => {
    const handleBlur = vi.fn();
    render(<Input onBlur={handleBlur} placeholder="test" />);
    
    const input = screen.getByPlaceholderText(/test/i);
    fireEvent.blur(input);
    
    expect(handleBlur).toHaveBeenCalled();
  });

  it('can be disabled', () => {
    render(<Input disabled placeholder="disabled" />);
    expect(screen.getByPlaceholderText(/disabled/i)).toBeDisabled();
  });

  it('can be read-only', () => {
    render(<Input readOnly placeholder="readonly" />);
    expect(screen.getByPlaceholderText(/readonly/i)).toHaveAttribute('readonly');
  });

  it('renders with error state', () => {
    render(<Input error placeholder="error" />);
    expect(screen.getByPlaceholderText(/error/i)).toHaveClass('border-red-500');
  });

  it('renders with icon', () => {
    const Icon = () => <svg data-testid="test-icon" />;
    render(<Input icon={<Icon />} placeholder="with icon" />);
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders with left addon', () => {
    render(<Input leftAddon="$" placeholder="with addon" />);
    expect(screen.getByText('$')).toBeInTheDocument();
  });

  it('renders with right addon', () => {
    render(<Input rightAddon=".com" placeholder="with addon" />);
    expect(screen.getByText('.com')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" placeholder="custom" />);
    expect(screen.getByPlaceholderText(/custom/i)).toHaveClass('custom-class');
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Input size="sm" placeholder="small" />);
    expect(screen.getByPlaceholderText(/small/i)).toHaveClass('py-1');

    rerender(<Input size="lg" placeholder="large" />);
    expect(screen.getByPlaceholderText(/large/i)).toHaveClass('py-3');
  });

  it('supports controlled value', () => {
    const { rerender } = render(<Input value="initial" onChange={() => {}} placeholder="controlled" />);
    expect(screen.getByPlaceholderText(/controlled/i)).toHaveValue('initial');

    rerender(<Input value="updated" onChange={() => {}} placeholder="controlled" />);
    expect(screen.getByPlaceholderText(/controlled/i)).toHaveValue('updated');
  });

  it('supports uncontrolled with defaultValue', () => {
    render(<Input defaultValue="default" placeholder="uncontrolled" />);
    expect(screen.getByPlaceholderText(/uncontrolled/i)).toHaveValue('default');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Input ref={ref} placeholder="ref" />);
    expect(ref).toHaveBeenCalled();
  });

  it('supports name attribute', () => {
    render(<Input name="test-input" placeholder="named" />);
    expect(screen.getByPlaceholderText(/named/i)).toHaveAttribute('name', 'test-input');
  });

  it('supports required attribute', () => {
    render(<Input required placeholder="required" />);
    expect(screen.getByPlaceholderText(/required/i)).toBeRequired();
  });

  it('supports maxLength attribute', () => {
    render(<Input maxLength={10} placeholder="maxlength" />);
    expect(screen.getByPlaceholderText(/maxlength/i)).toHaveAttribute('maxLength', '10');
  });

  it('supports min and max for number type', () => {
    render(<Input type="number" min={0} max={100} placeholder="number" />);
    const input = screen.getByPlaceholderText(/number/i);
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
  });
});

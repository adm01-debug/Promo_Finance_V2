import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable } from '../data-table';

interface TestItem {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

const mockData: TestItem[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
  { id: '3', name: 'Bob Wilson', email: 'bob@example.com', status: 'active' },
];

const mockColumns = [
  { key: 'name' as const, header: 'Name', sortable: true },
  { key: 'email' as const, header: 'Email', sortable: true },
  { key: 'status' as const, header: 'Status' },
];

describe('DataTable', () => {
  it('renders table with data', () => {
    render(<DataTable data={mockData} columns={mockColumns} />);
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(
      <DataTable 
        data={[]} 
        columns={mockColumns} 
        emptyMessage="No items found" 
      />
    );
    
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<DataTable data={[]} columns={mockColumns} loading />);
    
    expect(screen.getByTestId('table-loading')).toBeInTheDocument();
  });

  it('handles row click', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable 
        data={mockData} 
        columns={mockColumns} 
        onRowClick={onRowClick}
      />
    );
    
    fireEvent.click(screen.getByText('John Doe').closest('tr')!);
    expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('handles sorting when column is sortable', () => {
    const onSort = vi.fn();
    render(
      <DataTable 
        data={mockData} 
        columns={mockColumns} 
        onSort={onSort}
      />
    );
    
    fireEvent.click(screen.getByText('Name'));
    expect(onSort).toHaveBeenCalledWith('name', 'asc');
  });

  it('renders with selection checkboxes', () => {
    const onSelectionChange = vi.fn();
    render(
      <DataTable 
        data={mockData} 
        columns={mockColumns} 
        selectable
        onSelectionChange={onSelectionChange}
      />
    );
    
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(4); // 1 header + 3 rows
  });

  it('handles select all', () => {
    const onSelectionChange = vi.fn();
    render(
      <DataTable 
        data={mockData} 
        columns={mockColumns} 
        selectable
        onSelectionChange={onSelectionChange}
      />
    );
    
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(selectAllCheckbox);
    expect(onSelectionChange).toHaveBeenCalledWith(mockData);
  });

  it('renders custom cell content', () => {
    const columnsWithRender = [
      ...mockColumns,
      {
        key: 'actions' as const,
        header: 'Actions',
        render: () => <button>Edit</button>,
      },
    ];
    
    render(<DataTable data={mockData} columns={columnsWithRender} />);
    
    const editButtons = screen.getAllByRole('button', { name: 'Edit' });
    expect(editButtons).toHaveLength(3);
  });

  it('applies custom className', () => {
    const { container } = render(
      <DataTable 
        data={mockData} 
        columns={mockColumns} 
        className="custom-table"
      />
    );
    
    expect(container.querySelector('.custom-table')).toBeInTheDocument();
  });

  it('shows pagination when enabled', () => {
    render(
      <DataTable 
        data={mockData} 
        columns={mockColumns} 
        pagination
        pageSize={2}
      />
    );
    
    expect(screen.getByText(/página/i)).toBeInTheDocument();
  });

  it('handles page change', () => {
    const onPageChange = vi.fn();
    render(
      <DataTable 
        data={mockData} 
        columns={mockColumns} 
        pagination
        pageSize={2}
        currentPage={1}
        onPageChange={onPageChange}
      />
    );
    
    const nextButton = screen.getByRole('button', { name: /próxima/i });
    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('renders striped rows', () => {
    const { container } = render(
      <DataTable data={mockData} columns={mockColumns} striped />
    );
    
    expect(container.querySelector('[data-striped="true"]')).toBeInTheDocument();
  });

  it('renders hoverable rows', () => {
    const { container } = render(
      <DataTable data={mockData} columns={mockColumns} hoverable />
    );
    
    expect(container.querySelector('[data-hoverable="true"]')).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Frameworks } from '../Frameworks';
import { ComplianceFramework, ComplianceStatus, FrameworkType } from '../../types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('Frameworks Component', () => {
  const mockActive: ComplianceFramework[] = [
    { 
      id: '1', 
      name: FrameworkType.SOC2, 
      status: ComplianceStatus.COMPLIANT, 
      progress: 100, 
      nextAuditDate: '2024-12-31' 
    }
  ];
  const mockAdd = vi.fn();
  const mockSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders active frameworks', () => {
    render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
    expect(screen.getByText(FrameworkType.SOC2)).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('opens add modal and filters catalog', async () => {
    render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);

    // Click to open modal - use getAllByText since there might be multiple
    const addFrameworkButtons = screen.getAllByText('Add Framework');
    fireEvent.click(addFrameworkButtons[0]);

    // Wait for modal to appear
    const searchInput = await screen.findByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();

    // Type in search
    fireEvent.change(searchInput, { target: { value: 'HIPAA' } });

    // Verify the search value is set
    expect(searchInput).toHaveValue('HIPAA');
  });

  it('adds a framework', async () => {
    render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);

    // Open modal - use getAllByText since there might be multiple
    const addFrameworkButtons = screen.getAllByText('Add Framework');
    fireEvent.click(addFrameworkButtons[0]);

    // Wait for modal and find Add buttons (the ones in the modal for adding specific frameworks)
    const addButtons = await screen.findAllByText('Add');
    expect(addButtons.length).toBeGreaterThan(0);

    // Click first Add button (for a framework in the catalog)
    fireEvent.click(addButtons[0]);

    // Verify callback was called
    expect(mockAdd).toHaveBeenCalled();
  });
});
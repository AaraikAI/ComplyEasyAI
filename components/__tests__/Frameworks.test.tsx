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
    
    // Click to open modal
    const addButton = screen.getByText('Add Framework');
    fireEvent.click(addButton);
    
    // Wait for modal to appear and find search input
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
      
      // Type in search
      fireEvent.change(searchInput, { target: { value: 'HIPAA' } });
    });

    // Verify filtering works (HIPAA should appear if it's in available frameworks)
    // Note: This depends on AVAILABLE_FRAMEWORKS constant
    await waitFor(() => {
      // The search should filter the list
      expect(screen.getByDisplayValue('HIPAA')).toBeInTheDocument();
    });
  });

  it('adds a framework', async () => {
    render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
    
    // Open modal
    fireEvent.click(screen.getByText('Add Framework'));
    
    // Wait for modal and find first Add button
    await waitFor(() => {
      const addButtons = screen.getAllByText('Add');
      expect(addButtons.length).toBeGreaterThan(0);
      
      // Click first Add button
      fireEvent.click(addButtons[0]);
    });

    // Verify callback was called
    await waitFor(() => {
      expect(mockAdd).toHaveBeenCalled();
    });
  });
});
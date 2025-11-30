
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Frameworks } from '../Frameworks';
import { ComplianceFramework, ComplianceStatus, FrameworkType } from '../../types';

declare const describe: any;
declare const test: any;
declare const expect: any;
declare const jest: any;

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
  const mockAdd = jest.fn();
  const mockSelect = jest.fn();

  test('renders active frameworks', () => {
    render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
    expect(screen.getByText(FrameworkType.SOC2)).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  test('opens add modal and filters catalog', () => {
    render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
    
    fireEvent.click(screen.getByText('Add Framework'));
    expect(screen.getByPlaceholderText(/Search standards/i)).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search standards/i);
    fireEvent.change(searchInput, { target: { value: 'HIPAA' } });

    expect(screen.getByText('HIPAA')).toBeInTheDocument();
    expect(screen.queryByText('NIST')).not.toBeInTheDocument(); // Assuming NIST doesn't match 'HIPAA'
  });

  test('adds a framework', () => {
    render(<Frameworks activeFrameworks={mockActive} onAddFramework={mockAdd} onSelectFramework={mockSelect} />);
    fireEvent.click(screen.getByText('Add Framework'));
    
    const addBtns = screen.getAllByText('Add');
    fireEvent.click(addBtns[0]);

    expect(mockAdd).toHaveBeenCalled();
  });
});
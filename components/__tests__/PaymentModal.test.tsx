
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentModal } from '../PaymentModal';
import { api } from '../../services/api';

declare const describe: any;
declare const test: any;
declare const expect: any;
declare const jest: any;

jest.mock('../../services/api', () => ({
  api: {
    billing: { upgrade: jest.fn().mockResolvedValue({ success: true }) }
  }
}));

describe('PaymentModal Component', () => {
  const mockClose = jest.fn();
  const mockSuccess = jest.fn();

  test('renders correctly', () => {
    render(<PaymentModal plan="Pro" price="$200" onClose={mockClose} onSuccess={mockSuccess} />);
    expect(screen.getByText('Secure Checkout')).toBeInTheDocument();
    expect(screen.getByText('Pay $200')).toBeInTheDocument();
  });

  test('formats card input', () => {
    render(<PaymentModal plan="Pro" price="$200" onClose={mockClose} onSuccess={mockSuccess} />);
    const input = screen.getByPlaceholderText('0000 0000 0000 0000');
    fireEvent.change(input, { target: { value: '1234567812345678' } });
    expect(input).toHaveValue('1234 5678 1234 5678');
  });

  test('submits payment successfully', async () => {
    render(<PaymentModal plan="Pro" price="$200" onClose={mockClose} onSuccess={mockSuccess} />);
    
    // Fill form
    fireEvent.change(screen.getByPlaceholderText('0000 0000 0000 0000'), { target: { value: '4242424242424242' } });
    fireEvent.change(screen.getByPlaceholderText('MM / YY'), { target: { value: '12/30' } });
    fireEvent.change(screen.getByPlaceholderText('123'), { target: { value: '123' } });

    fireEvent.click(screen.getByText('Pay $200'));

    await waitFor(() => {
      expect(screen.getByText('Payment Successful')).toBeInTheDocument();
    });
    
    // Wait for timeout closure
    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    }, { timeout: 2500 });
  });
});
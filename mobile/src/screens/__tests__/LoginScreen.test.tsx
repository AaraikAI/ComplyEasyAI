/**
 * LoginScreen Tests
 *
 * Tests form validation, login submission, error display,
 * and loading state rendering.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';

// ============================================================================
// MOCKS
// ============================================================================

const mockLogin = jest.fn();
const mockClearError = jest.fn();

let mockAuthState = {
  isLoading: false,
  error: null as string | null,
  isAuthenticated: false,
  user: null,
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    ...mockAuthState,
    login: mockLogin,
    clearError: mockClearError,
    logout: jest.fn(),
    refreshUser: jest.fn(),
    updateUser: jest.fn(),
  }),
}));

jest.mock('../../components/shared', () => {
  const { Text, TouchableOpacity, View } = require('react-native');
  return {
    Button: ({ label, onPress, loading, disabled, ...props }: any) => (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        testID="login-button"
        accessibilityRole="button"
      >
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
    colors: {
      background: '#fff',
      surface: '#f5f5f5',
      primary: '#0066cc',
      border: '#e0e0e0',
      danger: '#d32f2f',
      dangerLight: '#fce4ec',
      gray400: '#9e9e9e',
      textPrimary: '#212121',
      textSecondary: '#757575',
      textTertiary: '#9e9e9e',
      white: '#fff',
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 },
    fontSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 20, xxl: 24, xxxl: 28 },
    borderRadius: { sm: 4, md: 8, lg: 12, xl: 16 },
  };
});

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

import { Alert } from 'react-native';

beforeEach(() => {
  jest.clearAllMocks();
  mockLogin.mockReset();
  mockClearError.mockReset();
  mockAuthState = {
    isLoading: false,
    error: null,
    isAuthenticated: false,
    user: null,
  };
});

// ============================================================================
// RENDERING
// ============================================================================

describe('Rendering', () => {
  test('renders login form with email and password inputs', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    expect(getByPlaceholderText('you@company.com')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText('ComplyEasy AI')).toBeTruthy();
  });

  test('renders "Signing in..." when loading', () => {
    mockAuthState.isLoading = true;
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Signing in...')).toBeTruthy();
  });

  test('displays error banner when error exists', () => {
    mockAuthState.error = 'Invalid credentials';
    const { getByText } = render(<LoginScreen />);
    expect(getByText('Invalid credentials')).toBeTruthy();
  });
});

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

describe('Email Validation', () => {
  test('shows error for empty email on blur', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    const emailInput = getByPlaceholderText('you@company.com');

    fireEvent(emailInput, 'blur');

    expect(getByText('Email is required')).toBeTruthy();
  });

  test('shows error for invalid email format', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    const emailInput = getByPlaceholderText('you@company.com');

    fireEvent.changeText(emailInput, 'notanemail');
    fireEvent(emailInput, 'blur');

    expect(getByText('Please enter a valid email address')).toBeTruthy();
  });

  test('clears error for valid email', () => {
    const { getByPlaceholderText, queryByText } = render(<LoginScreen />);
    const emailInput = getByPlaceholderText('you@company.com');

    // First trigger error
    fireEvent(emailInput, 'blur');
    expect(queryByText('Email is required')).toBeTruthy();

    // Then enter valid email
    fireEvent.changeText(emailInput, 'valid@email.com');
    fireEvent(emailInput, 'blur');

    expect(queryByText('Email is required')).toBeNull();
    expect(queryByText('Please enter a valid email address')).toBeNull();
  });
});

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

describe('Password Validation', () => {
  test('shows error for empty password on blur', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    const passwordInput = getByPlaceholderText('Enter your password');

    fireEvent(passwordInput, 'blur');

    expect(getByText('Password is required')).toBeTruthy();
  });

  test('shows error for short password', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    const passwordInput = getByPlaceholderText('Enter your password');

    fireEvent.changeText(passwordInput, '12345');
    fireEvent(passwordInput, 'blur');

    expect(getByText('Password must be at least 6 characters')).toBeTruthy();
  });
});

// ============================================================================
// LOGIN SUBMISSION
// ============================================================================

describe('Login Submission', () => {
  test('calls login with email and password on submit', async () => {
    mockLogin.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('you@company.com'), 'user@company.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@company.com', 'password123');
    });
  });

  test('does not submit when validation fails', () => {
    const { getByTestId } = render(<LoginScreen />);

    fireEvent.press(getByTestId('login-button'));

    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('does not submit with invalid email', () => {
    const { getByPlaceholderText, getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('you@company.com'), 'bad-email');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.press(getByTestId('login-button'));

    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('clears auth error before attempting login', async () => {
    mockLogin.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('you@company.com'), 'user@co.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password');
    fireEvent.press(getByTestId('login-button'));

    expect(mockClearError).toHaveBeenCalled();
  });

  test('shows network error alert when login throws NETWORK_ERROR', async () => {
    mockLogin.mockRejectedValue({ code: 'NETWORK_ERROR', message: 'No network' });

    const { getByPlaceholderText, getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('you@company.com'), 'user@co.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Connection Error',
        expect.stringContaining('Unable to connect'),
        expect.any(Array)
      );
    });
  });
});

// ============================================================================
// ERROR BANNER
// ============================================================================

describe('Error Banner', () => {
  test('dismisses error when X button is pressed', () => {
    mockAuthState.error = 'Some error';
    const { getByText } = render(<LoginScreen />);

    fireEvent.press(getByText('✕'));
    expect(mockClearError).toHaveBeenCalled();
  });
});

// ============================================================================
// SHOW/HIDE PASSWORD
// ============================================================================

describe('Password Visibility Toggle', () => {
  test('toggles password visibility when Show/Hide is pressed', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    const passwordInput = getByPlaceholderText('Enter your password');

    // Initially hidden
    expect(passwordInput.props.secureTextEntry).toBe(true);

    // Press Show
    fireEvent.press(getByText('Show'));

    // Now visible
    expect(getByText('Hide')).toBeTruthy();
  });
});

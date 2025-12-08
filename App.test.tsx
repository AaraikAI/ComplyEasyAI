import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock sub-components that make network calls or complex renders
vi.mock('./components/Dashboard', () => ({
  Dashboard: () => <div>Dashboard Component</div>
}));
vi.mock('./components/LandingPage', () => ({
  LandingPage: ({ onLogin }: any) => <button onClick={() => onLogin({})}>Login</button>
}));

describe('App', () => {
  it('renders landing page by default', () => {
    render(<App />);
    const loginButton = screen.getByText('Login');
    expect(loginButton).toBeInTheDocument();
  });

  it('navigates to dashboard on login', () => {
    render(<App />);
    const loginButton = screen.getByText('Login');

    // Simulate login
    loginButton.click();

    expect(screen.getByText('Dashboard Component')).toBeInTheDocument();
  });
});

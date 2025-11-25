
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

declare const test: any;
declare const expect: any;
declare const jest: any;

// Mock sub-components that make network calls or complex renders
jest.mock('./components/Dashboard', () => ({
  Dashboard: () => <div>Dashboard Component</div>
}));
jest.mock('./components/LandingPage', () => ({
  LandingPage: ({ onLogin }: any) => <button onClick={() => onLogin({})}>Login</button>
}));

test('renders landing page by default', () => {
  render(<App />);
  const loginButton = screen.getByText('Login');
  expect(loginButton).toBeInTheDocument();
});

test('navigates to dashboard on login', () => {
  render(<App />);
  const loginButton = screen.getByText('Login');
  
  // Simulate login
  loginButton.click();
  
  expect(screen.getByText('Dashboard Component')).toBeInTheDocument();
});

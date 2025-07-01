import { render, screen } from '@testing-library/react';
import App from './App';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './AuthContext';

test('renders login page by default if not authenticated', () => {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    </AuthProvider>
  );

  expect(screen.getByText(/login/i)).toBeInTheDocument();
});

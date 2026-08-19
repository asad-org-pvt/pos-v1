import { render, screen } from '@testing-library/react';
import App from './app';

test('renders Login heading when user is not authenticated', async () => {
  render(<App />);
  const loginHeading = await screen.findByRole('heading', { name: /login/i });
  expect(loginHeading).toBeInTheDocument();
});

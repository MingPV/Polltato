import { createUser } from '@/testing/data-generators';
import { renderApp, screen, userEvent, waitFor } from '@/testing/test-utils';

import { SignupForm } from '../signup-form';

test('should sign up new user and call onSuccess cb which should navigate the user to the app', async () => {
  const newUser = createUser({ password: 'password123' });

  const onSuccess = vi.fn();

  await renderApp(<SignupForm onSuccess={onSuccess} />, { user: null });

  await userEvent.type(screen.getByLabelText(/name/i), newUser.name);
  await userEvent.type(screen.getByLabelText(/email address/i), newUser.email);
  await userEvent.type(screen.getByLabelText(/password/i), newUser.password);

  await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
});

import {
  createUser,
  renderApp,
  screen,
  userEvent,
  waitFor,
} from '@/testing/test-utils';

import { SigninForm } from '../signin-form';

test('should sign in user and call onSuccess cb which should navigate the user to the app', async () => {
  const newUser = await createUser({ teamId: undefined });

  const onSuccess = vi.fn();

  await renderApp(<SigninForm onSuccess={onSuccess} />, { user: null });

  await userEvent.type(screen.getByLabelText(/email address/i), newUser.email);
  await userEvent.type(screen.getByLabelText(/password/i), newUser.password);

  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
});

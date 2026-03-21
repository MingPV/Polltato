import { QueryFunction } from '@tanstack/react-query';
import { configureAuth } from 'react-query-auth';
import { Navigate, useLocation } from 'react-router';
import { z } from 'zod';

import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { User } from '@/types/api';

import { api } from './api-client';

/** Must match react-query-auth default; used for QueryClient.setQueryDefaults. */
export const AUTH_USER_QUERY_KEY = ['authenticated-user'] as const;

export type MeUser = {
  id: string;
  email: string;
  name: string;
  role?: 'ADMIN' | 'USER';
};

type SigninApiResponse = {
  user: MeUser;
};

function toAppUser(u: MeUser): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role ?? 'USER',
    firstName: u.name.split(/\s+/)[0] ?? u.name,
    lastName: u.name.split(/\s+/).slice(1).join(' ') || '',
    teamId: '',
    bio: '',
    createdAt: Date.now(),
  };
}

const getUser: QueryFunction<User> = async () => {
  try {
    const me = (await api.get('/me')) as MeUser;
    return toAppUser(me);
  } catch {
    throw new Error('Unauthenticated');
  }
};

const signOutRequest = (): Promise<void> => {
  return api.post('/auth/signout');
};

export const signinInputSchema = z.object({
  email: z.string().min(1, 'Required').email('Invalid email'),
  password: z.string().min(6, 'At least 6 characters'),
});

export type SigninInput = z.infer<typeof signinInputSchema>;

const signInWithCredentials = async (data: SigninInput): Promise<User> => {
  const res = (await api.post('/auth/signin', data)) as SigninApiResponse;
  return toAppUser(res.user);
};

export const signupInputSchema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().min(1, 'Required').email('Invalid email'),
  password: z.string().min(6, 'At least 6 characters'),
});

export type SignupInput = z.infer<typeof signupInputSchema>;

const signUpWithCredentials = async (data: SignupInput): Promise<User> => {
  await api.post('/auth/signup', {
    name: data.name,
    email: data.email,
    password: data.password,
  });
  return signInWithCredentials({
    email: data.email,
    password: data.password,
  });
};

const authConfig = {
  userKey: AUTH_USER_QUERY_KEY,
  userFn: getUser,
  loginFn: signInWithCredentials,
  registerFn: signUpWithCredentials,
  logoutFn: signOutRequest,
};

const auth = configureAuth(authConfig);

export const useUser = auth.useUser;
export const useSignin = auth.useLogin;
export const useSignup = auth.useRegister;
export const useSignout = auth.useLogout;
export const AuthLoader = auth.AuthLoader;

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useUser({ retry: false });
  const location = useLocation();

  if (user.isPending) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!user.data) {
    return (
      <Navigate to={paths.auth.signin.getHref(location.pathname)} replace />
    );
  }

  return children;
};

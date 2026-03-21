import Cookies from 'js-cookie';
import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';

import { db, persistDb } from '../db';
import {
  authenticate,
  hash,
  requireAuth,
  AUTH_COOKIE,
  networkDelay,
  mockUserToMe,
} from '../utils';

type SignupBody = {
  name: string;
  email: string;
  password: string;
};

type SigninBody = {
  email: string;
  password: string;
};

export const authHandlers = [
  http.post(`${env.API_URL}/auth/signup`, async ({ request }) => {
    await networkDelay();
    try {
      const userObject = (await request.json()) as SignupBody;

      const existingUser = db.user.findFirst({
        where: {
          email: {
            equals: userObject.email,
          },
        },
      });

      if (existingUser) {
        return HttpResponse.json(
          { error: 'The user already exists' },
          { status: 409 },
        );
      }

      db.user.create({
        firstName: userObject.name,
        lastName: '',
        email: userObject.email,
        password: hash(userObject.password),
        teamId: 'mock-team',
        role: 'USER',
        bio: '',
      });

      await persistDb('user');

      return HttpResponse.json(
        mockUserToMe(
          db.user.findFirst({
            where: { email: { equals: userObject.email } },
          }) as any,
        ),
        { status: 201 },
      );
    } catch (error: any) {
      return HttpResponse.json(
        { error: error?.message || 'Server Error' },
        { status: 500 },
      );
    }
  }),

  http.post(`${env.API_URL}/auth/signin`, async ({ request }) => {
    await networkDelay();

    try {
      const credentials = (await request.json()) as SigninBody;
      const result = authenticate(credentials);
      const me = mockUserToMe(result.user as any);

      Cookies.set(AUTH_COOKIE, result.jwt, { path: '/', sameSite: 'lax' });

      return HttpResponse.json(
        { user: me },
        {
          headers: {
            'Set-Cookie': `${AUTH_COOKIE}=${result.jwt}; Path=/; HttpOnly; SameSite=Lax`,
          },
        },
      );
    } catch {
      return HttpResponse.json(
        { error: 'invalid email or password' },
        { status: 401 },
      );
    }
  }),

  http.post(`${env.API_URL}/auth/signout`, async () => {
    await networkDelay();

    Cookies.remove(AUTH_COOKIE);

    return new HttpResponse(null, {
      status: 204,
      headers: {
        'Set-Cookie': `${AUTH_COOKIE}=; Path=/; Max-Age=0`,
      },
    });
  }),

  http.get(`${env.API_URL}/me`, async ({ request, cookies }) => {
    await networkDelay();

    try {
      const { user, error } = requireAuth(request, cookies);
      if (error || !user) {
        return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return HttpResponse.json(mockUserToMe(user as any));
    } catch (error: any) {
      return HttpResponse.json(
        { error: error?.message || 'Server Error' },
        { status: 500 },
      );
    }
  }),
];

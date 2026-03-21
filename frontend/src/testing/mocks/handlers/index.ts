import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';

import { networkDelay } from '../utils';

import { authHandlers } from './auth';
import { ordersHandlers } from './orders';
import { teamsHandlers } from './teams';
import { usersHandlers } from './users';

export const handlers = [
  ...authHandlers,
  ...ordersHandlers,
  ...teamsHandlers,
  ...usersHandlers,
  http.get(`${env.API_URL}/healthcheck`, async () => {
    await networkDelay();
    return HttpResponse.json({ ok: true });
  }),
];

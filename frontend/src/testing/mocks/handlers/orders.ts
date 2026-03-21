import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';

import { networkDelay, requireAuth } from '../utils';

type OrderRow = { id: number; total: number };

let mockOrders: OrderRow[] = [];
let nextOrderId = 1;

export function resetMockOrders() {
  mockOrders = [];
  nextOrderId = 1;
}

export const ordersHandlers = [
  http.get(`${env.API_URL}/orders`, async ({ request, cookies }) => {
    await networkDelay();
    const { error } = requireAuth(request, cookies);
    if (error) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return HttpResponse.json(mockOrders);
  }),

  http.post(`${env.API_URL}/orders`, async ({ request, cookies }) => {
    await networkDelay();
    const { error } = requireAuth(request, cookies);
    if (error) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      const body = (await request.json()) as { total: number };
      if (!body?.total || body.total <= 0) {
        return HttpResponse.json({ error: 'invalid request' }, { status: 400 });
      }
      const row: OrderRow = { id: nextOrderId++, total: body.total };
      mockOrders = [...mockOrders, row];
      return HttpResponse.json(row, { status: 201 });
    } catch (e: any) {
      return HttpResponse.json(
        { error: e?.message || 'Server Error' },
        { status: 500 },
      );
    }
  }),
];

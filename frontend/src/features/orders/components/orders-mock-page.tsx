import { useOrders } from '@/features/orders/api/get-orders';
import { useCreateOrder } from '@/features/orders/api/create-order';
import { Button } from '@/components/ui/button';
import { Form, Input } from '@/components/ui/form';
import { Spinner } from '@/components/ui/spinner';
import { z } from 'zod';

const createOrderSchema = z.object({
  total: z.coerce.number().positive('Total must be greater than 0'),
});

type CreateOrderValues = z.infer<typeof createOrderSchema>;

export const OrdersMockPage = () => {
  const ordersQuery = useOrders();
  const createOrder = useCreateOrder();

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders (REST)</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Calls <code className="rounded bg-muted px-1 py-0.5">GET /api/v1/orders</code>{' '}
          and <code className="rounded bg-muted px-1 py-0.5">POST /api/v1/orders</code>{' '}
          on the Go backend.
        </p>
      </div>

      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-medium">Create order</h2>
        <Form
          schema={createOrderSchema}
          onSubmit={(values: CreateOrderValues) => {
            createOrder.mutate({ total: values.total });
          }}
        >
          {({ register, formState }) => (
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
              <Input
                type="number"
                step="0.01"
                min="0.01"
                label="Total"
                error={formState.errors['total']}
                registration={register('total')}
                className="sm:max-w-xs"
              />
              <Button type="submit" isLoading={createOrder.isPending}>
                POST /orders
              </Button>
            </div>
          )}
        </Form>
      </section>

      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-medium">All orders</h2>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => ordersQuery.refetch()}
            disabled={ordersQuery.isFetching}
          >
            Refresh (GET /orders)
          </Button>
        </div>

        {ordersQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : ordersQuery.isError ? (
          <p className="text-destructive mt-4 text-sm">
            Could not load orders. Is the API running?
          </p>
        ) : (
          <ul className="mt-4 divide-y rounded-md border">
            {(ordersQuery.data ?? []).length === 0 ? (
              <li className="text-muted-foreground px-4 py-6 text-sm">
                No orders yet — create one above.
              </li>
            ) : (
              (ordersQuery.data ?? []).map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="font-mono text-muted-foreground">
                    id: {o.id}
                  </span>
                  <span className="font-medium">${o.total.toFixed(2)}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </section>
    </div>
  );
};

import { DashboardLayout } from '@/components/layouts';
import { OrdersMockPage } from '@/features/orders/components/orders-mock-page';

const OrderRoute = () => {
  return (
    <DashboardLayout>
      <OrdersMockPage />
    </DashboardLayout>
  );
};

export default OrderRoute;

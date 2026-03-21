import { Link } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { buttonVariants } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';
import { ROLES } from '@/lib/authorization';

const DashboardRoute = () => {
  const user = useUser();
  return (
    <ContentLayout title="Dashboard">
      <h1 className="text-xl">
        Welcome <b>{`${user.data?.firstName} ${user.data?.lastName}`}</b>
      </h1>
      <h4 className="my-3">
        Your role is : <b>{user.data?.role}</b>
      </h4>
      <p className="font-medium">In this application you can:</p>
      {user.data?.role === ROLES.USER && (
        <ul className="my-4 list-inside list-disc">
          <li>Use the Socket demo for public lobby and private rooms</li>
          <li>Manage your profile</li>
        </ul>
      )}
      {user.data?.role === ROLES.ADMIN && (
        <ul className="my-4 list-inside list-disc">
          <li>Use the Socket demo for realtime chat</li>
          <li>Manage users</li>
          <li>View orders</li>
        </ul>
      )}
      <div className="mt-6">
        <Link className={buttonVariants()} to={paths.socketDemo.getHref()}>
          Open Socket demo
        </Link>
      </div>
    </ContentLayout>
  );
};

export default DashboardRoute;

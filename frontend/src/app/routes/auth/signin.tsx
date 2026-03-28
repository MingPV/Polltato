import { useNavigate, useSearchParams } from 'react-router';

import { AuthSplitLayout } from '@/components/layouts/auth-split-layout';
import { paths } from '@/config/paths';
import { SigninForm } from '@/features/auth/components/signin-form';

const SigninRoute = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');

  return (
    <AuthSplitLayout title="Sign in">
      <SigninForm
        onSuccess={() => {
          navigate(
            `${redirectTo ? `${redirectTo}` : paths.myPoll.getHref()}`,
            {
              replace: true,
            },
          );
        }}
      />
    </AuthSplitLayout>
  );
};

export default SigninRoute;

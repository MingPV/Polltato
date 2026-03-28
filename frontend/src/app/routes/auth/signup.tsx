import { useNavigate, useSearchParams } from 'react-router';

import { AuthSplitLayout } from '@/components/layouts/auth-split-layout';
import { paths } from '@/config/paths';
import { SignupForm } from '@/features/auth/components/signup-form';

const SignupRoute = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');

  return (
    <AuthSplitLayout title="Sign up">
      <SignupForm
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

export default SignupRoute;

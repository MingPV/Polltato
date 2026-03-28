import { Link, useSearchParams } from 'react-router';
import { Lock, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { paths } from '@/config/paths';
import { useSignin, signinInputSchema } from '@/lib/auth';

type SigninFormProps = {
  onSuccess: () => void;
};

const inputShell =
  'w-full rounded-xl border border-[#dec4aa] bg-[#fff9f0] py-3 pl-11 pr-4 text-[#3f2a1e] outline-none transition placeholder:text-[#9e7c65] focus:border-[#b27c55] focus:ring-1 focus:ring-[#c9a06c]';

export const SigninForm = ({ onSuccess }: SigninFormProps) => {
  const signin = useSignin({
    onSuccess,
  });
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');

  return (
    <Form
      onSubmit={(values) => {
        signin.mutate(values);
      }}
      schema={signinInputSchema}
      className="space-y-5"
    >
      {({ register, formState }) => (
        <>
          <div className="space-y-1">
            <label
              htmlFor="signin-email"
              className="text-sm font-medium text-[#5c3f2d]"
            >
              Email
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 size-[1.125rem] -translate-y-1/2 text-[#a0806c]"
                aria-hidden
              />
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={inputShell}
                {...register('email')}
              />
            </div>
            {formState.errors.email ? (
              <p className="text-sm text-red-600">
                {formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="signin-password"
              className="text-sm font-medium text-[#5c3f2d]"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 size-[1.125rem] -translate-y-1/2 text-[#a0806c]"
                aria-hidden
              />
              <input
                id="signin-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={inputShell}
                {...register('password')}
              />
            </div>
            {formState.errors.password ? (
              <p className="text-sm text-red-600">
                {formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Button
              isLoading={signin.isPending}
              type="submit"
              className="w-full rounded-xl bg-[#6f3f23] px-8 py-6 text-base font-semibold text-white hover:bg-[#5d331c] sm:w-auto"
            >
              Sign in
            </Button>
            <Link
              to="#"
              onClick={(e) => e.preventDefault()}
              className="text-center text-sm font-medium text-[#a0682e] underline-offset-2 hover:underline sm:text-right"
            >
              Forgot password?
            </Link>
          </div>

          <p className="pt-2 text-center text-sm text-[#6b4d3a] sm:text-left">
            Don&apos;t have an account?{' '}
            <Link
              to={paths.auth.signup.getHref(redirectTo ?? undefined)}
              className="font-semibold text-[#8b4513] underline underline-offset-2 hover:text-[#6f3f23]"
            >
              Sign up
            </Link>
          </p>
        </>
      )}
    </Form>
  );
};

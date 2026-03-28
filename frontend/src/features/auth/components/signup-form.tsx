import { Link, useSearchParams } from 'react-router';
import { Lock, Mail } from 'lucide-react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { paths } from '@/config/paths';
import { useSignup } from '@/lib/auth';

type SignupFormProps = {
  onSuccess: () => void;
};

const signupPageSchema = z
  .object({
    email: z.string().min(1, 'Required').email('Invalid email'),
    password: z.string().min(6, 'At least 6 characters'),
    confirmPassword: z.string().min(1, 'Required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupPageValues = z.infer<typeof signupPageSchema>;

const inputShell =
  'w-full rounded-xl border border-[#dec4aa] bg-[#fff9f0] py-3 pl-11 pr-4 text-[#3f2a1e] outline-none transition placeholder:text-[#9e7c65] focus:border-[#b27c55] focus:ring-1 focus:ring-[#c9a06c]';

export const SignupForm = ({ onSuccess }: SignupFormProps) => {
  const signup = useSignup({ onSuccess });
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');

  const handleSubmit = (values: SignupPageValues) => {
    const localPart = values.email.split('@')[0]?.trim();
    signup.mutate({
      name: localPart && localPart.length > 0 ? localPart : 'CloudPoll user',
      email: values.email,
      password: values.password,
    });
  };

  return (
    <Form
      onSubmit={handleSubmit}
      schema={signupPageSchema}
      className="space-y-5"
    >
      {({ register, formState }) => (
        <>
          <div className="space-y-1">
            <label
              htmlFor="signup-email"
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
                id="signup-email"
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
              htmlFor="signup-password"
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
                id="signup-password"
                type="password"
                autoComplete="new-password"
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

          <div className="space-y-1">
            <label
              htmlFor="signup-confirm"
              className="text-sm font-medium text-[#5c3f2d]"
            >
              Re-password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 size-[1.125rem] -translate-y-1/2 text-[#a0806c]"
                aria-hidden
              />
              <input
                id="signup-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className={inputShell}
                {...register('confirmPassword')}
              />
            </div>
            {formState.errors.confirmPassword ? (
              <p className="text-sm text-red-600">
                {formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          <div>
            <Button
              isLoading={signup.isPending}
              type="submit"
              className="w-full rounded-xl bg-[#6f3f23] py-6 text-base font-semibold text-white hover:bg-[#5d331c] sm:w-auto sm:px-12"
            >
              Let&apos;s go
            </Button>
          </div>

          <p className="pt-2 text-center text-sm text-[#6b4d3a] sm:text-left">
            Already have an account?{' '}
            <Link
              to={paths.auth.signin.getHref(redirectTo ?? undefined)}
              className="font-semibold text-[#8b4513] underline underline-offset-2 hover:text-[#6f3f23]"
            >
              Sign in
            </Link>
          </p>
        </>
      )}
    </Form>
  );
};

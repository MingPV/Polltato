import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { Head } from '@/components/seo';
import { Link } from '@/components/ui/link';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';

type AuthSplitLayoutProps = {
  children: React.ReactNode;
  title: string;
};

export const AuthSplitLayout = ({ children, title }: AuthSplitLayoutProps) => {
  const user = useUser();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');
  const navigate = useNavigate();

  useEffect(() => {
    if (user.data) {
      navigate(redirectTo ? redirectTo : paths.app.dashboard.getHref(), {
        replace: true,
      });
    }
  }, [user.data, navigate, redirectTo]);

  return (
    <>
      <Head title={title} />
      <div className="flex min-h-screen flex-col bg-[#f5efe4] lg:flex-row lg:bg-white">
        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:w-1/2 lg:max-w-none lg:px-16 xl:px-24">
          <div className="mb-6 flex justify-center lg:hidden">
            <div className="size-24 overflow-hidden rounded-3xl border border-[#ead7c3] bg-[#fff9f0] p-1.5 shadow-md">
              <img
                src="/potato1.png"
                alt=""
                className="h-full w-full object-contain object-center"
              />
            </div>
          </div>

          <h1 className="text-center text-3xl font-semibold tracking-tight text-[#2f1c12] lg:text-left">
            {title}
          </h1>

          <div className="mt-8">{children}</div>

          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-[#8a6a53] lg:justify-start">
            <Link
              to={paths.home.getHref()}
              className="hover:text-[#6b4d3a] hover:underline"
            >
              Terms &amp; Conditions
            </Link>
            <Link
              to={paths.home.getHref()}
              className="hover:text-[#6b4d3a] hover:underline"
            >
              Privacy Policy
            </Link>
          </div>
        </div>

        <div className="relative hidden min-h-[420px] flex-1 overflow-hidden bg-[#f5efe4] lg:flex lg:min-h-screen lg:items-center lg:justify-center">
          <div className="pointer-events-none absolute -right-24 bottom-[-10%] size-[min(95vw,32rem)] rotate-12 rounded-[3rem] bg-[#e8b86a]/85" />
          <div className="pointer-events-none absolute -left-16 top-1/4 size-64 rounded-full bg-[#ecd8c1]/80 blur-2xl" />
          <div className="pointer-events-none absolute bottom-1/4 right-1/4 size-48 rounded-full bg-[#f4d9a4]/60 blur-xl" />

          <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 px-6 py-10">
            <div className="relative h-[min(72vh,720px)] w-full max-w-[600px]">
              <div className="absolute left-0 top-1/2 origin-center -translate-y-1/2 -rotate-[9deg] rounded-2xl border-[6px] border-white bg-white p-2 shadow-[0_22px_48px_rgba(62,35,18,0.22)] ring-1 ring-[#ead7c3]/80">
                <div className="flex items-center justify-center rounded-[10px] bg-[#f0ebe3]">
                  <img
                    src="/poll-list.png"
                    alt="Poll list preview"
                    className="h-auto max-h-[min(64vh,540px)] w-auto max-w-[min(52vw,420px)] object-contain"
                  />
                </div>
              </div>

              <div className="absolute right-0 top-1/2 z-[1] -translate-y-1/2 rotate-[4deg] rounded-2xl border-[6px] border-white bg-white p-2 shadow-[0_26px_56px_rgba(62,35,18,0.26)] ring-1 ring-[#ead7c3]/80">
                <div className="flex items-center justify-center rounded-[10px] bg-[#f0ebe3]">
                  <img
                    src="/poll-voting.png"
                    alt="Poll voting preview"
                    className="h-auto max-h-[min(64vh,540px)] w-auto max-w-[min(52vw,420px)] object-contain"
                  />
                </div>
              </div>

              <div className="absolute left-1/2 top-[20%] z-[2] size-[5.25rem] -translate-x-1/2 -translate-y-1/2 rotate-[7deg] overflow-hidden rounded-2xl border-2 border-[#fff8ee] bg-[#fff9f0] p-1.5 shadow-[0_12px_28px_rgba(93,52,23,0.2)] ring-1 ring-[#ead7c3] sm:size-[6.25rem] sm:top-[18%]">
                <img
                  src="/potato1.png"
                  alt="CloudPoll mascot"
                  className="h-full w-full object-contain object-center"
                />
              </div>
            </div>

            <div className="max-w-sm text-center">
              <p className="font-serif text-xl font-semibold text-[#2f1c12] sm:text-2xl">
                Polltato
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[#6b4d3a]">
                Your polls, your QR, your votes — all in one warm little place.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

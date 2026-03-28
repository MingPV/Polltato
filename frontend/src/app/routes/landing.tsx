import { useNavigate } from 'react-router';

import logo from '@/assets/logo.svg';
import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';

const LandingRoute = () => {
  const navigate = useNavigate();
  const user = useUser();

  const handleStart = () => {
    if (user.data) {
      navigate(paths.app.dashboard.getHref());
    } else {
      navigate(paths.auth.signin.getHref());
    }
  };

  return (
    <>
      <Head description="Create polls in minutes, share with QR or link, and manage responses easily." />
      <div className="relative min-h-screen overflow-hidden bg-[#f5efe4]">
        <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-[#e8d3ba]/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-24 size-96 rounded-full bg-[#d9b48b]/40 blur-3xl" />

        <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-2 md:gap-10 lg:px-12">
          <div className="text-center md:text-left">

            <h1 className="font-serif text-5xl font-semibold leading-tight text-[#2f1c12] sm:text-5xl lg:text-8xl">
            Quick polls
              <span className="block hidden lg:block">Start Here.</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-[#6b4d3a] sm:text-xl">
            Create polls instantly. Share via QR or link. Get real-time feedback.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 md:justify-start">
              <Button
                onClick={handleStart}
                size="lg"
                className="rounded-full bg-[#6f3f23] px-10 py-6 text-lg text-white hover:bg-[#5d331c]"
              >
                Create Poll
              </Button>
              <Button
                onClick={handleStart}
                variant="outline"
                size="lg"
                className="rounded-full border-[#d6b695] bg-[#fff8ee] px-10 py-6 text-lg text-[#6b4d3a] hover:bg-[#f7ebdb]"
              >
                Manage Poll
              </Button>
            </div>
          </div>

          <div className="mx-auto w-[70vw] md:w-full max-w-xl">
            <div className="overflow-hidden rounded-[2.2rem] p-4 md:p-5">
              <img
                src="/potato1.png"
                alt="Cute potato mascot"
                className="h-full w-full rounded-[1.8rem] object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LandingRoute;

import { useState } from 'react';
import { IoMdCopy } from 'react-icons/io';
import { IoMdDownload } from 'react-icons/io';
import { IoLogOutOutline } from 'react-icons/io5';
import { useLocation, useNavigate } from 'react-router';

import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { useSignout } from '@/lib/auth';

const mockPolls = [
  {
    id: 'abc123',
    title: 'Favorite Team Activity',
    responses: 28,
    results: [
      { label: 'Game Night', votes: 12 },
      { label: 'Movie Night', votes: 9 },
      { label: 'Cafe Meetup', votes: 7 },
    ],
  },
  {
    id: 'lunch2026',
    title: 'Friday Lunch Vote',
    responses: 16,
    results: [
      { label: 'Pizza', votes: 8 },
      { label: 'Noodles', votes: 5 },
      { label: 'Salad', votes: 3 },
    ],
  },
];

const MyPollRoute = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedPollIds, setExpandedPollIds] = useState<string[]>([]);
  const signout = useSignout({
    onSuccess: () =>
      navigate(paths.auth.signin.getHref(location.pathname), { replace: true }),
  });

  return (
    <>
      <Head description="View and manage polls you created." />
      <div className="relative min-h-screen overflow-hidden bg-[#f5efe4] px-6 py-16 lg:px-12">
        <div className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-[#ecd8c1]/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 size-64 rounded-full bg-[#ddb38b]/35 blur-3xl" />

        <div className="mx-auto w-full max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-serif text-5xl font-semibold text-[#2f1c12] sm:text-6xl">
                Your Polls
              </h1>
              <p className="mt-2 text-base text-[#6b4d3a] sm:text-lg">
                Manage, edit, and track your polls.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
              <Button
                type="button"
                variant="outline"
                isLoading={signout.isPending}
                onClick={() => signout.mutate({})}
                className="rounded-full border-[#d6b695] bg-[#fff8ee] px-6 text-[#6b4d3a] hover:bg-[#f7ebdb]"
                icon={<IoLogOutOutline className="text-lg" aria-hidden />}
              >
                Sign out
              </Button>
              <Button
                onClick={() => navigate(paths.pollCreate.getHref())}
                className="rounded-full bg-[#6f3f23] px-7 text-white hover:bg-[#5d331c]"
              >
                + Create Poll
              </Button>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {mockPolls.map((poll) => {
              const isExpanded = expandedPollIds.includes(poll.id);
              const topVote = poll.results.reduce((top, current) =>
                current.votes > top.votes ? current : top,
              );

              return (
                <div
                  key={poll.id}
                  onClick={() =>
                    setExpandedPollIds((current) =>
                      current.includes(poll.id)
                        ? current.filter((id) => id !== poll.id)
                        : [...current, poll.id],
                    )
                  }
                  className="relative cursor-pointer rounded-3xl bg-white/75 p-5 pr-12 shadow-[0_10px_30px_rgba(93,52,23,0.12)] transition hover:shadow-[0_16px_35px_rgba(93,52,23,0.16)]"
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                    className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-sm font-semibold text-[#8a6448] hover:bg-[#f9e5d0]"
                    aria-label="Delete poll"
                  >
                    x
                  </button>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xl font-semibold text-[#2f1c12] sm:text-2xl">
                        {poll.title}
                      </p>
                      <p className="mt-1 text-sm text-[#6b4d3a]">
                        {poll.responses} votes
                      </p>
                      <p className="mt-1 text-sm text-[#8a6448]">
                        Top vote: {topVote.label} ({topVote.votes})
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                        className="h-10 rounded-xl border-[#e4ccb4] bg-[#fffaf3] px-3 text-sm font-semibold text-[#6b4d3a] shadow-sm hover:bg-[#f6ebde]"
                        aria-label="Copy poll link"
                        icon={<IoMdCopy className="text-base" />}
                      >
                        Link
                      </Button>
                      <Button
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                        className="h-10 rounded-xl border-[#e4ccb4] bg-[#fffaf3] px-3 text-sm font-semibold text-[#6b4d3a] shadow-sm hover:bg-[#f6ebde]"
                        aria-label="Download QR code"
                        icon={<IoMdDownload className="text-base" />}
                      >
                        QR
                      </Button>
                      <Button
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(paths.pollDetail.getHref(poll.id));
                        }}
                        className="rounded-full border-[#d6b695] bg-[#fff8ee] text-[#6b4d3a] hover:bg-[#f7ebdb]"
                      >
                        View
                      </Button>
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="mt-4 space-y-3 border-t border-[#ead7c3] pt-4">
                      {poll.results.map((result) => {
                        const percentage = Math.round(
                          (result.votes / poll.responses) * 100,
                        );

                        return (
                          <div key={result.label}>
                            <div className="mb-1 flex items-center justify-between text-sm text-[#6b4d3a]">
                              <span>{result.label}</span>
                              <span>{result.votes}</span>
                            </div>
                            <div className="h-2 rounded-full bg-[#ecd8c1]">
                              <div
                                className="h-2 rounded-full bg-[#b2774a]"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default MyPollRoute;

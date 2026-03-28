import { useMemo, useState } from 'react';
import { IoMdCopy, IoMdDownload } from 'react-icons/io';
import { useParams } from 'react-router';

import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';

type PollOption = { id: string; label: string; votes: number };

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const defaultOptions: PollOption[] = [
  { id: '1', label: 'Option A', votes: 12 },
  { id: '2', label: 'Option B', votes: 7 },
  { id: '3', label: 'Option C', votes: 5 },
];

/** Demo: polls listed in /my-poll are treated as owned when user is signed in */
const DEMO_OWNED_POLL_IDS = new Set(['abc123', 'lunch2026']);

const PollDetailRoute = () => {
  const { pollId } = useParams();
  const user = useUser({ retry: false });
  const [options, setOptions] = useState<PollOption[]>(() =>
    defaultOptions.map((o) => ({ ...o })),
  );
  /** Options you voted for in this session — tap again to undo */
  const [votedOptionIds, setVotedOptionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [newOptionLabel, setNewOptionLabel] = useState('');

  const isOwner = Boolean(user.data && pollId && DEMO_OWNED_POLL_IDS.has(pollId));

  const totalVotes = useMemo(
    () => options.reduce((sum, option) => sum + option.votes, 0),
    [options],
  );

  const pollUrl =
    typeof window !== 'undefined' && pollId
      ? `${window.location.origin}${paths.pollDetail.getHref(pollId)}`
      : '';

  const handleVoteToggle = (optionId: string) => {
    const already = votedOptionIds.has(optionId);
    if (already) {
      setVotedOptionIds((prev) => {
        const next = new Set(prev);
        next.delete(optionId);
        return next;
      });
      setOptions((prev) =>
        prev.map((o) =>
          o.id === optionId
            ? { ...o, votes: Math.max(0, o.votes - 1) }
            : o,
        ),
      );
      return;
    }
    setVotedOptionIds((prev) => new Set(prev).add(optionId));
    setOptions((prev) =>
      prev.map((o) =>
        o.id === optionId ? { ...o, votes: o.votes + 1 } : o,
      ),
    );
  };

  const handleAddOption = () => {
    const trimmed = newOptionLabel.trim();
    setOptions((prev) => [
      ...prev,
      {
        id: createId(),
        label: trimmed || `Option ${prev.length + 1}`,
        votes: 0,
      },
    ]);
    setNewOptionLabel('');
  };

  const handleDeleteOption = (optionId: string) => {
    setVotedOptionIds((prev) => {
      const next = new Set(prev);
      next.delete(optionId);
      return next;
    });
    setOptions((prev) => prev.filter((o) => o.id !== optionId));
  };

  const handleReset = () => {
    setVotedOptionIds(new Set());
    setOptions(defaultOptions.map((o) => ({ ...o })));
  };

  const handleCopyLink = async () => {
    if (!pollUrl) return;
    try {
      await navigator.clipboard.writeText(pollUrl);
    } catch {
      // ignore
    }
  };

  return (
    <>
      <Head description="Vote on a poll and review live results." />
      <div className="relative min-h-screen overflow-hidden bg-[#f5efe4] px-6 py-10 lg:px-12">
        <div className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-[#ecd8c1]/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 size-64 rounded-full bg-[#ddb38b]/35 blur-3xl" />

        <div className="mx-auto w-full max-w-4xl">
          <div>
            <h1 className="font-serif text-5xl font-semibold text-[#2f1c12] sm:text-6xl">
              Poll #{pollId}
            </h1>
            <p className="mt-3 text-lg text-[#6b4d3a]">
              Tap an option to vote; tap again on the same one to undo. You can
              vote on multiple options.
            </p>

            <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1 rounded-3xl bg-white/70 p-6 shadow-[0_18px_50px_rgba(93,52,23,0.18)] sm:p-8">
              <h2 className="text-3xl font-semibold text-[#2f1c12]">
                What should we do this weekend?
              </h2>
              <p className="mt-1 text-sm text-[#6b4d3a]">
                Total votes: {totalVotes}
              </p>

              {isOwner ? (
                <div className="mt-4 flex flex-col gap-2 border-b border-[#ead7c3] pb-4 sm:flex-row sm:flex-wrap sm:items-center">
                  <input
                    type="text"
                    value={newOptionLabel}
                    onChange={(e) => setNewOptionLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    placeholder="Type new option text…"
                    className="min-w-0 w-full rounded-xl border border-[#dec4aa] bg-[#fff9f0] px-4 py-2.5 text-[#3f2a1e] outline-none placeholder:text-[#9e7c65] focus:border-[#b27c55] sm:flex-1 sm:min-w-[12rem]"
                  />
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={handleAddOption}
                      className="rounded-xl bg-[#6f3f23] px-4 text-sm text-white hover:bg-[#5d331c]"
                    >
                      Add option
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      className="rounded-xl border-[#d6b695] bg-[#fff8ee] text-sm text-[#6b4d3a] hover:bg-[#f7ebdb]"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 space-y-3">
                {options.map((option) => {
                  const percentage =
                    totalVotes === 0
                      ? 0
                      : Math.round((option.votes / totalVotes) * 100);
                  const hasVotedThis = votedOptionIds.has(option.id);

                  return (
                    <div key={option.id} className="relative">
                      <button
                        type="button"
                        onClick={() => handleVoteToggle(option.id)}
                        className={`w-full rounded-2xl border p-4 pr-12 text-left transition ${
                          hasVotedThis
                            ? 'cursor-pointer border-[#c9b49e] bg-[#f0e6da] hover:bg-[#e8dccf]'
                            : 'border-[#dec4aa] bg-[#fff8ee] hover:bg-[#faf0e3]'
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="font-medium text-[#3f2a1e]">
                            {option.label}
                            {hasVotedThis ? (
                              <span className="ml-2 text-sm font-normal text-[#8a6448]">
                                (tap to undo)
                              </span>
                            ) : null}
                          </span>
                          <span className="shrink-0 text-sm text-[#7b5a45]">
                            {option.votes} votes ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[#ecd8c1]">
                          <div
                            className="h-2 rounded-full bg-[#b2774a]"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </button>
                      {isOwner ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOption(option.id);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-sm font-semibold text-[#8a6448] hover:bg-[#f9e5d0]"
                          aria-label="Delete option"
                        >
                          x
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              </div>

              <div className="mx-auto flex w-fit shrink-0 flex-col items-stretch gap-3 self-center lg:mx-0 lg:self-start">
                <div className="rounded-2xl border border-[#ead7c3] bg-white/90 p-2 shadow-[0_10px_28px_rgba(93,52,23,0.12)]">
                  <p className="flex mt-1 cursor-pointer items-center justify-center gap-1.5 text-center text-xs font-medium text-[#6b4d3a] hover:underline">
                    <IoMdDownload className="size-4 shrink-0 text-[#7b5134]" aria-hidden />
                    Share QR
                  </p>
                  <img
                    src="/mingpvQR.png"
                    alt="Poll QR code"
                    className="block h-auto w-[180px] max-w-full rounded-lg sm:w-[200px]"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="h-10 w-full rounded-xl border-[#e4ccb4] bg-[#fffaf3] px-3 text-sm font-semibold text-[#6b4d3a] shadow-sm hover:bg-[#f6ebde]"
                  icon={<IoMdCopy className="text-base" />}
                >
                  Copy poll link
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PollDetailRoute;

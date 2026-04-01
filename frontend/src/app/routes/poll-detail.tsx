import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { IoMdCopy, IoMdDownload } from 'react-icons/io';
import { IoHomeSharp } from 'react-icons/io5';
import { useNavigate, useParams } from 'react-router';
import io from 'socket.io-client';

import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/dialog';
import { env } from '@/config/env';
import { paths } from '@/config/paths';
import { useDeletePoll } from '@/features/polls/api/delete-poll';
import {
  getMyPollsQueryOptions,
  useMyPolls,
} from '@/features/polls/api/get-my-polls';
import { getPollQueryOptions, usePoll } from '@/features/polls/api/get-poll';
import { useResetPoll } from '@/features/polls/api/reset-poll';
import {
  Poll,
  PollDeleteEvent,
  PollUpdateEvent,
} from '@/features/polls/api/types';
import { useUpdatePoll } from '@/features/polls/api/update-poll';
import { useVotePoll } from '@/features/polls/api/vote-poll';
import { useUser } from '@/lib/auth';

const PollDetailRoute = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useUser({ retry: false });
  const pollQuery = usePoll({ roomId: pollId ?? '' });
  const myPollsQuery = useMyPolls({
    queryConfig: {
      enabled: Boolean(user.data),
    },
  });
  const [votedOptionIds, setVotedOptionIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const votePollMutation = useVotePoll();
  const updatePollMutation = useUpdatePoll();
  const resetPollMutation = useResetPoll();
  const deletePollMutation = useDeletePoll({
    mutationConfig: {
      onSuccess: () => {
        navigate(paths.myPoll.getHref());
      },
    },
  });

  const poll = pollQuery.data;
  const isOwner = Boolean(
    user.data &&
      pollId &&
      myPollsQuery.data?.some((myPoll) => myPoll.room_id === pollId),
  );

  const totalVotes = useMemo(() => poll?.total_votes ?? 0, [poll]);
  const sortedChoices = useMemo(
    () =>
      [...(poll?.choices ?? [])].sort(
        (a, b) => b.number_vote - a.number_vote || a.id - b.id,
      ),
    [poll?.choices],
  );

  const pollUrl =
    typeof window !== 'undefined' && pollId
      ? `${window.location.origin}${paths.pollDetail.getHref(pollId)}`
      : '';

  useEffect(() => {
    if (!pollId) {
      return;
    }

    const socket = io(env.SOCKET_URL, {
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      upgrade: false,
    });
    const mergeSocketPoll = (
      current: Poll | undefined,
      payload: PollUpdateEvent,
    ): Poll => {
      const choices = payload.data.choices.map((choice) => ({
        id: choice.id,
        choice_name: choice.choice_name,
        number_vote: choice.number_vote,
      }));
      const total_votes = choices.reduce(
        (sum, choice) => sum + choice.number_vote,
        0,
      );

      return {
        id: payload.data.id,
        poll_name: payload.data.poll_name,
        is_multi: payload.data.is_multi,
        room_id: payload.data.room_id,
        qrcode_url: current?.qrcode_url ?? '',
        choices,
        total_votes,
        version: payload.version,
        create_time: current?.create_time ?? new Date().toISOString(),
        update_time: payload.data.update_time,
      };
    };

    const onConnect = () => {
      socket.emit('join-room', pollId);
    };

    const onUpdatePoll = (payload: PollUpdateEvent) => {
      if (payload.room_id !== pollId) {
        return;
      }

      queryClient.setQueryData<Poll | undefined>(
        getPollQueryOptions(pollId).queryKey,
        (current) => mergeSocketPoll(current, payload),
      );
      queryClient.invalidateQueries({
        queryKey: getMyPollsQueryOptions().queryKey,
      });
    };

    const onDeletePoll = (payload: PollDeleteEvent) => {
      if (payload.room_id !== pollId) {
        return;
      }
      navigate(paths.home.getHref(), { replace: true });
    };

    socket.on('connect', onConnect);
    socket.on('update-poll', onUpdatePoll);
    socket.on('delete-poll', onDeletePoll);

    return () => {
      socket.off('connect', onConnect);
      socket.off('update-poll', onUpdatePoll);
      socket.off('delete-poll', onDeletePoll);
      socket.disconnect();
    };
  }, [navigate, pollId, queryClient]);

  const handleVoteToggle = (optionId: number) => {
    if (!pollId || !poll) {
      return;
    }

    const already = votedOptionIds.has(optionId);

    if (!poll.is_multi && !already) {
      const existingVoteIds = Array.from(votedOptionIds);
      setVotedOptionIds(new Set([optionId]));
      votePollMutation.mutate({
        roomId: pollId,
        vote_choice_id: [optionId],
        unvote_choice_id: existingVoteIds,
      });
      return;
    }

    if (already) {
      setVotedOptionIds((prev) => {
        const next = new Set(prev);
        next.delete(optionId);
        return next;
      });
      votePollMutation.mutate({
        roomId: pollId,
        vote_choice_id: [],
        unvote_choice_id: [optionId],
      });
      return;
    }

    setVotedOptionIds((prev) => new Set(prev).add(optionId));
    votePollMutation.mutate({
      roomId: pollId,
      vote_choice_id: [optionId],
      unvote_choice_id: [],
    });
  };

  const handleAddOption = () => {
    const trimmed = newOptionLabel.trim();
    if (!trimmed || !pollId) {
      return;
    }
    updatePollMutation.mutate({
      roomId: pollId,
      added_choices: [trimmed],
    });
    setNewOptionLabel('');
  };

  const handleDeleteOption = (optionId: number) => {
    if (!pollId) {
      return;
    }

    setVotedOptionIds((prev) => {
      const next = new Set(prev);
      next.delete(optionId);
      return next;
    });
    updatePollMutation.mutate({
      roomId: pollId,
      deleted_choices: [optionId],
    });
  };

  const handleReset = () => {
    if (!pollId) {
      return;
    }
    setVotedOptionIds(new Set());
    resetPollMutation.mutate({ roomId: pollId });
  };

  const handleCopyLink = async () => {
    if (!pollUrl) return;
    try {
      await navigator.clipboard.writeText(pollUrl);
      setIsCopied(true);
      window.setTimeout(() => {
        setIsCopied(false);
      }, 1500);
    } catch {
      // ignore
    }
  };

  if (pollQuery.isPending) {
    return (
      <>
        <Head description="Vote on a poll and review live results." />
        <div className="flex min-h-screen items-center justify-center bg-[#f5efe4] text-[#6b4d3a]">
          Loading poll...
        </div>
      </>
    );
  }

  if (!poll) {
    return (
      <>
        <Head description="Vote on a poll and review live results." />
        <div className="flex min-h-screen items-center justify-center bg-[#f5efe4] text-[#6b4d3a]">
          Poll not found.
        </div>
      </>
    );
  }

  return (
    <>
      <Head description="Vote on a poll and review live results." />
      <div className="relative min-h-screen overflow-hidden bg-[#f5efe4] px-6 py-10 lg:px-12">
        <div className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-[#ecd8c1]/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 size-64 rounded-full bg-[#ddb38b]/35 blur-3xl" />

        <div className="mx-auto w-full max-w-4xl">
          <div>
            {user.data ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(paths.myPoll.getHref())}
                className="absolute left-4 top-4 rounded-full border-[#d6b695] bg-[#fff8ee] px-5 text-[#6b4d3a] hover:bg-[#f7ebdb]"
                icon={<IoHomeSharp className="text-base" />}
              >
                Back to My Polls
              </Button>
            ) : null}

            <h1 className="font-serif text-5xl font-semibold text-[#2f1c12] sm:text-6xl">
              Poll #{poll.room_id}
            </h1>
            <p className="mt-3 text-lg text-[#6b4d3a]">
              Tap an option to vote; tap again on the same one to undo.{' '}
              {poll.is_multi
                ? 'You can vote on multiple options.'
                : 'You can vote on one option at a time.'}
            </p>

            <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1 rounded-3xl bg-white/70 p-6 shadow-[0_18px_50px_rgba(93,52,23,0.18)] sm:p-8">
                <h2 className="text-3xl font-semibold text-[#2f1c12]">
                  {poll.poll_name}
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
                      className="w-full min-w-0 rounded-xl border border-[#dec4aa] bg-[#fff9f0] px-4 py-2.5 text-[#3f2a1e] outline-none placeholder:text-[#9e7c65] focus:border-[#b27c55] sm:min-w-48 sm:flex-1"
                    />
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={handleAddOption}
                        disabled={
                          !newOptionLabel.trim() || updatePollMutation.isPending
                        }
                        className="rounded-xl bg-[#6f3f23] px-4 text-sm text-white hover:bg-[#5d331c]"
                      >
                        Add option
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                        disabled={resetPollMutation.isPending}
                        className="rounded-xl border-[#d6b695] bg-[#fff8ee] text-sm text-[#6b4d3a] hover:bg-[#f7ebdb]"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 space-y-3">
                  {sortedChoices.map((option) => {
                    const percentage =
                      totalVotes === 0
                        ? 0
                        : Math.round((option.number_vote / totalVotes) * 100);
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
                          disabled={votePollMutation.isPending}
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="font-medium text-[#3f2a1e]">
                              {option.choice_name}
                              {hasVotedThis ? (
                                <span className="ml-2 text-sm font-normal text-[#8a6448]">
                                  (tap to undo)
                                </span>
                              ) : null}
                            </span>
                            <span className="shrink-0 text-sm text-[#7b5a45]">
                              {option.number_vote} votes ({percentage}%)
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
                  <a
                    className="mt-1 flex cursor-pointer items-center justify-center gap-1.5 text-center text-xs font-medium text-[#6b4d3a] hover:underline"
                    href={poll.qrcode_url || undefined}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <IoMdDownload
                      className="size-4 shrink-0 text-[#7b5134]"
                      aria-hidden
                    />
                    Share QR
                  </a>
                  <img
                    src={poll.qrcode_url || '/mingpvQR.png'}
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
                  {isCopied ? 'Copied' : 'Copy poll link'}
                </Button>
                {isOwner ? (
                  <ConfirmationDialog
                    icon="danger"
                    title="Delete Poll"
                    body="Are you sure you want to delete this poll?"
                    isDone={deletePollMutation.isSuccess}
                    triggerButton={
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-full rounded-xl border-[#e4ccb4] bg-[#fffaf3] px-3 text-sm font-semibold text-[#8b3a2e] shadow-sm hover:bg-[#f6ebde]"
                      >
                        Delete poll
                      </Button>
                    }
                    confirmButton={
                      <Button
                        isLoading={deletePollMutation.isPending}
                        type="button"
                        variant="destructive"
                        onClick={() =>
                          deletePollMutation.mutate({ roomId: poll.room_id })
                        }
                      >
                        Delete Poll
                      </Button>
                    }
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PollDetailRoute;

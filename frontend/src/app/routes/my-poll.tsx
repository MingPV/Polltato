import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { IoMdCopy, IoMdDownload } from 'react-icons/io';
import { IoLogOutOutline } from 'react-icons/io5';
import { useLocation, useNavigate } from 'react-router';
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
import { mergePollFromSocketEvent } from '@/features/polls/api/merge-poll-from-socket';
import {
  Poll,
  PollDeleteEvent,
  PollUpdateEvent,
} from '@/features/polls/api/types';
import { useSignout } from '@/lib/auth';

const MyPollRoute = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [expandedPollIds, setExpandedPollIds] = useState<string[]>([]);
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);
  const [pendingDeleteRoomId, setPendingDeleteRoomId] = useState<string | null>(
    null,
  );
  const myPolls = useMyPolls();
  const signout = useSignout({
    onSuccess: () =>
      navigate(paths.auth.signin.getHref(location.pathname), { replace: true }),
  });
  const deletePollMutation = useDeletePoll();

  useEffect(() => {
    if (!myPolls.data?.length) {
      return;
    }

    const socket = io(env.SOCKET_URL, {
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    const joinAllRooms = () => {
      for (const poll of myPolls.data) {
        socket.emit('join-room', poll.room_id);
      }
    };

    const onUpdatePoll = (payload: PollUpdateEvent) => {
      queryClient.setQueryData<Poll[] | undefined>(
        getMyPollsQueryOptions().queryKey,
        (current) =>
          current?.map((poll) =>
            poll.room_id === payload.room_id
              ? mergePollFromSocketEvent(poll, payload)
              : poll,
          ) ?? current,
      );
    };

    const onDeletePoll = (payload: PollDeleteEvent) => {
      queryClient.setQueryData<Poll[] | undefined>(
        getMyPollsQueryOptions().queryKey,
        (current) =>
          current?.filter((poll) => poll.room_id !== payload.room_id) ??
          current,
      );
      setExpandedPollIds((current) =>
        current.filter((roomId) => roomId !== payload.room_id),
      );
    };

    socket.on('connect', joinAllRooms);
    socket.on('update-poll', onUpdatePoll);
    socket.on('delete-poll', onDeletePoll);

    return () => {
      socket.off('connect', joinAllRooms);
      socket.off('update-poll', onUpdatePoll);
      socket.off('delete-poll', onDeletePoll);
      socket.disconnect();
    };
  }, [myPolls.data, queryClient]);

  const handleCopyLink = async (roomId: string) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${paths.pollDetail.getHref(roomId)}`,
      );
      setCopiedRoomId(roomId);
      window.setTimeout(() => {
        setCopiedRoomId((current) => (current === roomId ? null : current));
      }, 1500);
    } catch {
      // ignore clipboard errors
    }
  };

  const toggleExpanded = (roomId: string) => {
    setExpandedPollIds((current) =>
      current.includes(roomId)
        ? current.filter((id) => id !== roomId)
        : [...current, roomId],
    );
  };

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
            {myPolls.isPending ? (
              <div className="rounded-3xl bg-white/75 p-5 text-[#6b4d3a] shadow-[0_10px_30px_rgba(93,52,23,0.12)]">
                Loading polls...
              </div>
            ) : null}

            {myPolls.data?.length === 0 ? (
              <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-3xl bg-white/75 p-8 text-center text-[#6b4d3a] shadow-[0_10px_30px_rgba(93,52,23,0.12)]">
                <img
                  src="/potato3.png"
                  alt="CloudPoll mascot"
                  className=" h-auto w-full max-w-xs object-contain sm:max-w-xs opacity-70"
                />
                 <p className="text-lg font-medium pb-20">
                  You have not created any polls yet.
                </p>
              </div>
            ) : null}

            {myPolls.data?.map((poll) => {
              const isExpanded = expandedPollIds.includes(poll.room_id);
              const topVote =
                poll.choices.length > 0
                  ? poll.choices.reduce((top, current) =>
                      current.number_vote > top.number_vote ? current : top,
                    )
                  : null;
              const sortedChoices = [...poll.choices].sort(
                (a, b) => b.number_vote - a.number_vote || a.id - b.id,
              );

              return (
                <div
                  key={poll.room_id}
                  onClick={() => toggleExpanded(poll.room_id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleExpanded(poll.room_id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="relative cursor-pointer rounded-3xl bg-white/75 p-5 pr-12 shadow-[0_10px_30px_rgba(93,52,23,0.12)] transition hover:shadow-[0_16px_35px_rgba(93,52,23,0.16)]"
                >
                  <ConfirmationDialog
                    icon="danger"
                    title="Delete Poll"
                    body="Are you sure you want to delete this poll?"
                    isDone={
                      deletePollMutation.isSuccess &&
                      pendingDeleteRoomId === poll.room_id
                    }
                    triggerButton={
                      <button
                        type="button"
                        onPointerDown={(event) => {
                          event.stopPropagation();
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          setPendingDeleteRoomId(poll.room_id);
                        }}
                        onKeyDown={(event) => {
                          event.stopPropagation();
                        }}
                        className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-sm font-semibold text-[#8a6448] hover:bg-[#f9e5d0]"
                        aria-label="Delete poll"
                      >
                        x
                      </button>
                    }
                    confirmButton={
                      <Button
                        isLoading={
                          deletePollMutation.isPending &&
                          pendingDeleteRoomId === poll.room_id
                        }
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          setPendingDeleteRoomId(poll.room_id);
                          deletePollMutation.mutate({ roomId: poll.room_id });
                        }}
                      >
                        Delete Poll
                      </Button>
                    }
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xl font-semibold text-[#2f1c12] sm:text-2xl">
                        {poll.poll_name}
                      </p>
                      <p className="mt-1 text-sm text-[#6b4d3a]">
                        {poll.total_votes} votes
                      </p>
                      <p className="mt-1 text-sm text-[#8a6448]">
                        Top vote: {topVote?.choice_name ?? '-'} (
                        {topVote?.number_vote ?? 0})
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleCopyLink(poll.room_id);
                        }}
                        className="h-10 rounded-xl border-[#e4ccb4] bg-[#fffaf3] px-3 text-sm font-semibold text-[#6b4d3a] shadow-sm hover:bg-[#f6ebde]"
                        aria-label="Copy poll link"
                        icon={<IoMdCopy className="text-base" />}
                      >
                        {copiedRoomId === poll.room_id ? 'Copied' : 'Link'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (poll.qrcode_url) {
                            window.open(
                              poll.qrcode_url,
                              '_blank',
                              'noopener,noreferrer',
                            );
                          }
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
                          navigate(paths.pollDetail.getHref(poll.room_id));
                        }}
                        className="rounded-full border-[#d6b695] bg-[#fff8ee] text-[#6b4d3a] hover:bg-[#f7ebdb]"
                      >
                        View
                      </Button>
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="mt-4 space-y-3 border-t border-[#ead7c3] pt-4">
                      {sortedChoices.map((result) => {
                        const percentage = Math.round(
                          poll.total_votes === 0
                            ? 0
                            : (result.number_vote / poll.total_votes) * 100,
                        );

                        return (
                          <div key={result.id}>
                            <div className="mb-1 flex items-center justify-between text-sm text-[#6b4d3a]">
                              <span>{result.choice_name}</span>
                              <span>{result.number_vote}</span>
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

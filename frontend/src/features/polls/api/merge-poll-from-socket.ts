import { Poll, PollUpdateEvent } from './types';

/**
 * Applies a Socket.IO `update-poll` payload to cached poll data.
 * Ignores stale events (version older than current cache) to avoid races with HTTP / out-of-order delivery.
 */
export function mergePollFromSocketEvent(
  current: Poll | undefined,
  payload: PollUpdateEvent,
): Poll {
  if (current !== undefined && payload.version < current.version) {
    return current;
  }

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
}

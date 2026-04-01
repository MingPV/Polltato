import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { ApiEnvelope, Poll } from './types';

export const getPoll = async (roomId: string): Promise<Poll> => {
  const response = (await api.get(`/polls/${roomId}`)) as ApiEnvelope<Poll>;
  return response.data;
};

export const getPollQueryOptions = (roomId: string) =>
  queryOptions({
    queryKey: ['poll', roomId],
    queryFn: () => getPoll(roomId),
    enabled: Boolean(roomId),
  });

type UsePollOptions = {
  roomId: string;
  queryConfig?: QueryConfig<typeof getPollQueryOptions>;
};

export const usePoll = ({ roomId, queryConfig }: UsePollOptions) =>
  useQuery({
    ...getPollQueryOptions(roomId),
    ...queryConfig,
  });

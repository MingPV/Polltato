import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { ApiEnvelope, MyPollsResponse, Poll } from './types';

export const getMyPolls = async (): Promise<Poll[]> => {
  const response = (await api.get('/polls')) as ApiEnvelope<MyPollsResponse>;
  return response.data.polls;
};

export const getMyPollsQueryOptions = () =>
  queryOptions({
    queryKey: ['my-polls'],
    queryFn: getMyPolls,
  });

type UseMyPollsOptions = {
  queryConfig?: QueryConfig<typeof getMyPollsQueryOptions>;
};

export const useMyPolls = ({ queryConfig }: UseMyPollsOptions = {}) =>
  useQuery({
    ...getMyPollsQueryOptions(),
    ...queryConfig,
  });

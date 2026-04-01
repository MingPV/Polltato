import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { getMyPollsQueryOptions } from './get-my-polls';
import { Poll } from './types';

export type CreatePollInput = {
  poll_name: string;
  is_multi: boolean;
  choices: string[];
};

export const createPoll = (data: CreatePollInput): Promise<Poll> => {
  return api.post('/polls', data);
};

type UseCreatePollOptions = {
  mutationConfig?: MutationConfig<typeof createPoll>;
};

export const useCreatePoll = ({
  mutationConfig,
}: UseCreatePollOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    ...restConfig,
    mutationFn: createPoll,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: getMyPollsQueryOptions().queryKey,
      });
      onSuccess?.(...args);
    },
  });
};

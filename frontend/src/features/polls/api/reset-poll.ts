import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { getMyPollsQueryOptions } from './get-my-polls';
import { getPollQueryOptions } from './get-poll';
import { ApiEnvelope, Poll } from './types';

export type ResetPollInput = {
  roomId: string;
};

export const resetPoll = async ({ roomId }: ResetPollInput): Promise<Poll> => {
  const response = (await api.post(
    `/polls/${roomId}/reset`,
  )) as ApiEnvelope<Poll>;
  return response.data;
};

type UseResetPollOptions = {
  mutationConfig?: MutationConfig<typeof resetPoll>;
};

export const useResetPoll = ({ mutationConfig }: UseResetPollOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    ...restConfig,
    mutationFn: resetPoll,
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(
        getPollQueryOptions(variables.roomId).queryKey,
        data,
      );
      queryClient.invalidateQueries({
        queryKey: getMyPollsQueryOptions().queryKey,
      });
      onSuccess?.(data, variables, context);
    },
  });
};

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { getMyPollsQueryOptions } from './get-my-polls';
import { getPollQueryOptions } from './get-poll';

export type DeletePollInput = {
  roomId: string;
};

export const deletePoll = async ({
  roomId,
}: DeletePollInput): Promise<void> => {
  await api.delete(`/polls/${roomId}`);
};

type UseDeletePollOptions = {
  mutationConfig?: MutationConfig<typeof deletePoll>;
};

export const useDeletePoll = ({
  mutationConfig,
}: UseDeletePollOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    ...restConfig,
    mutationFn: deletePoll,
    onSuccess: (data, variables, context) => {
      queryClient.removeQueries({
        queryKey: getPollQueryOptions(variables.roomId).queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: getMyPollsQueryOptions().queryKey,
      });
      onSuccess?.(data, variables, context);
    },
  });
};

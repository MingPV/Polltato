import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { getMyPollsQueryOptions } from './get-my-polls';
import { getPollQueryOptions } from './get-poll';
import { ApiEnvelope, Poll } from './types';

export type UpdatePollInput = {
  roomId: string;
  poll_name?: string;
  is_multi?: boolean;
  deleted_choices?: number[];
  added_choices?: string[];
  edited_choices?: Array<{
    id: number;
    choice_name: string;
  }>;
};

export const updatePoll = async ({
  roomId,
  ...data
}: UpdatePollInput): Promise<Poll> => {
  const response = (await api.patch(
    `/polls/${roomId}`,
    data,
  )) as ApiEnvelope<Poll>;
  return response.data;
};

type UseUpdatePollOptions = {
  mutationConfig?: MutationConfig<typeof updatePoll>;
};

export const useUpdatePoll = ({
  mutationConfig,
}: UseUpdatePollOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    ...restConfig,
    mutationFn: updatePoll,
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

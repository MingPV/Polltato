import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { getPollQueryOptions } from './get-poll';
import { ApiEnvelope, Poll } from './types';

export type VotePollInput = {
  roomId: string;
  vote_choice_id: number[];
  unvote_choice_id: number[];
};

export const votePoll = async ({
  roomId,
  ...data
}: VotePollInput): Promise<Poll> => {
  const response = (await api.post(
    `/polls/${roomId}/votes`,
    data,
  )) as ApiEnvelope<Poll>;
  return response.data;
};

type UseVotePollOptions = {
  mutationConfig?: MutationConfig<typeof votePoll>;
};

export const useVotePoll = ({ mutationConfig }: UseVotePollOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    ...restConfig,
    mutationFn: votePoll,
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(
        getPollQueryOptions(variables.roomId).queryKey,
        data,
      );
      onSuccess?.(data, variables, context);
    },
  });
};

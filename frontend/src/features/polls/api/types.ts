export type ApiEnvelope<T> = {
  message: string;
  data: T;
};

export type PollChoice = {
  id: number;
  choice_name: string;
  number_vote: number;
};

export type Poll = {
  id: number;
  poll_name: string;
  is_multi: boolean;
  room_id: string;
  qrcode_url: string;
  choices: PollChoice[];
  total_votes: number;
  version: number;
  create_time: string;
  update_time: string;
};

export type MyPollsResponse = {
  polls: Poll[];
  total_polls: number;
};

export type PollSocketChoice = {
  id: number;
  choice_name: string;
  number_vote: number;
};

export type PollSocketData = {
  id: number;
  poll_name: string;
  is_multi: boolean;
  room_id: string;
  choices: PollSocketChoice[];
  update_time: string;
};

export type PollUpdateEvent = {
  from: string;
  room_id: string;
  type:
    | 'add-vote'
    | 'add-choice'
    | 'delete-choice'
    | 'reset-poll'
    | 'update-poll'
    | 'delete-poll';
  version: number;
  data: PollSocketData;
};

export type PollDeleteEvent = {
  room_id: string;
  name: string;
};

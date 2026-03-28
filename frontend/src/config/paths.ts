export const paths = {
  home: {
    path: '/',
    getHref: () => '/',
  },

  auth: {
    signup: {
      path: '/signup',
      getHref: (redirectTo?: string | null | undefined) =>
        `/signup${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
    signin: {
      path: '/signin',
      getHref: (redirectTo?: string | null | undefined) =>
        `/signin${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
  },

  socketDemo: {
    path: '/socket-demo',
    getHref: () => '/socket-demo',
  },

  pollCreate: {
    path: '/poll-create',
    getHref: () => '/poll-create',
  },

  myPoll: {
    path: '/my-poll',
    getHref: () => '/my-poll',
  },

  pollDetail: {
    path: '/poll/:pollId',
    getHref: (pollId: string) => `/poll/${pollId}`,
  },

  app: {
    root: {
      path: '/app',
      getHref: () => '/app',
    },
    users: {
      path: 'users',
      getHref: () => '/app/users',
    },
    profile: {
      path: 'profile',
      getHref: () => '/app/profile',
    },
  },
} as const;

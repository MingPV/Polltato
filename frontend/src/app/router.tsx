import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { paths } from '@/config/paths';
import { ProtectedRoute } from '@/lib/auth';

import {
  default as AppRoot,
  ErrorBoundary as AppRootErrorBoundary,
} from './routes/app/root';
import MyPollRoute from './routes/my-poll';
import PollCreateRoute from './routes/poll-create';
import PollDetailRoute from './routes/poll-detail';

const convert = (queryClient: QueryClient) => (m: any) => {
  const { clientLoader, clientAction, default: Component, ...rest } = m;
  return {
    ...rest,
    loader: clientLoader?.(queryClient),
    action: clientAction?.(queryClient),
    Component,
  };
};

export const createAppRouter = (queryClient: QueryClient) =>
  createBrowserRouter([
    {
      path: paths.home.path,
      lazy: () => import('./routes/landing').then(convert(queryClient)),
    },
    {
      path: paths.auth.signup.path,
      lazy: () => import('./routes/auth/signup').then(convert(queryClient)),
    },
    {
      path: paths.auth.signin.path,
      lazy: () => import('./routes/auth/signin').then(convert(queryClient)),
    },
    {
      path: paths.socketDemo.path,
      element: (
        <ProtectedRoute>
          <Outlet />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          lazy: () => import('./routes/socket-demo').then(convert(queryClient)),
        },
      ],
    },
    {
      path: paths.pollCreate.path,
      element: (
        <ProtectedRoute>
          <PollCreateRoute />
        </ProtectedRoute>
      ),
    },
    {
      path: paths.myPoll.path,
      element: (
        <ProtectedRoute>
          <MyPollRoute />
        </ProtectedRoute>
      ),
    },
    {
      path: paths.pollDetail.path,
      Component: PollDetailRoute,
    },
    {
      path: paths.app.root.path,
      element: (
        <ProtectedRoute>
          <AppRoot />
        </ProtectedRoute>
      ),
      ErrorBoundary: AppRootErrorBoundary,
      children: [
        {
          index: true,
          element: <Navigate to={paths.myPoll.getHref()} replace />,
        },
        {
          path: paths.app.users.path,
          lazy: () => import('./routes/app/users').then(convert(queryClient)),
        },
        {
          path: paths.app.profile.path,
          lazy: () => import('./routes/app/profile').then(convert(queryClient)),
        },
      ],
    },
    {
      path: '*',
      lazy: () => import('./routes/not-found').then(convert(queryClient)),
    },
  ]);

export const AppRouter = () => {
  const queryClient = useQueryClient();

  const router = useMemo(() => createAppRouter(queryClient), [queryClient]);

  return <RouterProvider router={router} />;
};

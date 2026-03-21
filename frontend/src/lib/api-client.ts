import Axios, { InternalAxiosRequestConfig } from 'axios';

import { useNotifications } from '@/components/ui/notifications';
import { env } from '@/config/env';
import { paths } from '@/config/paths';

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  if (config.headers) {
    config.headers.Accept = 'application/json';
  }
  return config;
}

export const api = Axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
});

api.interceptors.request.use(authRequestInterceptor);
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const reqUrl = String(error.config?.url ?? '').split('?')[0];
    const isSessionProbe =
      error.response?.status === 401 &&
      (reqUrl === '/me' || reqUrl.endsWith('/me'));

    const data = error.response?.data;
    const message =
      (typeof data === 'object' && data && 'error' in data && data.error) ||
      (typeof data === 'object' && data && 'message' in data && data.message) ||
      error.message;

    if (!isSessionProbe) {
      useNotifications.getState().addNotification({
        type: 'error',
        title: 'Error',
        message: String(message),
      });
    }

    if (error.response?.status === 401) {
      const url = String(error.config?.url ?? '').split('?')[0];
      if (url !== '/me' && !url.endsWith('/me')) {
        const redirectTo =
          new URLSearchParams(window.location.search).get('redirectTo') ||
          window.location.pathname;
        window.location.href = paths.auth.signin.getHref(redirectTo);
      }
    }

    return Promise.reject(error);
  },
);

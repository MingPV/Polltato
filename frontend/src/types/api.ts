// API-aligned types for CloudPoll backend; legacy fields kept for MSW / older UI.

export type BaseEntity = {
  id: string;
  createdAt: number;
};

export type Entity<T> = {
  [K in keyof T]: T[K];
} & BaseEntity;

export type Meta = {
  page: number;
  total: number;
  totalPages: number;
};

/** Matches backend `UserResponse` (+ fields used by dashboard / authorization mocks). */
export type User = Entity<{
  email: string;
  name: string;
  role?: 'ADMIN' | 'USER';
  firstName?: string;
  lastName?: string;
  teamId?: string;
  bio?: string;
}>;

export type AuthResponse = {
  token: string;
  user: User;
};

export type Order = {
  id: number;
  total: number;
};

export type Team = Entity<{
  name: string;
  description: string;
}>;

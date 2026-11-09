import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { User } from './types';

export interface AuthState { user: User | null; loading: boolean; signIn(email: string): Promise<void>; signUp(i: { email: string; displayName: string; username: string; role: User['role'] }): Promise<void>; signOut(): Promise<void> }

const ME_KEY = ['marketplace', 'me'] as const;
const Ctx = createContext<AuthState>({ user: null, loading: false, signIn: async () => {}, signUp: async () => {}, signOut: async () => {} });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ME_KEY, queryFn: () => api.currentUser(), staleTime: Infinity, retry: false });

  // Identity changed: set the new user and refetch everything else (orders, favorites, inbox...).
  const apply = useCallback(
    async (u: User | null) => {
      qc.setQueryData(ME_KEY, u);
      await qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'marketplace' || q.queryKey[1] !== 'me' });
    },
    [qc],
  );

  const value = useMemo<AuthState>(
    () => ({
      user: data ?? null,
      loading: isLoading,
      signIn: async (email) => apply(await api.signIn(email)),
      signUp: async (i) => apply(await api.signUp(i)),
      signOut: async () => {
        await api.signOut();
        await apply(null);
      },
    }),
    [data, isLoading, apply],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
export const useAuth = () => useContext(Ctx);

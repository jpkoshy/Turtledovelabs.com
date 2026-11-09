import { createContext, useContext, type ReactNode } from 'react';
import type { User } from './types';
// STUB — owned by agent B13. Provider is already mounted in App.tsx; implement with react-query + api.currentUser/signIn/signUp/signOut.
export interface AuthState { user: User | null; loading: boolean; signIn(email: string): Promise<void>; signUp(i: { email: string; displayName: string; username: string; role: User['role'] }): Promise<void>; signOut(): Promise<void> }
const Ctx = createContext<AuthState>({ user: null, loading: false, signIn: async () => {}, signUp: async () => {}, signOut: async () => {} });
export const AuthProvider = ({ children }: { children: ReactNode }) => <Ctx.Provider value={useContext(Ctx)}>{children}</Ctx.Provider>;
export const useAuth = () => useContext(Ctx);

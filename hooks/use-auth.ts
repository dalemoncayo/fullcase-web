import { useCallback } from 'react';
import { useAuth as useAuthContext } from '@/components/shared/auth-provider';
import {
  logOut as authLogOut,
  registerWithEmail as authRegisterWithEmail,
  signInWithEmail as authSignInWithEmail,
  signInWithGoogle as authSignInWithGoogle,
} from '@/services/auth-service';

export function useAuth() {
  const context = useAuthContext();

  const signOut = useCallback(async () => {
    await authLogOut();
  }, []);

  const signInWithEmail = useCallback(async (email: string, pass: string) => {
    return authSignInWithEmail(email, pass);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    return authSignInWithGoogle();
  }, []);

  const registerWithEmail = useCallback(
    async (email: string, pass: string, name: string) => {
      return authRegisterWithEmail(email, pass, name);
    },
    [],
  );

  return {
    ...context,
    signOut,
    signInWithEmail,
    signInWithGoogle,
    registerWithEmail,
  };
}

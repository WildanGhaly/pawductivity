// Web stub: real Google Sign-In is native-only, so the web build always reports it as
// unsupported and the caller falls back to the local mock.
export type GoogleUser = { email: string; name?: string; photo?: string };

export function isGoogleSupported(): boolean {
  return false;
}

export async function signInWithGoogle(): Promise<GoogleUser | null> {
  return null;
}

export async function signOutGoogle(): Promise<void> {
  /* no-op */
}

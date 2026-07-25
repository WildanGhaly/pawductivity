import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Real Google Sign-In. The native module is not present in Expo Go / web, so it is
// lazily required and guarded (same approach as billing.ts). Falls back to null when
// unavailable, letting the caller degrade to the local mock.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const webClientId = (Constants.expoConfig?.extra as any)?.googleWebClientId as string | undefined;

function mod(): any | null {
  if (Platform.OS === 'web' || isExpoGo || !webClientId) return null;
  try {
    return require('@react-native-google-signin/google-signin');
  } catch {
    return null;
  }
}

let configured = false;

export function isGoogleSupported(): boolean {
  return !!mod() && !!webClientId;
}

export type GoogleUser = { email: string; name?: string; photo?: string };

export async function signInWithGoogle(): Promise<GoogleUser | null> {
  const m = mod();
  if (!m) return null;
  const { GoogleSignin } = m;
  if (!configured) {
    GoogleSignin.configure({ webClientId });
    configured = true;
  }
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const res = await GoogleSignin.signIn();
  // Support both the current ({data:{user}}) and older ({user}) response shapes.
  const user = res?.data?.user ?? res?.user ?? null;
  if (!user?.email) return null;
  return { email: user.email, name: user.name ?? undefined, photo: user.photo ?? undefined };
}

export async function signOutGoogle(): Promise<void> {
  const m = mod();
  if (!m) return;
  try {
    await m.GoogleSignin.signOut();
  } catch {
    /* ignore */
  }
}

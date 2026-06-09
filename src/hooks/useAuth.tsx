import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { User } from '@supabase/supabase-js';
import { getDeviceLanguage } from '../i18n';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { SocialLogin } from '@capgo/capacitor-social-login'; // Import Native Social Login

// Retrieve the matching Client IDs from your environment variables
const GOOGLE_WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || "";
const GOOGLE_IOS_CLIENT_ID = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID || "";

// Helper to determine the redirect URI depending on the platform (used in non-native redirect fallbacks)
export const getRedirectUri = () => {
  if (Capacitor.isNativePlatform()) {
    return 'com.gonzalo.puzzlr://login-callback';
  }
  return window.location.origin;
};

/**
 * Generates a cryptographically strong, URL-safe random nonce.
 */
function getUrlSafeNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hashes a string using SHA-256 and returns its hex-encoded representation.
 */
async function sha256Hash(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  language: string;
  lifetime_points: number;
  spendable_points: number;
  equipped_character_id: string | null;
  equipped_badge_id: string | null;
  is_admin: boolean;
  streak_count: number;
  last_played_date: string | null;
  streak_protectors: number;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateLanguage: (lang: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, userMetadata?: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else if (!data) {
        // Create profile for user
        const email = userMetadata?.email || '';
        const rawUsername = userMetadata?.username || userMetadata?.full_name || userMetadata?.name || email.split('@')[0] || `user_${userId.slice(0, 5)}`;
        const cleanUsername = rawUsername.trim() || `user_${userId.slice(0, 5)}`;

        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: cleanUsername,
            avatar_url: userMetadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
            language: getDeviceLanguage(),
            lifetime_points: 0,
            spendable_points: 0,
          })
          .select()
          .single();

        if (profileError) {
          console.error('Error creating profile for OAuth user:', profileError);
          setProfile(null);
        } else {
          // Seed default cosmetic unlock (Default Avatar)
          await supabase
            .from('user_cosmetics')
            .insert({
              profile_id: userId,
              cosmetic_id: '11111111-1111-1111-1111-111111111111',
            });
          setProfile(newProfile);
        }
      } else {
        setProfile(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.user_metadata);
    }
  };

  useEffect(() => {
    // Initialize Capgo Social Login on native platform
    if (Capacitor.isNativePlatform()) {
      const isIOS = Capacitor.getPlatform() === 'ios';

      SocialLogin.initialize({
        google: {
          webClientId: GOOGLE_WEB_CLIENT_ID,
          // Only supply iOSClientId if running natively on iOS
          ...(isIOS && {
            iOSClientId: GOOGLE_IOS_CLIENT_ID,
          }),
          mode: 'online', // Standard online flow is recommended for direct token logins
        },
      }).catch(err => {
        console.error("[SocialLogin] Initialization failed:", err);
      });
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.user_metadata);
      }
      setLoading(false);
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.user_metadata);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Keep deep link callback listener as a fallback or for other custom redirect actions
    let appUrlOpenListener: { remove: () => void } | null = null;
    if (Capacitor.isNativePlatform()) {
      App.addListener('appUrlOpen', async ({ url }) => {
        if (url.includes('access_token') || url.includes('code=') || url.includes('error=')) {
          // Close the in-app browser before processing the session
          await Browser.close();

          const urlObj = new URL(url);
          const hashParams = new URLSearchParams(urlObj.hash.replace('#', ''));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          } else {
            // PKCE flow fallback
            await supabase.auth.exchangeCodeForSession(url);
          }
        }
      }).then(listener => {
        appUrlOpenListener = listener;
      });
    }

    return () => {
      subscription.unsubscribe();
      appUrlOpenListener?.remove();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }

    if (data.user) {
      await fetchProfile(data.user.id, data.user.user_metadata);
    }
    setLoading(false);
    return { success: true };
  };

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          username: cleanUsername,
        },
      },
    });

    if (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }

    // If session is immediately available (e.g. auto-confirm is enabled), fetch/create profile
    if (data.user && data.session) {
      await fetchProfile(data.user.id, data.user.user_metadata);
    }
    
    setLoading(false);
    return { success: true };
  };

  const signInWithGoogle = async () => {
    setLoading(true);

    if (Capacitor.isNativePlatform()) {
      try {
        // 1. Generate cryptographic nonce pair (Required by Supabase on iOS to avoid "Nonces mismatch")
        const rawNonce = getUrlSafeNonce();
        const nonceDigest = await sha256Hash(rawNonce);

        // 2. Clear iOS cached token to force a fresh Google handshake with the new nonce
        try {
          await SocialLogin.logout({ provider: 'google' });
          console.log("[SocialLogin] Cleared cached iOS Google session.");
        } catch (logoutErr) {
          // Ignore logout errors if there was no active native session
          console.log("[SocialLogin] No active cached session to clear.");
        }

        // 3. Trigger Native Sign-In passing the fresh hashed digest
        const result = await SocialLogin.login({
          provider: 'google',
          options: {
            scopes: ['email', 'profile'],
            nonce: nonceDigest, // Google receives the SHA-256 hashed digest
          },
        });

        const googleResult = result.result;
        if (!googleResult) {
          throw new Error('Google Sign-In was cancelled or failed.');
        }

        // TYPE GUARD: Assert that we have received an 'online' token response
        if (googleResult.responseType !== 'online') {
          throw new Error('Google Sign-In response was not in online mode.');
        }

        const idToken = googleResult.idToken;
        if (!idToken) {
          throw new Error('Google Sign-In failed to return a valid token.');
        }

        console.log("[SocialLogin] Received native token, signing into Supabase...");

        // 4. Submit the retrieved token directly to Supabase Auth along with the rawNonce
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
          nonce: rawNonce, // Supabase receives the raw nonce to hash and compare
        });

        if (error) {
          setLoading(false);
          console.error("[SocialLogin] Supabase sign-in error:", error);
          return { success: false, error: error.message };
        }

        setLoading(false);
        return { success: true };
      } catch (err: any) {
        setLoading(false);
        console.error("[SocialLogin] Native Google login caught error:", err);
        return { success: false, error: err.message || 'Native login failed' };
      }
    } else {
      // Web Fallback: Keep the normal web redirect flow
      const redirectTo = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });

      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }

      return { success: true };
    }
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const updateLanguage = async (lang: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ language: lang })
      .eq('id', user.id);
    if (!error) {
      setProfile((prev) => prev ? { ...prev, language: lang } : null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateLanguage,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
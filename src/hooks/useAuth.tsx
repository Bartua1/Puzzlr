import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { User } from '@supabase/supabase-js';
import { getDeviceLanguage } from '../i18n';

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
  signIn: (username: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (username: string) => Promise<{ success: boolean; error?: string }>;
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
        // Create profile for OAuth user
        const email = userMetadata?.email || '';
        const rawUsername = userMetadata?.full_name || userMetadata?.name || email.split('@')[0] || `user_${userId.slice(0, 5)}`;
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
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.user_metadata);
      }
      setLoading(false);
    });

    // Listen to changes
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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // For a basic demo, we'll allow sign in and registration with simple username.
  // We'll create email/password logins automatically behind the scenes (e.g. username@puzzlr.com / password)
  const signIn = async (username: string) => {
    setLoading(true);
    const email = `${username.toLowerCase().trim()}@puzzlr.com`;
    const password = 'PermanentPassword123!';

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
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

  const signUp = async (username: string) => {
    setLoading(true);
    const cleanUsername = username.trim();
    const email = `${cleanUsername.toLowerCase()}@puzzlr.com`;
    const password = 'PermanentPassword123!';

    // Sign up Auth User
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }

    if (data.user) {
      // Create corresponding Profile row
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username: cleanUsername,
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
          language: getDeviceLanguage(),
          lifetime_points: 0,
          spendable_points: 0,
        });

      if (profileError) {
        setLoading(false);
        return { success: false, error: profileError.message };
      }

      // Seed default cosmetic unlock (Default Avatar)
      await supabase
        .from('user_cosmetics')
        .insert({
          profile_id: data.user.id,
          cosmetic_id: '11111111-1111-1111-1111-111111111111',
        });

      await fetchProfile(data.user.id, data.user.user_metadata);
    }
    setLoading(false);
    return { success: true };
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }

    return { success: true };
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

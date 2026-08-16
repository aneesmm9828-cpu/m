import { create } from 'zustand';
import { supabase } from '../utils/supabaseConfig';

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  name: string;
  username: string;
  profilePicUrl?: string;
  picture?: string;
  bio?: string;
  link?: string;
  followersCount: number;
  followingCount: number;
  createdAt: string;
}

interface AuthState {
  user: UserProfile | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
  initialize: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setIsLoading: (isLoading) => set({ isLoading }),

  initialize: async () => {
    if (!supabase) {
      set({ isLoading: false });
      return;
    }

    // 1. Get initial session
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      console.log('Session found on init, fetching profile for:', session.user.id);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) console.error('Error fetching profile on init:', error);

      set({
        session,
        isAuthenticated: true,
        user: profile ? {
          ...profile,
          user_id: session.user.id,
          name: profile.full_name,
          picture: profile.avatar_url,
          profilePicUrl: profile.avatar_url
        } : {
          id: session.user.id,
          user_id: session.user.id,
          email: session.user.email,
          name: 'New User',
          username: 'user_' + session.user.id.substring(0, 5),
          followersCount: 0,
          followingCount: 0,
          createdAt: new Date().toISOString()
        }
      });
    }

    // 2. Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Supabase Auth Event:', event, !!session);

      if (session) {
        console.log('Auth state change, fetching profile for:', session.user.id);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) console.error('Error fetching profile on change:', error);

        set({
          session,
          isAuthenticated: true,
          user: profile ? {
            ...profile,
            user_id: session.user.id,
            name: profile.full_name,
            picture: profile.avatar_url,
            profilePicUrl: profile.avatar_url
          } : {
            id: session.user.id,
            user_id: session.user.id,
            email: session.user.email,
            name: 'New User',
            username: 'user_' + session.user.id.substring(0, 5),
            followersCount: 0,
            followingCount: 0,
            createdAt: new Date().toISOString()
          }
        });
      } else {
        set({ session: null, user: null, isAuthenticated: false });
      }
      set({ isLoading: false });
    });

    set({ isLoading: false });
  },

  logout: async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    set({ user: null, session: null, isAuthenticated: false });
  },
}));

import { create } from 'zustand';
import { supabase } from '../utils/supabaseConfig';

export interface SkillProfile {
  profile_id: string;
  is_active: boolean;
  bio: string;
  categories: string[];
  skills: string[];
  location_name: string;
  is_verified: boolean;
  rating_avg: number;
  review_count: number;
}

export interface Gig {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  price_basic: number;
  price_standard?: number;
  price_premium?: number;
  delivery_days_basic: number;
  delivery_days_standard?: number;
  delivery_days_premium?: number;
  location_name: string;
  status: 'active' | 'paused' | 'deleted';
  media?: GigMedia[];
}

export interface GigMedia {
  id: string;
  gig_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  position: number;
}

export interface Order {
  id: string;
  gig_id: string;
  buyer_id: string;
  seller_id: string;
  package_tier: 'basic' | 'standard' | 'premium';
  amount: number;
  status: 'requested' | 'accepted' | 'rejected' | 'in_progress' | 'delivered' | 'completed' | 'cancelled' | 'disputed';
  escrow_status: 'pending' | 'held' | 'released' | 'refunded';
  created_at: string;
  gig?: Gig;
}

interface SkillState {
  skillProfile: SkillProfile | null;
  gigs: Gig[];
  activeOrders: Order[];
  isLoading: boolean;

  fetchSkillProfile: (profileId: string) => Promise<void>;
  updateSkillProfile: (profileId: string, updates: Partial<SkillProfile>) => Promise<void>;
  createGig: (gigData: Omit<Gig, 'id' | 'seller_id' | 'status'>) => Promise<void>;
  fetchGigs: (filters?: { category?: string; query?: string; location?: string }) => Promise<void>;
  fetchOrders: (role: 'buyer' | 'seller') => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
}

export const useSkillStore = create<SkillState>((set, get) => ({
  skillProfile: null,
  gigs: [],
  activeOrders: [],
  isLoading: false,

  fetchSkillProfile: async (profileId) => {
    if (!supabase) return;
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('skill_profiles')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error) console.error('Error fetching skill profile:', error);
    set({ skillProfile: data, isLoading: false });
  },

  updateSkillProfile: async (profileId, updates) => {
    if (!supabase) return;
    set({ isLoading: true });
    const { error } = await supabase
      .from('skill_profiles')
      .upsert({ profile_id: profileId, ...updates });

    if (error) {
      console.error('Error updating skill profile:', error);
    } else {
      await get().fetchSkillProfile(profileId);
    }
    set({ isLoading: false });
  },

  createGig: async (gigData) => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set({ isLoading: true });
    const { data, error } = await supabase
      .from('gigs')
      .insert({ ...gigData, seller_id: user.id })
      .select()
      .single();

    if (error) {
      console.error('Error creating gig:', error);
    } else {
      set({ gigs: [data, ...get().gigs] });
    }
    set({ isLoading: false });
  },

  fetchGigs: async (filters) => {
    if (!supabase) return;
    set({ isLoading: true });
    let query = supabase.from('gigs').select('*, media:gig_media(*)').eq('status', 'active');

    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.query) query = query.ilike('title', `%${filters.query}%`);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) console.error('Error fetching gigs:', error);
    set({ gigs: data || [], isLoading: false });
  },

  fetchOrders: async (role) => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set({ isLoading: true });
    const column = role === 'buyer' ? 'buyer_id' : 'seller_id';
    const { data, error } = await supabase
      .from('orders')
      .select('*, gig:gigs(*)')
      .eq(column, user.id)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching orders:', error);
    set({ activeOrders: data || [], isLoading: false });
  },

  updateOrderStatus: async (orderId, status) => {
    if (!supabase) return;
    set({ isLoading: true });
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
    } else {
      set({
        activeOrders: get().activeOrders.map(o => o.id === orderId ? { ...o, status } : o)
      });
    }
    set({ isLoading: false });
  },
}));

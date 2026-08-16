import { supabase } from './supabaseConfig';

export const checkSupabaseConnection = async () => {
  console.log('[DEBUG] Starting Supabase Connection Check...');

  if (!supabase) {
    console.error('[DEBUG] Supabase client is NULL. Check your .env keys!');
    return { success: false, error: 'Client is null' };
  }

  try {
    // 1. Check Auth state
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    console.log('[DEBUG] Auth Session exists:', !!session);
    if (authError) console.error('[DEBUG] Auth Error:', authError.message);

    // 2. Try to fetch one profile (Test Table Access)
    const { data, error, status } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error(`[DEBUG] Table Access Error (Status ${status}):`, error.message);
      console.error('[DEBUG] Hint: Ensure the "profiles" table exists and RLS policies allow selection.');
      return { success: false, error: error.message };
    }

    console.log('[DEBUG] Table Access Success. Profile count:', data);
    return { success: true, count: data };

  } catch (err: any) {
    console.error('[DEBUG] Unexpected Connection Error:', err.message);
    return { success: false, error: err.message };
  }
};

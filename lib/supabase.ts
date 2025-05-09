import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth helper functions
export const signUp = async (email: string, password: string, userType: 'customer' | 'shop_owner') => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        user_type: userType,
      },
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Data fetching helper functions
export const fetchShops = async () => {
  const { data, error } = await supabase
    .from('shops')
    .select('*');
  return { data, error };
};

export const fetchOrders = async (userId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId);
  return { data, error };
};

export const createOrder = async (orderData: any) => {
  const { data, error } = await supabase
    .from('orders')
    .insert([orderData])
    .select();
  return { data, error };
}; 
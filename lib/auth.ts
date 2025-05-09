import { supabase } from './supabase';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type UserRole = 'customer' | 'shop_owner' | 'admin';

export type User = {
  id: string;
  phone: string;
  role: UserRole;
  created_at: string;
  profile?: UserProfile;
};

export type UserProfile = {
  id: string;
  phone_number: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  default_address_id: string | null;
};

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set: (state: Partial<AuthState>) => void) => ({
      user: null,
      session: null,
      loading: true,
      setUser: (user: User | null) => set({ user }),
      setSession: (session: Session | null) => set({ session }),
      setLoading: (loading: boolean) => set({ loading }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

// Initialize auth state
export const initializeAuth = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return;
  }

  if (session) {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, profile:user_profiles(*)')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      console.error('Error getting user:', userError);
      return;
    }

    useAuthStore.getState().setUser(user);
    useAuthStore.getState().setSession(session);
  }

  useAuthStore.getState().setLoading(false);
};

// Sign in with phone number
export const signInWithPhone = async (phone: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error signing in with phone:', error);
    return { success: false, error };
  }
};

// Verify OTP
export const verifyOTP = async (phone: string, token: string) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) throw error;

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, profile:user_profiles(*)')
      .eq('id', data.user.id)
      .single();

    if (userError) throw userError;

    useAuthStore.getState().setUser(user);
    useAuthStore.getState().setSession(data.session);
    return { success: true, data: user };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, error };
  }
};

// Sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setSession(null);
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error };
  }
};

// Update user profile
export const updateProfile = async (profile: Partial<UserProfile>) => {
  try {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('user_profiles')
      .update(profile)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Update local state
    useAuthStore.getState().setUser({
      ...user,
      profile: data,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error };
  }
};

// Update user role
export const updateUserRole = async (role: UserRole) => {
  try {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Update local state
    useAuthStore.getState().setUser({
      ...user,
      role,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error };
  }
};

class AuthService {
  private static instance: AuthService;
  private currentUser: UserProfile | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async initialize(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await this.fetchUserProfile(session.user.id);
    }
  }

  private async fetchUserProfile(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return;
    }

    this.currentUser = data;
  }

  async sendVerificationCode(phoneNumber: string): Promise<boolean> {
    try {
      // Generate a 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store the verification code with expiration (15 minutes)
      const { error } = await supabase
        .from('phone_verification')
        .insert({
          phone_number: phoneNumber,
          verification_code: verificationCode,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        });

      if (error) throw error;

      // In a real app, you would integrate with an SMS service here
      console.log('Verification code:', verificationCode); // For development only

      return true;
    } catch (error) {
      console.error('Error sending verification code:', error);
      return false;
    }
  }

  async verifyPhoneNumber(
    phoneNumber: string,
    code: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('phone_verification')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('verification_code', code)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verifying phone number:', error);
      return false;
    }
  }

  async signUp(
    phoneNumber: string,
    role: UserRole,
    fullName: string
  ): Promise<boolean> {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        phone: phoneNumber,
        password: Math.random().toString(36).slice(-8), // Generate random password
      });

      if (authError || !authData.user) throw authError;

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          phone_number: phoneNumber,
          role,
          full_name: fullName,
        });

      if (profileError) throw profileError;

      await this.fetchUserProfile(authData.user.id);
      return true;
    } catch (error) {
      console.error('Error signing up:', error);
      return false;
    }
  }

  async signIn(phoneNumber: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        phone: phoneNumber,
        password: '', // This would be handled by the SMS code in production
      });

      if (error || !data.user) throw error;

      await this.fetchUserProfile(data.user.id);
      return true;
    } catch (error) {
      console.error('Error signing in:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      this.currentUser = null;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<boolean> {
    try {
      if (!this.currentUser) throw new Error('No user logged in');

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', this.currentUser.id);

      if (error) throw error;

      await this.fetchUserProfile(this.currentUser.id);
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  hasRole(role: UserRole): boolean {
    return this.currentUser?.role === role;
  }
}

export const authService = AuthService.getInstance(); 
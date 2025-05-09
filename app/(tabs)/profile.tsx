import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { useState, useEffect } from 'react';
import { 
  User, Settings, CreditCard, MapPin, Bell, MessageSquare, Shield, LogOut
} from 'lucide-react-native';
import Button from '@/components/ui/Button';
import ProfileMenuButton from '@/components/profile/ProfileMenuButton';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  user_type: 'customer' | 'shop_owner';
  created_at: string;
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      setProfile(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      router.replace('/auth/login');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign out');
    }
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!profile) return;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={36} color={colors.primary} />
            </View>
          )}
          <TouchableOpacity style={styles.editAvatarButton}>
            <Text style={styles.editAvatarText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.full_name || 'Guest User'}</Text>
          <Text style={styles.profileEmail}>{profile?.email || 'guest@example.com'}</Text>
          <Text style={styles.profileRole}>
            {profile?.user_type === 'shop_owner' ? 'Shop Owner' : 'Customer'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuContainer}>
          <ProfileMenuButton 
            icon={User}
            title="Personal Information"
            onPress={() => {}}
          />
          <ProfileMenuButton 
            icon={MapPin}
            title="My Addresses"
            onPress={() => {}}
          />
          <ProfileMenuButton 
            icon={CreditCard}
            title="Payment Methods"
            onPress={() => {}}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.menuContainer}>
          <View style={styles.toggleItem}>
            <Bell size={20} color={colors.text} />
            <Text style={styles.toggleText}>Notifications</Text>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: colors.light, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
          <View style={styles.toggleItem}>
            <Settings size={20} color={colors.text} />
            <Text style={styles.toggleText}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.light, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.menuContainer}>
          <ProfileMenuButton 
            icon={MessageSquare}
            title="Help & Support"
            onPress={() => {}}
          />
          <ProfileMenuButton 
            icon={Shield}
            title="Privacy Policy"
            onPress={() => {}}
          />
        </View>
      </View>

      <Button
        text="Sign Out"
        variant="outline"
        icon={LogOut}
        onPress={handleSignOut}
        style={styles.signOutButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: colors.text,
  },
  settingsButton: {
    padding: 8,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  editAvatarText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 2,
  },
  profileEmail: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  profileRole: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 12,
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleText: {
    flex: 1,
    marginLeft: 12,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: colors.text,
  },
  signOutButton: {
    marginTop: 8,
  },
});
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { User, Store } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';

type UserRole = 'customer' | 'shop_owner';

export default function RoleSelectionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
  };
  
  const handleContinue = async () => {
    if (!selectedRole) return;
    
    setLoading(true);
    setError('');
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const { error: updateError } = await supabase.auth.updateUser({
        data: { user_type: selectedRole }
      });
      
      if (updateError) throw updateError;
      
      // Navigate based on role
      if (selectedRole === 'shop_owner') {
        router.replace('/(tabs)/shop');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>
          Select how you'll be using UsConnect
        </Text>
      </View>
      
      <View style={styles.roleContainer}>
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'customer' && styles.selectedRoleCard
            ]}
            onPress={() => handleRoleSelection('customer')}
            activeOpacity={0.8}
          >
            <View style={[
              styles.iconContainer,
              selectedRole === 'customer' && styles.selectedIconContainer
            ]}>
              <User size={32} color={selectedRole === 'customer' ? colors.white : colors.primary} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleName}>Customer</Text>
              <Text style={styles.roleDescription}>
                Find laundry services, place orders, and schedule deliveries
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'shop_owner' && styles.selectedRoleCard
            ]}
            onPress={() => handleRoleSelection('shop_owner')}
            activeOpacity={0.8}
          >
            <View style={[
              styles.iconContainer,
              selectedRole === 'shop_owner' && styles.selectedIconContainer
            ]}>
              <Store size={32} color={selectedRole === 'shop_owner' ? colors.white : colors.primary} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleName}>Shop Owner</Text>
              <Text style={styles.roleDescription}>
                Manage your laundry business, track orders, and grow your customer base
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
      
      <Animated.View entering={FadeIn.delay(600)} style={styles.footer}>
        <Button
          text={loading ? "Updating..." : "Continue"}
          onPress={handleContinue}
          disabled={!selectedRole || loading}
        />
        <Text style={styles.noteText}>
          You can change your role later in your profile settings
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: colors.textLight,
  },
  roleContainer: {
    flex: 1,
    gap: 20,
  },
  roleCard: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedRoleCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectedIconContainer: {
    backgroundColor: colors.primary,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  roleDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  footer: {
    marginTop: 'auto',
  },
  noteText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 16,
  },
  errorText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
});
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import CustomerHome from '@/components/home/CustomerHome';
import ShopOwnerDashboard from '@/components/home/ShopOwnerDashboard';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function HomeScreen() {
  const { user, userRole } = useAuth();
  const insets = useSafeAreaInsets();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
      >
        <Animated.View entering={FadeIn.duration(800)} style={styles.headerContent}>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
        </Animated.View>
      </LinearGradient>

      {userRole === 'shop_owner' ? (
        <ShopOwnerDashboard />
      ) : (
        <CustomerHome />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerContent: {
    marginBottom: 8,
  },
  greeting: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
  },
  userName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: colors.white,
    marginTop: -4,
  },
});
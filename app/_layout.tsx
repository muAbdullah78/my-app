import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { Text, View, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useAuthStore } from '../lib/auth';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Auth guard component
function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!user && !inAuthGroup && !inOnboardingGroup) {
      // Redirect to the sign-in page
      router.replace('/(auth)/sign-in');
    } else if (user && (inAuthGroup || inOnboardingGroup)) {
      // Redirect to the main app
      router.replace('/(app)');
    }
  }, [user, loading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('@expo-google-fonts/inter/Inter_400Regular.ttf'),
    'Inter-Medium': require('@expo-google-fonts/inter/Inter_500Medium.ttf'),
    'Inter-SemiBold': require('@expo-google-fonts/inter/Inter_600SemiBold.ttf'),
    'Inter-Bold': require('@expo-google-fonts/inter/Inter_700Bold.ttf'),
  });

  // Hide splash screen once fonts are loaded
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Return a loading screen if fonts aren't loaded yet
  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <SafeAreaProvider>
          <AuthGuard>
            <AuthProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ animation: 'none' }} />
                <Stack.Screen name="auth" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
                <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
              </Stack>
              <Slot />
            </AuthProvider>
          </AuthGuard>
        </SafeAreaProvider>
      </PaperProvider>
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: colors.primary,
  },
});

export function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
        },
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
        },
        headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <MaterialIcons name="receipt" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <SafeAreaProvider>
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
              },
              headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
            }}
          />
        </SafeAreaProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
} 
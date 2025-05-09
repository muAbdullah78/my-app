import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { useAuthStore } from './auth';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      throw new Error('Permission not granted for notifications');
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Store the token in Supabase
    const { user } = useAuthStore.getState();
    if (user) {
      const { error } = await supabase
        .from('user_profiles')
        .update({ push_token: token })
        .eq('id', user.id);

      if (error) throw error;
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    throw error;
  }
}

export async function scheduleOrderNotification(orderId: string, shopName: string, estimatedTime: Date) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Order Update',
        body: `Your order from ${shopName} will be ready in approximately ${formatTimeRemaining(estimatedTime)}`,
        data: { orderId },
      },
      trigger: {
        date: estimatedTime,
      },
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}

export async function sendOrderStatusNotification(
  userId: string,
  orderId: string,
  status: string,
  shopName: string
) {
  try {
    // Get user's push token
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('push_token')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.push_token) {
      throw new Error('User push token not found');
    }

    // Send notification through Supabase Edge Function
    const { error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        token: profile.push_token,
        title: 'Order Status Update',
        body: `Your order from ${shopName} is now ${status}`,
        data: { orderId, status },
      },
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

export async function sendPromotionNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  try {
    // Get user's push token
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('push_token')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.push_token) {
      throw new Error('User push token not found');
    }

    // Send notification through Supabase Edge Function
    const { error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        token: profile.push_token,
        title,
        body,
        data,
      },
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

function formatTimeRemaining(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
} 
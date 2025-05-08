import { View, Text, StyleSheet, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import { useRouter } from 'expo-router';
import Logo from '@/components/ui/Logo';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />
      <View style={styles.background}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/5591581/pexels-photo-5591581.jpeg' }}
          style={styles.backgroundImage}
        />
        <View style={styles.overlay} />
      </View>
      
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.logoContainer}>
          <Logo size={80} />
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Text style={styles.title}>UsConnect</Text>
          <Text style={styles.subtitle}>Your one-stop laundry solution</Text>
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.features}>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Find nearby laundry shops</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Schedule pickups and deliveries</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Track orders in real-time</Text>
          </View>
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(800).springify()} style={styles.buttons}>
          <Button 
            text="Sign In" 
            onPress={() => router.push('/auth/login')} 
            style={styles.button}
          />
          <Button 
            text="Create Account" 
            variant="secondary" 
            onPress={() => router.push('/auth/register')} 
            style={styles.button}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 36,
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 18,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  features: {
    marginBottom: 48,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginRight: 12,
  },
  featureText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
  },
  buttons: {
    gap: 16,
  },
  button: {
    marginBottom: 0,
  },
});
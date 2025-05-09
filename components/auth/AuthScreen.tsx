import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { authService } from '@/lib/auth';
import PhoneVerification from './PhoneVerification';
import SignUp from './SignUp';
import { colors } from '@/constants/colors';

type AuthScreenProps = {
  onAuthComplete: () => void;
};

type AuthStep = 'phone' | 'signup';

export default function AuthScreen({ onAuthComplete }: AuthScreenProps) {
  const [step, setStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      await authService.initialize();
      if (authService.isAuthenticated()) {
        onAuthComplete();
      }
    } catch (err) {
      console.error('Error checking auth:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVerificationComplete = (phone: string) => {
    setPhoneNumber(phone);
    setStep('signup');
  };

  const handleSignUpComplete = () => {
    onAuthComplete();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {step === 'phone' ? (
        <PhoneVerification
          onVerificationComplete={() => handlePhoneVerificationComplete(phoneNumber)}
          onBack={() => {}}
        />
      ) : (
        <SignUp
          phoneNumber={phoneNumber}
          onSignUpComplete={handleSignUpComplete}
          onBack={() => setStep('phone')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 
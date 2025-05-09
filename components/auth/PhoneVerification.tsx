import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import { authService } from '@/lib/auth';
import { colors } from '@/constants/colors';

type PhoneVerificationProps = {
  onVerificationComplete: () => void;
  onBack: () => void;
};

export default function PhoneVerification({
  onVerificationComplete,
  onBack,
}: PhoneVerificationProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    try {
      setLoading(true);
      setError('');

      // Basic phone number validation
      if (!phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
        setError('Please enter a valid phone number');
        return;
      }

      const success = await authService.sendVerificationCode(phoneNumber);
      if (success) {
        setStep('code');
      } else {
        setError('Failed to send verification code');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setLoading(true);
      setError('');

      if (!verificationCode.match(/^\d{6}$/)) {
        setError('Please enter a valid 6-digit code');
        return;
      }

      const success = await authService.verifyPhoneNumber(
        phoneNumber,
        verificationCode
      );
      if (success) {
        onVerificationComplete();
      } else {
        setError('Invalid verification code');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        {step === 'phone' ? 'Enter Phone Number' : 'Verify Phone Number'}
      </Text>

      {step === 'phone' ? (
        <>
          <TextInput
            label="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoComplete="tel"
            style={styles.input}
            disabled={loading}
          />
          <HelperText type="info" style={styles.helperText}>
            Enter your phone number with country code (e.g., +1234567890)
          </HelperText>
        </>
      ) : (
        <>
          <TextInput
            label="Verification Code"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
            disabled={loading}
          />
          <HelperText type="info" style={styles.helperText}>
            Enter the 6-digit code sent to your phone
          </HelperText>
        </>
      )}

      {error ? (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      ) : null}

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={step === 'phone' ? onBack : () => setStep('phone')}
          style={styles.button}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          mode="contained"
          onPress={step === 'phone' ? handleSendCode : handleVerifyCode}
          style={styles.button}
          loading={loading}
          disabled={loading}
        >
          {step === 'phone' ? 'Send Code' : 'Verify'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 8,
  },
  helperText: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  button: {
    flex: 1,
  },
}); 
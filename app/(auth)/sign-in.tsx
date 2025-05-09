import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { signInWithPhone, verifyOTP } from '../../lib/auth';

export default function SignIn() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    try {
      setLoading(true);
      setError('');
      const { success, error } = await signInWithPhone(phone);
      if (success) {
        setOtpSent(true);
      } else {
        setError(error.message);
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      setLoading(true);
      setError('');
      const { success, error } = await verifyOTP(phone, otp);
      if (!success) {
        setError(error.message);
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Welcome to Laundry App
      </Text>
      
      {!otpSent ? (
        <>
          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.input}
            disabled={loading}
          />
          <Button
            mode="contained"
            onPress={handleSendOTP}
            loading={loading}
            disabled={!phone || loading}
            style={styles.button}
          >
            Send OTP
          </Button>
        </>
      ) : (
        <>
          <TextInput
            label="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            style={styles.input}
            disabled={loading}
          />
          <Button
            mode="contained"
            onPress={handleVerifyOTP}
            loading={loading}
            disabled={!otp || loading}
            style={styles.button}
          >
            Verify OTP
          </Button>
          <Button
            mode="text"
            onPress={() => setOtpSent(false)}
            disabled={loading}
            style={styles.button}
          >
            Change Phone Number
          </Button>
        </>
      )}

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
}); 
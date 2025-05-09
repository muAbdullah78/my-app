import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  RadioButton,
  Card,
} from 'react-native-paper';
import { authService, UserRole } from '@/lib/auth';
import { colors } from '@/constants/colors';

type SignUpProps = {
  phoneNumber: string;
  onSignUpComplete: () => void;
  onBack: () => void;
};

export default function SignUp({
  phoneNumber,
  onSignUpComplete,
  onBack,
}: SignUpProps) {
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    try {
      setLoading(true);
      setError('');

      if (!fullName.trim()) {
        setError('Please enter your full name');
        return;
      }

      const success = await authService.signUp(phoneNumber, role, fullName.trim());
      if (success) {
        onSignUpComplete();
      } else {
        setError('Failed to create account');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Create Account
      </Text>

      <TextInput
        label="Full Name"
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
        disabled={loading}
      />

      <Card style={styles.roleCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.roleTitle}>
            I am a:
          </Text>
          <RadioButton.Group
            onValueChange={(value) => setRole(value as UserRole)}
            value={role}
          >
            <View style={styles.roleOption}>
              <RadioButton value="customer" />
              <Text>Customer</Text>
            </View>
            <View style={styles.roleOption}>
              <RadioButton value="shop_owner" />
              <Text>Shop Owner</Text>
            </View>
          </RadioButton.Group>
        </Card.Content>
      </Card>

      {error ? (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      ) : null}

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={onBack}
          style={styles.button}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          mode="contained"
          onPress={handleSignUp}
          style={styles.button}
          loading={loading}
          disabled={loading}
        >
          Create Account
        </Button>
      </View>
    </ScrollView>
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
    marginBottom: 16,
  },
  roleCard: {
    marginBottom: 24,
  },
  roleTitle: {
    marginBottom: 8,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
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
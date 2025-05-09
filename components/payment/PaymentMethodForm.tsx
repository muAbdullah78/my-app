import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

type PaymentMethodFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

export default function PaymentMethodForm({
  onSuccess,
  onCancel,
}: PaymentMethodFormProps) {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Payment Method
      </Text>

      <Card style={styles.methodCard}>
        <Card.Content>
          <View style={styles.methodHeader}>
            <MaterialIcons name="payments" size={32} color="#007AFF" />
            <Text variant="titleLarge" style={styles.methodTitle}>
              Cash on Delivery
            </Text>
          </View>
          
          <Text style={styles.description}>
            Pay with cash when your order is delivered. Our delivery person will collect the payment.
          </Text>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={onCancel}
          style={styles.button}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={onSuccess}
          style={styles.button}
        >
          Confirm
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
  methodCard: {
    marginBottom: 24,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  methodTitle: {
    marginLeft: 12,
    color: '#007AFF',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
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
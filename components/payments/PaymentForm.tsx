import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, TextInput, Portal, Dialog, ActivityIndicator } from 'react-native-paper';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import PaymentMethodSelector from './PaymentMethodSelector';

type PaymentFormProps = {
  orderId: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
};

export default function PaymentForm({
  orderId,
  amount,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const [selectedMethodId, setSelectedMethodId] = useState<string>();
  const [processing, setProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    if (!selectedMethodId) {
      setError('Please select a payment method');
      return;
    }

    setShowConfirmDialog(true);
  };

  const processPayment = async () => {
    try {
      setProcessing(true);
      setError('');

      // Get the selected payment method
      const { data: method, error: methodError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('id', selectedMethodId)
        .single();

      if (methodError) throw methodError;

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          amount,
          payment_method: method.type,
          stripe_payment_method_id: method.stripe_payment_method_id,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // TODO: Process payment with Stripe
      // This will be implemented when we add the Stripe integration

      // For now, simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update payment status
      const { error: updateError } = await supabase
        .from('payments')
        .update({ status: 'paid' })
        .eq('id', payment.id);

      if (updateError) throw updateError;

      setShowConfirmDialog(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to process payment');
      onError(err.message || 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ScrollView>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>
            Payment Details
          </Text>

          <View style={styles.amountContainer}>
            <Text variant="headlineMedium" style={styles.amount}>
              ${amount.toFixed(2)}
            </Text>
          </View>

          <PaymentMethodSelector
            userId={supabase.auth.getUser().then(({ data }) => data.user?.id)}
            onSelect={setSelectedMethodId}
            selectedMethodId={selectedMethodId}
          />

          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          <Button
            mode="contained"
            onPress={handlePayment}
            loading={processing}
            disabled={processing || !selectedMethodId}
            style={styles.payButton}
          >
            Pay Now
          </Button>
        </Card.Content>
      </Card>

      <Portal>
        <Dialog visible={showConfirmDialog} onDismiss={() => setShowConfirmDialog(false)}>
          <Dialog.Title>Confirm Payment</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to proceed with the payment?</Text>
            <Text style={styles.confirmAmount}>Amount: ${amount.toFixed(2)}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowConfirmDialog(false)}>Cancel</Button>
            <Button
              onPress={processPayment}
              loading={processing}
              disabled={processing}
            >
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
  },
  title: {
    marginBottom: 16,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  amount: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  error: {
    color: colors.error,
    textAlign: 'center',
    marginTop: 16,
  },
  payButton: {
    marginTop: 24,
  },
  confirmAmount: {
    marginTop: 8,
    fontWeight: 'bold',
  },
}); 
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Portal,
  Dialog,
  List,
  RadioButton,
  IconButton,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/auth';
import { initStripe, useStripe } from '@stripe/stripe-react-native';

type PaymentMethod = {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  is_default: boolean;
};

type Order = {
  id: string;
  total_amount: number;
  status: string;
  shop: {
    id: string;
    name: string;
  };
  items: {
    service: {
      name: string;
      price: number;
    };
    quantity: number;
  }[];
};

export default function Payment() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);

  useEffect(() => {
    initializeStripe();
    fetchOrderDetails();
    fetchPaymentMethods();
  }, []);

  const initializeStripe = async () => {
    try {
      const { data: { publishableKey } } = await supabase
        .from('stripe_config')
        .select('publishableKey')
        .single();

      await initStripe({
        publishableKey,
        merchantIdentifier: 'merchant.com.laundryapp',
      });
    } catch (err) {
      setError('Failed to initialize payment system');
    }
  };

  const fetchOrderDetails = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          shop:shops (
            id,
            name
          ),
          items:order_items (
            service:services (
              name,
              price
            ),
            quantity
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (err) {
      setError('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;

      setPaymentMethods(data);
      if (data.length > 0) {
        setSelectedPaymentMethod(data.find(m => m.is_default)?.id || data[0].id);
      }
    } catch (err) {
      console.error('Error fetching payment methods:', err);
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      setProcessing(true);
      setError('');

      // Create payment intent for adding new card
      const { data: { clientSecret }, error: intentError } = await supabase
        .functions.invoke('create-payment-intent', {
          body: {
            amount: 0,
            currency: 'usd',
            setup_future_usage: 'off_session',
          },
        });

      if (intentError) throw intentError;

      // Initialize payment sheet for adding card
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Laundry App',
        style: 'automatic',
        defaultBillingDetails: {
          name: user?.user_metadata?.full_name,
        },
      });

      if (initError) throw initError;

      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          return;
        }
        throw presentError;
      }

      // Refresh payment methods
      fetchPaymentMethods();
      setShowAddPaymentMethod(false);
    } catch (err) {
      setError('Failed to add payment method');
    } finally {
      setProcessing(false);
    }
  };

  const handleSetDefaultPaymentMethod = async (methodId: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user?.id);

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', methodId);

      if (updateError) throw updateError;

      fetchPaymentMethods();
    } catch (err) {
      setError('Failed to update default payment method');
    }
  };

  const handlePayment = async () => {
    if (!order || !user || !selectedPaymentMethod) return;

    try {
      setProcessing(true);
      setError('');

      // Create payment intent on the server
      const { data: { clientSecret }, error: intentError } = await supabase
        .functions.invoke('create-payment-intent', {
          body: {
            amount: order.total_amount,
            currency: 'usd',
            orderId: order.id,
            payment_method_id: selectedPaymentMethod,
          },
        });

      if (intentError) throw intentError;

      // Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Laundry App',
        style: 'automatic',
      });

      if (initError) throw initError;

      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          return;
        }
        throw presentError;
      }

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', order.id);

      if (updateError) throw updateError;

      setShowSuccessDialog(true);
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const renderPaymentMethod = (method: PaymentMethod) => (
    <List.Item
      key={method.id}
      title={`${method.card.brand.toUpperCase()} •••• ${method.card.last4}`}
      description={`Expires ${method.card.exp_month}/${method.card.exp_year}`}
      left={props => (
        <List.Icon
          {...props}
          icon={
            method.card.brand === 'visa'
              ? 'credit-card'
              : method.card.brand === 'mastercard'
              ? 'credit-card-multiple'
              : 'credit-card-outline'
          }
        />
      )}
      right={props => (
        <RadioButton
          value={method.id}
          status={selectedPaymentMethod === method.id ? 'checked' : 'unchecked'}
          onPress={() => setSelectedPaymentMethod(method.id)}
        />
      )}
      onPress={() => setSelectedPaymentMethod(method.id)}
    />
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error || 'Order not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.orderCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.shopName}>
            {order.shop.name}
          </Text>
          <Text variant="titleMedium" style={styles.orderId}>
            Order #{order.id}
          </Text>

          <View style={styles.itemsContainer}>
            {order.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text variant="bodyMedium">
                  {item.service.name} x {item.quantity}
                </Text>
                <Text variant="bodyMedium">
                  ${(item.service.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totalContainer}>
            <Text variant="titleMedium">Total</Text>
            <Text variant="titleMedium">${order.total_amount.toFixed(2)}</Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.paymentCard}>
        <Card.Content>
          <View style={styles.paymentHeader}>
            <Text variant="titleMedium">Payment Method</Text>
            <IconButton
              icon="plus"
              onPress={() => setShowAddPaymentMethod(true)}
            />
          </View>
          <RadioButton.Group
            onValueChange={value => setSelectedPaymentMethod(value)}
            value={selectedPaymentMethod || ''}
          >
            {paymentMethods.map(renderPaymentMethod)}
          </RadioButton.Group>
          {paymentMethods.length === 0 && (
            <Text style={styles.noPaymentMethods}>
              No payment methods saved. Add a payment method to continue.
            </Text>
          )}
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handlePayment}
        loading={processing}
        disabled={processing || order.status === 'paid' || !selectedPaymentMethod}
        style={styles.payButton}
      >
        {order.status === 'paid' ? 'Paid' : 'Pay Now'}
      </Button>

      <Portal>
        <Dialog
          visible={showAddPaymentMethod}
          onDismiss={() => setShowAddPaymentMethod(false)}
        >
          <Dialog.Title>Add Payment Method</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Add a new credit or debit card to your account.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddPaymentMethod(false)}>Cancel</Button>
            <Button onPress={handleAddPaymentMethod}>Add Card</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={showSuccessDialog}
          onDismiss={() => {
            setShowSuccessDialog(false);
            router.back();
          }}
        >
          <Dialog.Title>Payment Successful</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Your payment has been processed successfully. The shop will be notified
              to start processing your order.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setShowSuccessDialog(false);
                router.back();
              }}
            >
              OK
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderCard: {
    margin: 16,
    marginBottom: 8,
  },
  shopName: {
    marginBottom: 8,
  },
  orderId: {
    color: '#666',
    marginBottom: 16,
  },
  itemsContainer: {
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  paymentCard: {
    margin: 16,
    marginTop: 8,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  noPaymentMethods: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 16,
  },
  payButton: {
    margin: 16,
    marginTop: 8,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
}); 
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/constants/colors';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import Button from '@/components/ui/Button';
import { 
  CreditCard, 
  Apple, 
  Smartphone, 
  ArrowLeft,
  Receipt,
  History,
  AlertCircle
} from 'lucide-react-native';
import { 
  createPaymentIntent, 
  processPayment, 
  savePaymentRecord,
  getPaymentHistory,
  generateReceipt,
  PaymentMethod,
  PaymentRecord
} from '@/lib/payment';
import { supabase } from '@/lib/supabase';

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { amount, orderId } = useLocalSearchParams();
  const stripe = useStripe();
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [cardComplete, setCardComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const history = await getPaymentHistory(user.id);
      setPaymentHistory(history);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handlePayment = async () => {
    if (!amount || !orderId) {
      Alert.alert('Error', 'Missing payment information');
      return;
    }

    setLoading(true);
    try {
      // Create payment intent
      const { clientSecret } = await createPaymentIntent(
        Number(amount),
        'usd',
        selectedMethod
      );

      // Process payment
      const { success, error } = await processPayment(clientSecret, selectedMethod);

      if (!success) {
        throw error;
      }

      // Save payment record
      await savePaymentRecord({
        order_id: orderId as string,
        amount: Number(amount),
        currency: 'usd',
        status: 'succeeded',
        payment_method: selectedMethod,
      });

      // Generate receipt
      const receipt = await generateReceipt(orderId as string);

      Alert.alert(
        'Success',
        'Payment processed successfully',
        [
          {
            text: 'View Receipt',
            onPress: () => {
              // Handle receipt viewing
            },
          },
          {
            text: 'Done',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentMethod = () => {
    switch (selectedMethod) {
      case 'card':
        return (
          <CardField
            postalCodeEnabled={false}
            placeholder={{
              number: '4242 4242 4242 4242',
            }}
            cardStyle={{
              backgroundColor: colors.white,
              textColor: colors.text,
            }}
            style={styles.cardField}
            onCardChange={(cardDetails) => {
              setCardComplete(cardDetails.complete);
            }}
          />
        );
      case 'apple_pay':
        return (
          <View style={styles.paymentMethodInfo}>
            <Apple size={24} color={colors.text} />
            <Text style={styles.paymentMethodText}>
              Pay with Apple Pay
            </Text>
          </View>
        );
      case 'google_pay':
        return (
          <View style={styles.paymentMethodInfo}>
            <Smartphone size={24} color={colors.text} />
            <Text style={styles.paymentMethodText}>
              Pay with Google Pay
            </Text>
          </View>
        );
    }
  };

  const renderPaymentHistory = () => {
    if (paymentHistory.length === 0) {
      return (
        <View style={styles.emptyHistory}>
          <History size={48} color={colors.textLight} />
          <Text style={styles.emptyHistoryText}>No payment history</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.historyList}>
        {paymentHistory.map((payment) => (
          <TouchableOpacity
            key={payment.id}
            style={styles.historyItem}
            onPress={() => {
              // Handle payment details view
            }}
          >
            <View style={styles.historyItemHeader}>
              <Text style={styles.historyItemAmount}>
                ${payment.amount.toFixed(2)}
              </Text>
              <Text style={[
                styles.historyItemStatus,
                { color: payment.status === 'succeeded' ? colors.success : colors.error }
              ]}>
                {payment.status}
              </Text>
            </View>
            <Text style={styles.historyItemDate}>
              {new Date(payment.created_at).toLocaleDateString()}
            </Text>
            <Text style={styles.historyItemMethod}>
              {payment.payment_method}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {showHistory ? 'Payment History' : 'Payment'}
        </Text>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setShowHistory(!showHistory)}
        >
          {showHistory ? (
            <CreditCard size={24} color={colors.text} />
          ) : (
            <History size={24} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>

      {showHistory ? (
        renderPaymentHistory()
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amount}>${Number(amount).toFixed(2)}</Text>
          </View>

          <View style={styles.paymentMethods}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.methodOptions}>
              <TouchableOpacity
                style={[
                  styles.methodOption,
                  selectedMethod === 'card' && styles.selectedMethod
                ]}
                onPress={() => setSelectedMethod('card')}
              >
                <CreditCard size={24} color={selectedMethod === 'card' ? colors.primary : colors.text} />
                <Text style={[
                  styles.methodText,
                  selectedMethod === 'card' && styles.selectedMethodText
                ]}>
                  Card
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodOption,
                  selectedMethod === 'apple_pay' && styles.selectedMethod
                ]}
                onPress={() => setSelectedMethod('apple_pay')}
              >
                <Apple size={24} color={selectedMethod === 'apple_pay' ? colors.primary : colors.text} />
                <Text style={[
                  styles.methodText,
                  selectedMethod === 'apple_pay' && styles.selectedMethodText
                ]}>
                  Apple Pay
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodOption,
                  selectedMethod === 'google_pay' && styles.selectedMethod
                ]}
                onPress={() => setSelectedMethod('google_pay')}
              >
                <Smartphone size={24} color={selectedMethod === 'google_pay' ? colors.primary : colors.text} />
                <Text style={[
                  styles.methodText,
                  selectedMethod === 'google_pay' && styles.selectedMethodText
                ]}>
                  Google Pay
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {renderPaymentMethod()}

          <Button
            text={loading ? "Processing..." : "Pay Now"}
            onPress={handlePayment}
            disabled={loading || (selectedMethod === 'card' && !cardComplete)}
            style={styles.payButton}
          />

          <View style={styles.securityNote}>
            <AlertCircle size={16} color={colors.textLight} />
            <Text style={styles.securityText}>
              Your payment information is secure and encrypted
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: colors.text,
  },
  historyButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  amountLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 8,
  },
  amount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 36,
    color: colors.text,
  },
  paymentMethods: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  methodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  methodOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedMethod: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  methodText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: colors.text,
    marginTop: 8,
  },
  selectedMethodText: {
    color: colors.primary,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginBottom: 24,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 24,
  },
  paymentMethodText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  payButton: {
    marginBottom: 16,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  securityText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.textLight,
    marginLeft: 8,
  },
  historyList: {
    flex: 1,
    padding: 16,
  },
  historyItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyItemAmount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: colors.text,
  },
  historyItemStatus: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  historyItemDate: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  historyItemMethod: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: colors.text,
  },
  emptyHistory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyHistoryText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: colors.textLight,
    marginTop: 16,
  },
}); 
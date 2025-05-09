import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, Button } from 'react-native-paper';
import { paymentService, Payment, Refund } from '@/lib/payment';
import { formatCurrency } from '@/lib/utils';
import { colors } from '@/constants/colors';

export default function PaymentHistoryScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [paymentData, refundData] = await Promise.all([
        paymentService.getPaymentHistory(),
        paymentService.getRefundHistory(),
      ]);
      setPayments(paymentData);
      setRefunds(refundData);
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'failed':
        return colors.error;
      case 'refunded':
        return colors.info;
      default:
        return colors.text;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text variant="headlineMedium" style={styles.title}>
        Payment History
      </Text>

      {payments.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No payment history found
            </Text>
          </Card.Content>
        </Card>
      ) : (
        payments.map((payment) => (
          <Card key={payment.id} style={styles.paymentCard}>
            <Card.Content>
              <View style={styles.paymentHeader}>
                <Text variant="titleMedium">
                  {formatCurrency(payment.amount, payment.currency)}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[styles.status, { color: getStatusColor(payment.status) }]}
                >
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.date}>
                {new Date(payment.created_at).toLocaleDateString()}
              </Text>
              <Text variant="bodySmall" style={styles.orderId}>
                Order ID: {payment.order_id}
              </Text>

              {payment.status === 'succeeded' && (
                <Button
                  mode="outlined"
                  onPress={() => {
                    // Handle refund request
                  }}
                  style={styles.refundButton}
                >
                  Request Refund
                </Button>
              )}
            </Card.Content>
          </Card>
        ))
      )}

      {refunds.length > 0 && (
        <>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Refunds
          </Text>
          {refunds.map((refund) => (
            <Card key={refund.id} style={styles.refundCard}>
              <Card.Content>
                <View style={styles.paymentHeader}>
                  <Text variant="titleMedium">
                    {formatCurrency(refund.amount, 'USD')}
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={[styles.status, { color: getStatusColor(refund.status) }]}
                  >
                    {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                  </Text>
                </View>
                <Text variant="bodySmall" style={styles.date}>
                  {new Date(refund.created_at).toLocaleDateString()}
                </Text>
                {refund.reason && (
                  <Text variant="bodySmall" style={styles.reason}>
                    Reason: {refund.reason}
                  </Text>
                )}
              </Card.Content>
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 16,
  },
  emptyCard: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
  },
  paymentCard: {
    marginBottom: 16,
  },
  refundCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  status: {
    fontWeight: 'bold',
  },
  date: {
    color: colors.secondary,
    marginBottom: 4,
  },
  orderId: {
    color: colors.secondary,
    marginBottom: 8,
  },
  reason: {
    color: colors.secondary,
    marginTop: 4,
  },
  refundButton: {
    marginTop: 8,
  },
}); 
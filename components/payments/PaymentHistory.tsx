import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, List, Divider, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

type Payment = {
  id: string;
  amount: number;
  currency: string;
  payment_method: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash_on_delivery';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string;
  order: {
    id: string;
    shop: {
      name: string;
    };
  };
};

type PaymentHistoryProps = {
  userId: string;
  limit?: number;
};

const STATUS_COLORS: { [key in Payment['status']]: string } = {
  pending: colors.warning,
  paid: colors.success,
  failed: colors.error,
  refunded: colors.info,
};

export default function PaymentHistory({ userId, limit }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [userId]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('payments')
        .select(`
          *,
          order:orders(
            id,
            shop:shops(name)
          )
        `)
        .eq('order.user_id', userId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        setPayments(data);
      }
    } catch (err) {
      setError('Failed to fetch payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMethodIcon = (method: Payment['payment_method']) => {
    switch (method) {
      case 'credit_card':
      case 'debit_card':
        return 'credit-card';
      case 'bank_transfer':
        return 'bank';
      case 'cash_on_delivery':
        return 'cash';
      default:
        return 'credit-card';
    }
  };

  if (loading && !refreshing) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </Card.Content>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.error}>{error}</Text>
        </Card.Content>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.centered}>
          <Text style={styles.emptyText}>No payments found</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {payments.map((payment) => (
        <Card key={payment.id} style={styles.card}>
          <Card.Content>
            <View style={styles.paymentHeader}>
              <View>
                <Text variant="titleMedium">{payment.order.shop.name}</Text>
                <Text variant="bodySmall" style={styles.paymentDate}>
                  {formatDate(payment.created_at)}
                </Text>
              </View>
              <Chip
                mode="outlined"
                textStyle={{ color: STATUS_COLORS[payment.status] }}
                style={[styles.statusChip, { borderColor: STATUS_COLORS[payment.status] }]}
              >
                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.paymentDetails}>
              <List.Item
                title="Amount"
                description={`${payment.currency} ${payment.amount.toFixed(2)}`}
                left={props => <List.Icon {...props} icon="currency-usd" />}
              />
              <List.Item
                title="Payment Method"
                description={payment.payment_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                left={props => (
                  <List.Icon
                    {...props}
                    icon={getMethodIcon(payment.payment_method)}
                  />
                )}
              />
              <List.Item
                title="Order ID"
                description={payment.order.id}
                left={props => <List.Icon {...props} icon="receipt" />}
              />
            </View>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    marginBottom: 8,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  error: {
    color: colors.error,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textLight,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  paymentDate: {
    color: colors.textLight,
    marginTop: 4,
  },
  statusChip: {
    borderWidth: 1,
  },
  divider: {
    marginVertical: 12,
  },
  paymentDetails: {
    gap: 8,
  },
}); 
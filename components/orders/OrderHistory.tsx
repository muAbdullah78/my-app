import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, List, Divider, IconButton, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'ready_for_delivery' | 'out_for_delivery' | 'delivered' | 'cancelled';

type Order = {
  id: string;
  status: OrderStatus;
  created_at: string;
  total_price: number;
  shop: {
    name: string;
    image: string;
  };
  services: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
};

type OrderHistoryProps = {
  userId: string;
  limit?: number;
  filter?: 'all' | 'active' | 'completed';
};

const STATUS_COLORS: { [key in OrderStatus]: string } = {
  pending: colors.warning,
  confirmed: colors.success,
  processing: colors.primary,
  ready_for_delivery: colors.primary,
  out_for_delivery: colors.primary,
  delivered: colors.success,
  cancelled: colors.error,
};

export default function OrderHistory({ userId, limit, filter = 'all' }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, [userId, filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('orders')
        .select(`
          *,
          shop:shops(name, image),
          services:order_services(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        if (filter === 'active') {
          query = query.in('status', ['pending', 'confirmed', 'processing', 'ready_for_delivery', 'out_for_delivery']);
        } else if (filter === 'completed') {
          query = query.in('status', ['delivered', 'cancelled']);
        }
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        setOrders(data);
      }
    } catch (err) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleOrderPress = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  if (orders.length === 0) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.centered}>
          <Text style={styles.emptyText}>No orders found</Text>
          <Button
            mode="contained"
            onPress={() => router.push('/discover')}
            style={styles.newOrderButton}
          >
            Place New Order
          </Button>
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
      {orders.map((order) => (
        <Card
          key={order.id}
          style={styles.card}
          onPress={() => handleOrderPress(order.id)}
        >
          <Card.Content>
            <View style={styles.orderHeader}>
              <View>
                <Text variant="titleMedium">{order.shop.name}</Text>
                <Text variant="bodySmall" style={styles.orderDate}>
                  {formatDate(order.created_at)}
                </Text>
              </View>
              <Chip
                mode="outlined"
                textStyle={{ color: STATUS_COLORS[order.status] }}
                style={[styles.statusChip, { borderColor: STATUS_COLORS[order.status] }]}
              >
                {order.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.servicesList}>
              {order.services.map((service, index) => (
                <View key={index} style={styles.serviceItem}>
                  <Text variant="bodyMedium">
                    {service.quantity}x {service.name}
                  </Text>
                  <Text variant="bodyMedium">${service.price.toFixed(2)}</Text>
                </View>
              ))}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.orderFooter}>
              <Text variant="titleMedium">Total</Text>
              <Text variant="titleMedium" style={styles.totalPrice}>
                ${order.total_price.toFixed(2)}
              </Text>
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
    marginBottom: 16,
    color: colors.textLight,
  },
  newOrderButton: {
    marginTop: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderDate: {
    color: colors.textLight,
    marginTop: 4,
  },
  statusChip: {
    borderWidth: 1,
  },
  divider: {
    marginVertical: 12,
  },
  servicesList: {
    gap: 8,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPrice: {
    color: colors.primary,
    fontWeight: 'bold',
  },
}); 
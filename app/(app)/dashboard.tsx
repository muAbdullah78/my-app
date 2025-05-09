import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  ActivityIndicator,
  Portal,
  Dialog,
  List,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/auth';

type Order = {
  id: string;
  created_at: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'ready' | 'delivered' | 'cancelled';
  total_amount: number;
  delivery_address: string;
  special_instructions?: string;
  user: {
    full_name: string;
    phone: string;
  };
  items: {
    id: string;
    quantity: number;
    price: number;
    service: {
      name: string;
    };
  }[];
};

type ShopStats = {
  total_orders: number;
  total_revenue: number;
  average_rating: number;
  total_ratings: number;
};

const statusColors = {
  pending: '#FFA500',
  confirmed: '#1E90FF',
  in_progress: '#9370DB',
  ready: '#32CD32',
  delivered: '#008000',
  cancelled: '#FF0000',
};

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<ShopStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      // Fetch shop stats
      const { data: statsData, error: statsError } = await supabase
        .from('shops')
        .select('total_orders, total_revenue, rating, total_ratings')
        .eq('owner_id', user.id)
        .single();

      if (statsError) throw statsError;
      setStats({
        total_orders: statsData.total_orders,
        total_revenue: statsData.total_revenue,
        average_rating: statsData.rating,
        total_ratings: statsData.total_ratings,
      });

      // Fetch recent orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          user:user_profiles (full_name, phone),
          items:order_items (
            id,
            quantity,
            price,
            service:services (name)
          )
        `)
        .eq('shop_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ordersError) throw ordersError;
      setOrders(ordersData);
    } catch (err) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateStatus = async (newStatus: Order['status']) => {
    if (!selectedOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      // Update local state
      setOrders(
        orders.map((order) =>
          order.id === selectedOrder.id
            ? { ...order, status: newStatus }
            : order
        )
      );

      setShowStatusDialog(false);
      setSelectedOrder(null);
    } catch (err) {
      setError('Failed to update order status');
    }
  };

  const renderOrderItem = ({ item }: { item: Order['items'][0] }) => (
    <View style={styles.orderItem}>
      <Text variant="bodyMedium">
        {item.quantity}x {item.service.name}
      </Text>
      <Text variant="bodyMedium">${item.price.toFixed(2)}</Text>
    </View>
  );

  const renderOrder = ({ item }: { item: Order }) => (
    <Card style={styles.orderCard}>
      <Card.Content>
        <View style={styles.orderHeader}>
          <View>
            <Text variant="titleMedium">{item.user.full_name}</Text>
            <Text variant="bodySmall" style={styles.orderDate}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
          <Chip
            mode="flat"
            style={[styles.statusChip, { backgroundColor: statusColors[item.status] }]}
          >
            {statusLabels[item.status]}
          </Chip>
        </View>

        <List.Section>
          <List.Subheader>Order Items</List.Subheader>
          {item.items.map((orderItem) => (
            <List.Item
              key={orderItem.id}
              title={`${orderItem.quantity}x ${orderItem.service.name}`}
              right={() => (
                <Text variant="bodyMedium">${orderItem.price.toFixed(2)}</Text>
              )}
            />
          ))}
        </List.Section>

        <View style={styles.orderDetails}>
          <Text variant="bodyMedium">
            <MaterialCommunityIcons name="map-marker" size={16} />{' '}
            {item.delivery_address}
          </Text>
          {item.special_instructions && (
            <Text variant="bodyMedium" style={styles.instructions}>
              <MaterialCommunityIcons name="note-text" size={16} />{' '}
              {item.special_instructions}
            </Text>
          )}
        </View>

        <View style={styles.orderFooter}>
          <Text variant="titleMedium">Total: ${item.total_amount.toFixed(2)}</Text>
          {item.status !== 'delivered' && item.status !== 'cancelled' && (
            <Button
              mode="outlined"
              onPress={() => {
                setSelectedOrder(item);
                setShowStatusDialog(true);
              }}
            >
              Update Status
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !stats) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error || 'Failed to load dashboard'}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchData} />
      }
    >
      <View style={styles.statsContainer}>
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="titleMedium">Total Orders</Text>
            <Text variant="headlineMedium">{stats.total_orders}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="titleMedium">Total Revenue</Text>
            <Text variant="headlineMedium">${stats.total_revenue.toFixed(2)}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="titleMedium">Rating</Text>
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
              <Text variant="headlineMedium">
                {stats.average_rating.toFixed(1)}
              </Text>
            </View>
            <Text variant="bodySmall">({stats.total_ratings} reviews)</Text>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Recent Orders
          </Text>
          {orders.map((order) => renderOrder({ item: order }))}
        </Card.Content>
      </Card>

      <Portal>
        <Dialog
          visible={showStatusDialog}
          onDismiss={() => {
            setShowStatusDialog(false);
            setSelectedOrder(null);
          }}
        >
          <Dialog.Title>Update Order Status</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Select the new status for order #{selectedOrder?.id}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setShowStatusDialog(false);
                setSelectedOrder(null);
              }}
            >
              Cancel
            </Button>
            {selectedOrder?.status === 'pending' && (
              <Button onPress={() => handleUpdateStatus('confirmed')}>
                Confirm
              </Button>
            )}
            {selectedOrder?.status === 'confirmed' && (
              <Button onPress={() => handleUpdateStatus('in_progress')}>
                Start Processing
              </Button>
            )}
            {selectedOrder?.status === 'in_progress' && (
              <Button onPress={() => handleUpdateStatus('ready')}>
                Mark as Ready
              </Button>
            )}
            {selectedOrder?.status === 'ready' && (
              <Button onPress={() => handleUpdateStatus('delivered')}>
                Mark as Delivered
              </Button>
            )}
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statsCard: {
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionCard: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  orderCard: {
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderDate: {
    color: '#666',
    marginTop: 4,
  },
  statusChip: {
    height: 24,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  orderDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  instructions: {
    marginTop: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
}); 
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  ActivityIndicator,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/auth';

type OrderItem = {
  id: string;
  service: {
    name: string;
    price: number;
  };
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  created_at: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'ready' | 'delivered' | 'cancelled';
  total_amount: number;
  delivery_address: string;
  special_instructions?: string;
  shop: {
    id: string;
    name: string;
  };
  items: OrderItem[];
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

export default function Orders() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          shop:shops (id, name),
          items:order_items (
            id,
            quantity,
            price,
            service:services (name, price)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data);
    } catch (err) {
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      // Update local state
      setOrders(
        orders.map((order) =>
          order.id === selectedOrder.id
            ? { ...order, status: 'cancelled' }
            : order
        )
      );

      setShowCancelDialog(false);
      setSelectedOrder(null);
    } catch (err) {
      setError('Failed to cancel order');
    }
  };

  const renderOrderItem = ({ item }: { item: OrderItem }) => (
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
            <Text variant="titleMedium">{item.shop.name}</Text>
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

        <FlatList
          data={item.items}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />

        <View style={styles.orderFooter}>
          <Text variant="titleMedium">Total: ${item.total_amount.toFixed(2)}</Text>
          {item.status === 'pending' && (
            <Button
              mode="outlined"
              onPress={() => {
                setSelectedOrder(item);
                setShowCancelDialog(true);
              }}
            >
              Cancel Order
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

  return (
    <View style={styles.container}>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchOrders} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No orders found</Text>
          }
        />
      )}

      <Portal>
        <Dialog
          visible={showCancelDialog}
          onDismiss={() => {
            setShowCancelDialog(false);
            setSelectedOrder(null);
          }}
        >
          <Dialog.Title>Cancel Order</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to cancel this order? This action cannot be
              undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setShowCancelDialog(false);
                setSelectedOrder(null);
              }}
            >
              No
            </Button>
            <Button onPress={handleCancelOrder}>Yes, Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
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
  list: {
    padding: 16,
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
    margin: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#666',
  },
}); 
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, List, Divider, IconButton, Portal, Dialog, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import OrderTracking from '@/components/orders/OrderTracking';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'ready_for_delivery' | 'out_for_delivery' | 'delivered' | 'cancelled';

type OrderDetails = {
  id: string;
  status: OrderStatus;
  created_at: string;
  total_price: number;
  special_instructions: string;
  shop: {
    id: string;
    name: string;
    image: string;
    address: string;
    phone: string;
  };
  services: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    notes: string;
  }>;
  delivery: {
    id: string;
    status: string;
    estimated_delivery_time: string;
    current_location: {
      latitude: number;
      longitude: number;
    };
  };
};

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
    subscribeToOrderUpdates();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          shop:shops(id, name, image, address, phone),
          services:order_services(*),
          delivery:deliveries(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setOrder(data);
      }
    } catch (err) {
      setError('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToOrderUpdates = () => {
    const subscription = supabase
      .channel(`order-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setOrder((current) => current ? { ...current, ...payload.new } : null);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
      setShowCancelDialog(false);
    } catch (err) {
      setError('Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleContactShop = () => {
    if (order?.shop.phone) {
      // TODO: Implement phone call or chat
    }
  };

  const handleViewOnMap = () => {
    if (order?.delivery?.current_location) {
      // TODO: Open map with delivery location
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error || 'Order not found'}</Text>
        <Button
          mode="contained"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <OrderTracking orderId={order.id} />

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Order Details
          </Text>
          <List.Item
            title="Order ID"
            description={order.id}
            left={props => <List.Icon {...props} icon="receipt" />}
          />
          <List.Item
            title="Order Date"
            description={new Date(order.created_at).toLocaleString()}
            left={props => <List.Icon {...props} icon="calendar" />}
          />
          {order.special_instructions && (
            <List.Item
              title="Special Instructions"
              description={order.special_instructions}
              left={props => <List.Icon {...props} icon="note-text" />}
            />
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Shop Information
          </Text>
          <List.Item
            title={order.shop.name}
            description={order.shop.address}
            left={props => <List.Icon {...props} icon="store" />}
          />
          <Button
            mode="outlined"
            onPress={handleContactShop}
            style={styles.actionButton}
            icon="phone"
          >
            Contact Shop
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Services
          </Text>
          {order.services.map((service, index) => (
            <React.Fragment key={service.id}>
              <List.Item
                title={service.name}
                description={`${service.quantity}x - $${service.price.toFixed(2)} each`}
                left={props => <List.Icon {...props} icon="washing-machine" />}
              />
              {service.notes && (
                <Text style={styles.serviceNotes}>{service.notes}</Text>
              )}
              {index < order.services.length - 1 && <Divider />}
            </React.Fragment>
          ))}
          <Divider style={styles.divider} />
          <View style={styles.totalContainer}>
            <Text variant="titleMedium">Total</Text>
            <Text variant="titleMedium" style={styles.totalPrice}>
              ${order.total_price.toFixed(2)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {order.delivery && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Delivery Information
            </Text>
            <List.Item
              title="Status"
              description={order.delivery.status}
              left={props => <List.Icon {...props} icon="truck-delivery" />}
            />
            <List.Item
              title="Estimated Delivery"
              description={new Date(order.delivery.estimated_delivery_time).toLocaleString()}
              left={props => <List.Icon {...props} icon="clock-outline" />}
            />
            <Button
              mode="outlined"
              onPress={handleViewOnMap}
              style={styles.actionButton}
              icon="map-marker"
            >
              View on Map
            </Button>
          </Card.Content>
        </Card>
      )}

      {order.status !== 'cancelled' && order.status !== 'delivered' && (
        <Button
          mode="outlined"
          onPress={() => setShowCancelDialog(true)}
          style={[styles.actionButton, styles.cancelButton]}
          textColor={colors.error}
        >
          Cancel Order
        </Button>
      )}

      <Portal>
        <Dialog visible={showCancelDialog} onDismiss={() => setShowCancelDialog(false)}>
          <Dialog.Title>Cancel Order</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to cancel this order?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCancelDialog(false)}>No</Button>
            <Button
              onPress={handleCancelOrder}
              loading={cancelling}
              textColor={colors.error}
            >
              Yes, Cancel
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
    backgroundColor: colors.background,
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  error: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginHorizontal: 16,
  },
  divider: {
    marginVertical: 12,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPrice: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  serviceNotes: {
    color: colors.textLight,
    marginLeft: 56,
    marginBottom: 8,
  },
  actionButton: {
    marginTop: 8,
  },
  cancelButton: {
    borderColor: colors.error,
    marginHorizontal: 16,
    marginBottom: 16,
  },
}); 
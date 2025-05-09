import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, List, Divider, IconButton, Portal, Dialog, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'ready_for_delivery' | 'out_for_delivery' | 'delivered' | 'cancelled';

type OrderTrackingProps = {
  orderId: string;
  onStatusUpdate?: (status: OrderStatus) => void;
};

const ORDER_STATUSES: { [key in OrderStatus]: { label: string; icon: string; color: string } } = {
  pending: { label: 'Pending', icon: 'clock-outline', color: colors.warning },
  confirmed: { label: 'Confirmed', icon: 'check-circle-outline', color: colors.success },
  processing: { label: 'Processing', icon: 'washing-machine', color: colors.primary },
  ready_for_delivery: { label: 'Ready for Delivery', icon: 'package-variant', color: colors.info },
  out_for_delivery: { label: 'Out for Delivery', icon: 'truck-delivery-outline', color: colors.primary },
  delivered: { label: 'Delivered', icon: 'check-circle', color: colors.success },
  cancelled: { label: 'Cancelled', icon: 'close-circle', color: colors.error },
};

export default function OrderTracking({ orderId, onStatusUpdate }: OrderTrackingProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    fetchOrderDetails();
    subscribeToOrderUpdates();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          shop:shops(name, address),
          services:order_services(*),
          delivery:deliveries(*)
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;

      if (data) {
        setOrder(data);
        if (data.delivery) {
          setEstimatedDelivery(data.delivery.estimated_delivery_time);
          setDeliveryLocation(data.delivery.current_location);
        }
        onStatusUpdate?.(data.status);
      }
    } catch (err) {
      setError('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToOrderUpdates = () => {
    const subscription = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder((current: any) => ({ ...current, ...payload.new }));
          onStatusUpdate?.(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const getStatusIndex = (status: OrderStatus) => {
    return Object.keys(ORDER_STATUSES).indexOf(status);
  };

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </Card.Content>
      </Card>
    );
  }

  if (error || !order) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.error}>{error || 'Order not found'}</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            Order Tracking
          </Text>
          <IconButton
            icon={showDetails ? 'chevron-up' : 'chevron-down'}
            onPress={() => setShowDetails(!showDetails)}
          />
        </View>

        <View style={styles.timeline}>
          {Object.entries(ORDER_STATUSES).map(([status, { label, icon, color }], index) => {
            const isActive = getStatusIndex(order.status) >= index;
            const isCurrent = order.status === status;

            return (
              <View key={status} style={styles.timelineItem}>
                <View style={styles.timelineLine}>
                  {index < Object.keys(ORDER_STATUSES).length - 1 && (
                    <View
                      style={[
                        styles.timelineLineInner,
                        isActive && { backgroundColor: color },
                      ]}
                    />
                  )}
                </View>
                <View
                  style={[
                    styles.timelineIcon,
                    isActive && { backgroundColor: color },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={icon}
                    size={24}
                    color={isActive ? colors.white : colors.textLight}
                  />
                </View>
                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.timelineLabel,
                      isActive && { color: colors.text },
                      isCurrent && { fontWeight: 'bold' },
                    ]}
                  >
                    {label}
                  </Text>
                  {isCurrent && order.status_updated_at && (
                    <Text style={styles.timelineTime}>
                      {new Date(order.status_updated_at).toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {showDetails && (
          <>
            <Divider style={styles.divider} />

            <List.Item
              title="Order Details"
              description={`Order #${order.id}`}
              left={props => <List.Icon {...props} icon="receipt" />}
            />

            <List.Item
              title="Shop"
              description={order.shop?.name}
              left={props => <List.Icon {...props} icon="store" />}
            />

            <List.Item
              title="Services"
              description={order.services?.map((s: any) => s.name).join(', ')}
              left={props => <List.Icon {...props} icon="washing-machine" />}
            />

            {estimatedDelivery && (
              <List.Item
                title="Estimated Delivery"
                description={new Date(estimatedDelivery).toLocaleString()}
                left={props => <List.Icon {...props} icon="clock-outline" />}
              />
            )}

            {deliveryLocation && (
              <List.Item
                title="Current Location"
                description="View on Map"
                left={props => <List.Icon {...props} icon="map-marker" />}
                right={props => (
                  <Button
                    mode="text"
                    onPress={() => {/* TODO: Open map with location */}}
                  >
                    View
                  </Button>
                )}
              />
            )}
          </>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    flex: 1,
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
  timeline: {
    marginVertical: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLine: {
    width: 24,
    alignItems: 'center',
  },
  timelineLineInner: {
    width: 2,
    flex: 1,
    backgroundColor: colors.textLight,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  timelineContent: {
    flex: 1,
    justifyContent: 'center',
  },
  timelineLabel: {
    color: colors.textLight,
  },
  timelineTime: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
}); 
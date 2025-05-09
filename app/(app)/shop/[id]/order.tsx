import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Card,
  Button,
  Checkbox,
  TextInput,
  ActivityIndicator,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../../../lib/supabase';
import { useAuthStore } from '../../../../lib/auth';

type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  selected?: boolean;
};

type Shop = {
  id: string;
  name: string;
  services: Service[];
};

export default function Order() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    fetchShopDetails();
  }, [id]);

  const fetchShopDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select(`
          id,
          name,
          services (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setShop(data);
    } catch (err) {
      setError('Failed to fetch shop details');
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (serviceId: string) => {
    if (!shop) return;

    setShop({
      ...shop,
      services: shop.services.map((service) =>
        service.id === serviceId
          ? { ...service, selected: !service.selected }
          : service
      ),
    });
  };

  const calculateTotal = () => {
    if (!shop) return 0;
    return shop.services
      .filter((service) => service.selected)
      .reduce((total, service) => total + service.price, 0);
  };

  const handleSubmit = async () => {
    if (!shop || !user) return;

    const selectedServices = shop.services.filter((service) => service.selected);
    if (selectedServices.length === 0) {
      setError('Please select at least one service');
      return;
    }

    if (!deliveryAddress.trim()) {
      setError('Please enter a delivery address');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          shop_id: shop.id,
          status: 'pending',
          delivery_address: deliveryAddress,
          special_instructions: specialInstructions,
          total_amount: calculateTotal(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = selectedServices.map((service) => ({
        order_id: order.id,
        service_id: service.id,
        quantity: 1,
        price: service.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setShowSuccessDialog(true);
    } catch (err) {
      setError('Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !shop) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error || 'Shop not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineMedium">{shop.name}</Text>
          <Text variant="titleMedium" style={styles.subtitle}>
            Select Services
          </Text>
        </Card.Content>
      </Card>

      {shop.services.map((service) => (
        <Card key={service.id} style={styles.serviceCard}>
          <Card.Content>
            <View style={styles.serviceHeader}>
              <View style={styles.serviceInfo}>
                <Text variant="titleMedium">{service.name}</Text>
                <Text variant="bodyMedium" style={styles.serviceDescription}>
                  {service.description}
                </Text>
                <View style={styles.serviceDetails}>
                  <Text variant="bodyMedium">
                    <MaterialCommunityIcons name="clock-outline" size={16} />{' '}
                    {service.duration} mins
                  </Text>
                  <Text variant="titleMedium">${service.price.toFixed(2)}</Text>
                </View>
              </View>
              <Checkbox
                status={service.selected ? 'checked' : 'unchecked'}
                onPress={() => toggleService(service.id)}
              />
            </View>
          </Card.Content>
        </Card>
      ))}

      <Card style={styles.formCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.formTitle}>
            Delivery Details
          </Text>
          <TextInput
            label="Delivery Address"
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            style={styles.input}
            multiline
          />
          <TextInput
            label="Special Instructions (Optional)"
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            style={styles.input}
            multiline
          />
        </Card.Content>
      </Card>

      <Card style={styles.totalCard}>
        <Card.Content>
          <View style={styles.totalRow}>
            <Text variant="titleLarge">Total</Text>
            <Text variant="headlineSmall">${calculateTotal().toFixed(2)}</Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          style={styles.submitButton}
        >
          Place Order
        </Button>
      </View>

      <Portal>
        <Dialog
          visible={showSuccessDialog}
          onDismiss={() => {
            setShowSuccessDialog(false);
            router.back();
          }}
        >
          <Dialog.Title>Order Placed Successfully!</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Your order has been placed and is being processed. You can track its
              status in the Orders tab.
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
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  subtitle: {
    marginTop: 8,
    color: '#666',
  },
  serviceCard: {
    margin: 16,
    marginTop: 8,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceInfo: {
    flex: 1,
    marginRight: 16,
  },
  serviceDescription: {
    marginVertical: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formCard: {
    margin: 16,
    marginTop: 8,
  },
  formTitle: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  totalCard: {
    margin: 16,
    marginTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  submitButton: {
    paddingVertical: 8,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
}); 
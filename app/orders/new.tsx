import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { processCashOnDelivery } from '../../lib/payment';

export default function NewOrderScreen() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState('');
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');

  const services = [
    { id: 'laundry', name: 'Laundry', price: 20 },
    { id: 'dry_cleaning', name: 'Dry Cleaning', price: 30 },
    { id: 'ironing', name: 'Ironing', price: 15 },
    { id: 'express', name: 'Express Service', price: 40 },
  ];

  const handleCreateOrder = async () => {
    if (!selectedService || !address) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const service = services.find(s => s.id === selectedService);
      if (!service) return;

      // Create order with cash on delivery
      const payment = await processCashOnDelivery(
        Date.now().toString(), // temporary order ID
        service.price,
        'usd'
      );

      Alert.alert(
        'Order Created',
        'Your order has been created successfully! We will contact you shortly.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/orders'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create order. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Service</Text>
        <View style={styles.servicesList}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceItem,
                selectedService === service.id && styles.selectedService,
              ]}
              onPress={() => setSelectedService(service.id)}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.servicePrice}>${service.price}</Text>
              </View>
              {selectedService === service.id && (
                <MaterialIcons name="check-circle" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Delivery Address"
          value={address}
          onChangeText={setAddress}
          multiline
        />
        <TextInput
          style={[styles.input, styles.instructionsInput]}
          placeholder="Special Instructions (Optional)"
          value={instructions}
          onChangeText={setInstructions}
          multiline
        />
      </View>

      <TouchableOpacity style={styles.createButton} onPress={handleCreateOrder}>
        <Text style={styles.createButtonText}>Create Order</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  servicesList: {
    gap: 10,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedService: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
  },
  servicePrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  instructionsInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 
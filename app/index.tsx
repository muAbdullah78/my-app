import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  const services = [
    { id: 1, name: 'Laundry', icon: 'local-laundry-service' },
    { id: 2, name: 'Dry Cleaning', icon: 'cleaning-services' },
    { id: 3, name: 'Ironing', icon: 'iron' },
    { id: 4, name: 'Express Service', icon: 'local-shipping' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to LaundryApp</Text>
        <Text style={styles.subtitle}>Your laundry, our care</Text>
      </View>

      <View style={styles.servicesContainer}>
        <Text style={styles.sectionTitle}>Our Services</Text>
        <View style={styles.servicesGrid}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => router.push('/orders/new')}>
              <MaterialIcons name={service.icon} size={32} color="#007AFF" />
              <Text style={styles.serviceName}>{service.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.promoContainer}>
        <Text style={styles.sectionTitle}>Special Offers</Text>
        <View style={styles.promoCard}>
          <MaterialIcons name="local-offer" size={24} color="#FF9500" />
          <Text style={styles.promoText}>20% off on your first order!</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  servicesContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serviceName: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  promoContainer: {
    padding: 20,
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  promoText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#FF9500',
    fontWeight: '500',
  },
});
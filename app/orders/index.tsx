import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Mock data for orders
const mockOrders = [
  {
    id: '1',
    service: 'Laundry',
    status: 'pending',
    amount: 20,
    date: '2024-03-15',
    address: '123 Main St',
  },
  {
    id: '2',
    service: 'Dry Cleaning',
    status: 'completed',
    amount: 30,
    date: '2024-03-14',
    address: '123 Main St',
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return '#FFA500';
    case 'completed':
      return '#4CAF50';
    case 'cancelled':
      return '#F44336';
    default:
      return '#666';
  }
};

export default function OrdersScreen() {
  const router = useRouter();

  const renderOrderItem = ({ item }: { item: typeof mockOrders[0] }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => router.push(`/orders/${item.id}`)}>
      <View style={styles.orderHeader}>
        <Text style={styles.serviceName}>{item.service}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="attach-money" size={16} color="#666" />
          <Text style={styles.detailText}>${item.amount}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="calendar-today" size={16} color="#666" />
          <Text style={styles.detailText}>{item.date}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="location-on" size={16} color="#666" />
          <Text style={styles.detailText}>{item.address}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={mockOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
      
      <TouchableOpacity
        style={styles.newOrderButton}
        onPress={() => router.push('/orders/new')}>
        <MaterialIcons name="add" size={24} color="#fff" />
        <Text style={styles.newOrderButtonText}>New Order</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  orderDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: '#666',
    fontSize: 14,
  },
  newOrderButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  newOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, SegmentedButtons, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import OrderHistory from '@/components/orders/OrderHistory';

type OrderFilter = 'all' | 'active' | 'completed';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [filter, setFilter] = useState<OrderFilter>('all');
  const theme = useTheme();

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.error}>Please sign in to view your orders</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          My Orders
        </Text>
        <SegmentedButtons
          value={filter}
          onValueChange={value => setFilter(value as OrderFilter)}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'completed', label: 'Completed' },
          ]}
          style={styles.filterButtons}
        />
      </View>

      <OrderHistory
        userId={user.id}
        filter={filter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    marginBottom: 16,
  },
  filterButtons: {
    marginBottom: 8,
  },
  error: {
    textAlign: 'center',
    margin: 16,
    color: '#666',
  },
});
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { orders } from '@/data/mockData';
import OrderCard from '@/components/orders/OrderCard';
import { useAuth } from '@/hooks/useAuth';
import { StatusBar } from 'expo-status-bar';
import EmptyState from '@/components/ui/EmptyState';

type OrderFilterType = 'active' | 'completed' | 'all';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { userRole } = useAuth();
  const [filter, setFilter] = useState<OrderFilterType>('active');

  // Filter orders based on the selected filter
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['pending', 'processing', 'ready_for_delivery', 'in_transit'].includes(order.status);
    if (filter === 'completed') return ['delivered', 'cancelled'].includes(order.status);
    return true;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>
          {userRole === 'shop_owner' ? 'Manage Orders' : 'Your Orders'}
        </Text>
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'active' && styles.activeFilterTab]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.filterText, filter === 'active' && styles.activeFilterText]}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'completed' && styles.activeFilterTab]}
            onPress={() => setFilter('completed')}
          >
            <Text style={[styles.filterText, filter === 'completed' && styles.activeFilterText]}>
              Completed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
              All
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {filteredOrders.length > 0 ? (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <OrderCard order={item} userRole={userRole} />}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState
          title="No orders found"
          description={`You don't have any ${filter} orders yet.`}
          icon="package"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: colors.text,
    marginBottom: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: colors.light,
    borderRadius: 8,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeFilterTab: {
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: colors.textLight,
  },
  activeFilterText: {
    color: colors.primary,
  },
  ordersList: {
    padding: 16,
  },
});
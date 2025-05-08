import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { orders, shops } from '@/data/mockData';
import { colors } from '@/constants/colors';
import { Package, Map, Clock, Calendar, Star } from 'lucide-react-native';
import Button from '@/components/ui/Button';
import Animated, { FadeInRight } from 'react-native-reanimated';

export default function CustomerHome() {
  const router = useRouter();
  
  const activeOrders = orders.filter(order => 
    ['pending', 'processing', 'ready_for_delivery', 'in_transit'].includes(order.status)
  ).slice(0, 2);
  
  const nearbyShops = shops.sort((a, b) => a.distance - b.distance).slice(0, 3);
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/discover')}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
            <Map size={24} color={colors.primary} />
          </View>
          <Text style={styles.actionText}>Find Shop</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/orders')}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.secondaryLight }]}>
            <Package size={24} color={colors.secondary} />
          </View>
          <Text style={styles.actionText}>My Orders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {}}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.accentLight }]}>
            <Calendar size={24} color={colors.accent} />
          </View>
          <Text style={styles.actionText}>Schedule</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {}}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.successLight }]}>
            <Clock size={24} color={colors.success} />
          </View>
          <Text style={styles.actionText}>History</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Orders</Text>
          <TouchableOpacity onPress={() => router.push('/orders')}>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {activeOrders.length > 0 ? (
          activeOrders.map((order, index) => (
            <Animated.View 
              key={order.id} 
              entering={FadeInRight.delay(index * 200)}
              style={styles.activeOrderCard}
            >
              <View style={styles.orderStatusBar}>
                <View style={styles.shopInfo}>
                  <Image source={{ uri: order.shopImage }} style={styles.shopImage} />
                  <View>
                    <Text style={styles.shopName}>{order.shopName}</Text>
                    <Text style={styles.orderNumber}>Order #{order.id}</Text>
                  </View>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {order.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </View>
              </View>
              
              <View style={styles.orderDetails}>
                <View style={styles.orderDetail}>
                  <Text style={styles.detailLabel}>Order Date</Text>
                  <Text style={styles.detailValue}>{order.date}</Text>
                </View>
                <View style={styles.orderDetail}>
                  <Text style={styles.detailLabel}>Total</Text>
                  <Text style={styles.detailValue}>${order.total}</Text>
                </View>
                <View style={styles.orderDetail}>
                  <Text style={styles.detailLabel}>Delivery</Text>
                  <Text style={styles.detailValue}>{order.deliveryDate}</Text>
                </View>
              </View>
              
              <Button
                text="Track Order"
                variant="outline"
                onPress={() => {}}
                style={styles.trackButton}
              />
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyOrdersContainer}>
            <Text style={styles.emptyOrdersText}>You have no active orders</Text>
            <Button
              text="Place an Order"
              onPress={() => router.push('/discover')}
              style={styles.placeOrderButton}
            />
          </View>
        )}
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Laundry Shops</Text>
          <TouchableOpacity onPress={() => router.push('/discover')}>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {nearbyShops.map(shop => (
          <TouchableOpacity 
            key={shop.id}
            style={styles.shopCard}
            onPress={() => {}}
            activeOpacity={0.8}
          >
            <Image source={{ uri: shop.image }} style={styles.shopCardImage} />
            <View style={styles.shopCardContent}>
              <Text style={styles.shopCardName}>{shop.name}</Text>
              <View style={styles.shopCardDetails}>
                <View style={styles.shopCardRating}>
                  <Star size={14} color={colors.warning} fill={colors.warning} />
                  <Text style={styles.shopCardRatingText}>{shop.rating}</Text>
                </View>
                <Text style={styles.shopCardDistance}>{shop.distance} mi</Text>
              </View>
              <Text style={styles.shopCardServices}>{shop.services.join(' • ')}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: colors.text,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: colors.text,
  },
  seeAllButton: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: colors.primary,
  },
  activeOrderCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  orderStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  shopName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  orderNumber: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.textLight,
  },
  statusBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: colors.primary,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  orderDetail: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  detailValue: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: colors.text,
  },
  trackButton: {
    marginBottom: 0,
  },
  emptyOrdersContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyOrdersText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 16,
  },
  placeOrderButton: {
    width: '80%',
    marginBottom: 0,
  },
  shopCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shopCardImage: {
    width: 80,
    height: 80,
  },
  shopCardContent: {
    flex: 1,
    padding: 12,
  },
  shopCardName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  shopCardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  shopCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  shopCardRatingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: colors.text,
    marginLeft: 4,
  },
  shopCardDistance: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.textLight,
  },
  shopCardServices: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.textLight,
  },
});
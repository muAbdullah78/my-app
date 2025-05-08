import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { orders } from '@/data/mockData';
import { PackageCheck, DollarSign, UserCheck, TrendingUp, Calendar } from 'lucide-react-native';
import Button from '@/components/ui/Button';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function ShopOwnerDashboard() {
  const router = useRouter();

  // Calculate order statistics
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const processingOrders = orders.filter(order => order.status === 'processing').length;
  const readyOrders = orders.filter(order => order.status === 'ready_for_delivery').length;
  
  // Calculate daily revenue
  const dailyRevenue = orders
    .filter(order => order.status !== 'cancelled')
    .reduce((total, order) => total + order.total, 0);
    
  // Get today's orders
  const todaysOrders = orders.slice(0, 3);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.statsGrid}>
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.primaryLight }]}>
            <PackageCheck size={20} color={colors.primary} />
          </View>
          <Text style={styles.statValue}>{pendingOrders + processingOrders + readyOrders}</Text>
          <Text style={styles.statLabel}>Active Orders</Text>
        </Animated.View>
        
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.successLight }]}>
            <DollarSign size={20} color={colors.success} />
          </View>
          <Text style={styles.statValue}>${dailyRevenue}</Text>
          <Text style={styles.statLabel}>Today's Revenue</Text>
        </Animated.View>
        
        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.secondaryLight }]}>
            <UserCheck size={20} color={colors.secondary} />
          </View>
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.statLabel}>Customers</Text>
        </Animated.View>
        
        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: colors.warningLight }]}>
            <TrendingUp size={20} color={colors.warning} />
          </View>
          <Text style={styles.statValue}>18%</Text>
          <Text style={styles.statLabel}>Growth</Text>
        </Animated.View>
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Orders</Text>
          <TouchableOpacity onPress={() => router.push('/orders')}>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.orderCards}>
          {todaysOrders.map((order, index) => (
            <Animated.View 
              key={order.id} 
              entering={FadeInUp.delay(500 + (index * 100))} 
              style={styles.orderCard}
            >
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderNumber}>Order #{order.id}</Text>
                  <Text style={styles.orderTime}>{order.time}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  order.status === 'pending' ? styles.pendingBadge :
                  order.status === 'processing' ? styles.processingBadge :
                  order.status === 'ready_for_delivery' ? styles.readyBadge :
                  order.status === 'delivered' ? styles.deliveredBadge :
                  styles.cancelledBadge
                ]}>
                  <Text style={styles.statusText}>
                    {order.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </View>
              </View>
              
              <View style={styles.orderItems}>
                {order.services.map((service, idx) => (
                  <Text key={idx} style={styles.orderItem}>
                    {service.quantity}x {service.name} - ${service.price}
                  </Text>
                ))}
              </View>
              
              <View style={styles.orderFooter}>
                <Text style={styles.orderTotal}>Total: ${order.total}</Text>
                <Button
                  text={
                    order.status === 'pending' ? 'Accept' :
                    order.status === 'processing' ? 'Mark Ready' :
                    order.status === 'ready_for_delivery' ? 'Deliver' :
                    'View Details'
                  }
                  variant={order.status === 'cancelled' ? 'outline' : 'primary'}
                  onPress={() => {}}
                  style={styles.orderButton}
                />
              </View>
            </Animated.View>
          ))}
        </View>
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Business Overview</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllButton}>This Week</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.dashboardCard}>
          <View style={styles.chartPlaceholder}>
            <Calendar size={24} color={colors.textLight} />
            <Text style={styles.chartPlaceholderText}>Orders by day of week</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>Total Orders</Text>
              <Text style={styles.statItemValue}>42</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>Avg. Order Value</Text>
              <Text style={styles.statItemValue}>$38</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>Completion Rate</Text>
              <Text style={styles.statItemValue}>94%</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statCard: {
    width: '46%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    margin: '2%',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.textLight,
  },
  section: {
    marginVertical: 16,
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
  orderCards: {
    gap: 16,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  orderTime: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.textLight,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: colors.warningLight,
  },
  processingBadge: {
    backgroundColor: colors.primaryLight,
  },
  readyBadge: {
    backgroundColor: colors.secondaryLight,
  },
  deliveredBadge: {
    backgroundColor: colors.successLight,
  },
  cancelledBadge: {
    backgroundColor: colors.errorLight,
  },
  statusText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: colors.textLight,
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: colors.text,
    marginBottom: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  orderTotal: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  orderButton: {
    marginBottom: 0,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dashboardCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  chartPlaceholder: {
    height: 160,
    backgroundColor: colors.light,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartPlaceholderText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statItemLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
    textAlign: 'center',
  },
  statItemValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
});
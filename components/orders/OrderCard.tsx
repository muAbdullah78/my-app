import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '@/constants/colors';
import { Package, Clock, MapPin, ChevronRight } from 'lucide-react-native';
import { Order } from '@/types';
import { useRouter } from 'expo-router';
import { UserRole } from '@/contexts/AuthContext';

interface OrderCardProps {
  order: Order;
  userRole: UserRole | null;
}

export default function OrderCard({ order, userRole }: OrderCardProps) {
  const router = useRouter();
  
  const statusColors: Record<string, { background: string; text: string }> = {
    pending: { background: colors.warningLight, text: colors.warning },
    processing: { background: colors.primaryLight, text: colors.primary },
    ready_for_delivery: { background: colors.secondaryLight, text: colors.secondary },
    in_transit: { background: colors.secondaryLight, text: colors.secondary },
    delivered: { background: colors.successLight, text: colors.success },
    cancelled: { background: colors.errorLight, text: colors.error },
  };
  
  const getStatusColor = (status: string) => {
    return statusColors[status] || { background: colors.light, text: colors.textLight };
  };
  
  const getStatusText = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  const viewOrderDetails = () => {
    // Navigate to order details screen
    router.push(`/order/${order.id}`);
  };
  
  const { background, text } = getStatusColor(order.status);
  
  return (
    <TouchableOpacity style={styles.container} onPress={viewOrderDetails} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={styles.shopInfo}>
          <Image source={{ uri: order.shopImage }} style={styles.shopImage} />
          <View>
            <Text style={styles.shopName}>{order.shopName}</Text>
            <View style={styles.orderMetaRow}>
              <Text style={styles.orderNumber}>Order #{order.id}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.date}>{order.date}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: background }]}>
          <Text style={[styles.statusText, { color: text }]}>
            {getStatusText(order.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.detailRow}>
          <Package size={16} color={colors.textLight} />
          <View style={styles.servicesList}>
            {order.services.map((service, index) => (
              <Text key={index} style={styles.serviceItem} numberOfLines={1}>
                {service.quantity}× {service.name}
              </Text>
            ))}
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <Clock size={16} color={colors.textLight} />
          <Text style={styles.detailText}>
            {order.deliveryDate} • {order.deliveryTime}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <MapPin size={16} color={colors.textLight} />
          <Text style={styles.detailText} numberOfLines={1}>
            {order.address}
          </Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.totalAmount}>Total: ${order.total.toFixed(2)}</Text>
        <View style={styles.actionButton}>
          <Text style={styles.actionText}>
            {userRole === 'shop_owner' 
              ? (order.status === 'pending' 
                ? 'Accept Order' 
                : 'Manage Order')
              : 'View Details'}
          </Text>
          <ChevronRight size={16} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  orderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderNumber: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.textLight,
  },
  dot: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.textLight,
    marginHorizontal: 4,
  },
  date: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.textLight,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
  },
  content: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  servicesList: {
    marginLeft: 12,
    flex: 1,
  },
  serviceItem: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  detailText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalAmount: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: colors.primary,
    marginRight: 4,
  },
});
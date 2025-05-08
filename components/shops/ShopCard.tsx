import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '@/constants/colors';
import { Star } from 'lucide-react-native';
import { Shop } from '@/types';

interface ShopCardProps {
  shop: Shop;
}

export default function ShopCard({ shop }: ShopCardProps) {
  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.8}>
      <Image source={{ uri: shop.image }} style={styles.image} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{shop.name}</Text>
          <View style={styles.ratingContainer}>
            <Star size={14} color={colors.warning} fill={colors.warning} />
            <Text style={styles.rating}>{shop.rating}</Text>
            <Text style={styles.reviewCount}>({shop.reviewCount})</Text>
          </View>
        </View>
        
        <View style={styles.details}>
          <View style={styles.tagContainer}>
            <Text style={styles.priceTag}>{shop.priceRange}</Text>
            <Text style={styles.distanceTag}>{shop.distance} mi</Text>
          </View>
          
          <Text style={styles.services} numberOfLines={1}>
            {shop.services.join(' • ')}
          </Text>
          
          <Text style={styles.hours}>{shop.hours}</Text>
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
  image: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 8,
  },
  name: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: colors.text,
    marginLeft: 4,
  },
  reviewCount: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 2,
  },
  details: {
    gap: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  priceTag: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: colors.text,
    backgroundColor: colors.light,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  distanceTag: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  services: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.text,
  },
  hours: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.success,
  },
});
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { Shop } from '@/types';

interface ShopMapViewProps {
  shops: Shop[];
}

export default function ShopMapView({ shops }: ShopMapViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.webMapPlaceholder}>
        <Text style={styles.placeholderText}>Map view is not available on web</Text>
        <Text style={styles.placeholderSubtext}>
          {shops.length} shops in your area
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webMapPlaceholder: {
    flex: 1,
    backgroundColor: colors.light,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.textLight,
  },
});
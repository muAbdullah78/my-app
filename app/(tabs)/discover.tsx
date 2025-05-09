import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchBar from '@/components/ui/SearchBar';
import ShopCard from '@/components/shops/ShopCard';
import { Map, List } from 'lucide-react-native';
import FilterModal from '@/components/shops/FilterModal';
import Animated, { FadeIn } from 'react-native-reanimated';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

// Only import MapView on mobile platforms
let MapViewComponent: any = null;
if (Platform.OS !== 'web') {
  MapViewComponent = require('@/components/shops/MapView').default;
}

type Shop = {
  id: string;
  name: string;
  address: string;
  rating: number;
  services: string[];
  price_range: [number, number];
  latitude: number;
  longitude: number;
  image_url: string;
};

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    services: [] as string[],
    rating: 0,
    priceRange: [0, 100],
    distance: 5,
  });
  
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data, error } = await supabase
        .from('shops')
        .select('*');
        
      if (error) throw error;
      
      setShops(data || []);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch shops');
    } finally {
      setLoading(false);
    }
  };

  const toggleViewMode = () => {
    if (Platform.OS === 'web' && viewMode === 'list') {
      // Prevent switching to map view on web
      return;
    }
    setViewMode(prev => (prev === 'list' ? 'map' : 'list'));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const applyFilters = (filters: typeof activeFilters) => {
    setActiveFilters(filters);
    setFilterModalVisible(false);
  };

  const renderMapView = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.webMapPlaceholder}>
          <Text style={styles.webMapText}>Map view is not available on web</Text>
          <Button 
            text="Switch to List View"
            onPress={() => setViewMode('list')}
            style={styles.webMapButton}
          />
        </View>
      );
    }
    return MapViewComponent ? <MapViewComponent shops={shops} /> : null;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading shops...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            text="Try Again"
            onPress={fetchShops}
            style={styles.retryButton}
          />
        </View>
      );
    }

    if (shops.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No shops found</Text>
        </View>
      );
    }

    return viewMode === 'list' ? (
      <Animated.View entering={FadeIn.duration(300)} style={styles.listContainer}>
        <FlatList
          data={shops}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ShopCard shop={item} />}
          contentContainerStyle={styles.shopsList}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    ) : (
      <Animated.View entering={FadeIn.duration(300)} style={styles.mapContainer}>
        {renderMapView()}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Laundry Services</Text>
        <SearchBar 
          placeholder="Search laundry shops..." 
          onSearch={handleSearch}
          value={searchQuery}
        />
        <View style={styles.actions}>
          <Button 
            text="Filter"
            variant="outline"
            onPress={() => setFilterModalVisible(true)}
            style={styles.filterButton}
          />
          {/* Only show map toggle on mobile platforms */}
          {(Platform.OS === 'ios' || Platform.OS === 'android') && (
            <TouchableOpacity style={styles.viewToggle} onPress={toggleViewMode}>
              {viewMode === 'list' ? (
                <Map size={22} color={colors.primary} />
              ) : (
                <List size={22} color={colors.primary} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderContent()}

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={activeFilters}
        onApply={applyFilters}
      />
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    marginRight: 12,
  },
  viewToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  listContainer: {
    flex: 1,
  },
  shopsList: {
    padding: 16,
    paddingTop: 0,
  },
  mapContainer: {
    flex: 1,
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  webMapText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  webMapButton: {
    minWidth: 200,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: colors.text,
    marginTop: 12,
  },
  errorText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 120,
  },
});
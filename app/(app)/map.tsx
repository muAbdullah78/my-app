import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import {
  Text,
  Card,
  ActivityIndicator,
  IconButton,
  Portal,
  Dialog,
  Searchbar,
  Chip,
  Menu,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';

type Shop = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  total_ratings: number;
  is_open: boolean;
  services: string[];
};

type Filter = {
  openNow: boolean;
  minRating: number;
  services: string[];
};

export default function Map() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filter>({
    openNow: false,
    minRating: 0,
    services: [],
  });
  const [availableServices, setAvailableServices] = useState<string[]>([]);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [shops, filters, searchQuery]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required to show nearby shops');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      fetchNearbyShops(location.coords.latitude, location.coords.longitude);
    } catch (err) {
      setError('Failed to get location');
    }
  };

  const fetchNearbyShops = async (latitude: number, longitude: number) => {
    try {
      setLoading(true);
      setError('');

      // Calculate a bounding box (approximately 10km radius)
      const latDelta = 0.1;
      const lngDelta = 0.1;

      const { data, error } = await supabase
        .from('shops')
        .select(`
          *,
          services:shop_services (
            service:services (
              name
            )
          )
        `)
        .gte('latitude', latitude - latDelta)
        .lte('latitude', latitude + latDelta)
        .gte('longitude', longitude - lngDelta)
        .lte('longitude', longitude + lngDelta)
        .eq('is_active', true);

      if (error) throw error;

      // Transform data to include services array
      const transformedShops = data.map(shop => ({
        ...shop,
        services: shop.services.map((s: any) => s.service.name),
      }));

      setShops(transformedShops);
      setFilteredShops(transformedShops);

      // Extract unique services
      const services = Array.from(
        new Set(transformedShops.flatMap(shop => shop.services))
      );
      setAvailableServices(services);
    } catch (err) {
      setError('Failed to fetch nearby shops');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...shops];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        shop =>
          shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          shop.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply open now filter
    if (filters.openNow) {
      filtered = filtered.filter(shop => shop.is_open);
    }

    // Apply rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter(shop => shop.rating >= filters.minRating);
    }

    // Apply services filter
    if (filters.services.length > 0) {
      filtered = filtered.filter(shop =>
        filters.services.every(service => shop.services.includes(service))
      );
    }

    setFilteredShops(filtered);
  };

  const handleMarkerPress = (shop: Shop) => {
    setSelectedShop(shop);
  };

  const handleShopPress = () => {
    if (selectedShop) {
      router.push(`/shop/${selectedShop.id}`);
    }
  };

  const toggleServiceFilter = (service: string) => {
    setFilters(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service],
    }));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search shops..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <IconButton
          icon="filter-variant"
          onPress={() => setShowFilters(!showFilters)}
          style={[
            styles.filterButton,
            showFilters && styles.filterButtonActive,
          ]}
        />
      </View>

      {showFilters && (
        <Card style={styles.filtersCard}>
          <Card.Content>
            <View style={styles.filterSection}>
              <Text variant="titleMedium">Status</Text>
              <Chip
                selected={filters.openNow}
                onPress={() =>
                  setFilters(prev => ({ ...prev, openNow: !prev.openNow }))
                }
                style={styles.filterChip}
              >
                Open Now
              </Chip>
            </View>

            <View style={styles.filterSection}>
              <Text variant="titleMedium">Rating</Text>
              <View style={styles.ratingFilters}>
                {[0, 3, 3.5, 4, 4.5].map(rating => (
                  <Chip
                    key={rating}
                    selected={filters.minRating === rating}
                    onPress={() =>
                      setFilters(prev => ({ ...prev, minRating: rating }))
                    }
                    style={styles.filterChip}
                  >
                    {rating === 0 ? 'Any' : `${rating}+`}
                  </Chip>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text variant="titleMedium">Services</Text>
              <View style={styles.serviceFilters}>
                {availableServices.map(service => (
                  <Chip
                    key={service}
                    selected={filters.services.includes(service)}
                    onPress={() => toggleServiceFilter(service)}
                    style={styles.filterChip}
                  >
                    {service}
                  </Chip>
                ))}
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={
          userLocation
            ? {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }
            : undefined
        }
        showsUserLocation
        showsMyLocationButton
      >
        {filteredShops.map((shop) => (
          <Marker
            key={shop.id}
            coordinate={{
              latitude: shop.latitude,
              longitude: shop.longitude,
            }}
            onPress={() => handleMarkerPress(shop)}
          >
            <View style={styles.markerContainer}>
              <MaterialCommunityIcons
                name="washing-machine"
                size={24}
                color={shop.is_open ? '#4CAF50' : '#F44336'}
              />
            </View>
          </Marker>
        ))}
      </MapView>

      <Portal>
        <Dialog
          visible={!!selectedShop}
          onDismiss={() => setSelectedShop(null)}
          style={styles.dialog}
        >
          {selectedShop && (
            <>
              <Dialog.Title>{selectedShop.name}</Dialog.Title>
              <Dialog.Content>
                <Text variant="bodyMedium" style={styles.address}>
                  {selectedShop.address}
                </Text>
                <View style={styles.ratingContainer}>
                  <MaterialCommunityIcons
                    name="star"
                    size={20}
                    color="#FFC107"
                  />
                  <Text variant="bodyMedium" style={styles.rating}>
                    {selectedShop.rating.toFixed(1)} ({selectedShop.total_ratings})
                  </Text>
                </View>
                <Text
                  variant="bodyMedium"
                  style={[
                    styles.status,
                    { color: selectedShop.is_open ? '#4CAF50' : '#F44336' },
                  ]}
                >
                  {selectedShop.is_open ? 'Open' : 'Closed'}
                </Text>
                <View style={styles.servicesContainer}>
                  {selectedShop.services.map((service, index) => (
                    <Chip key={index} style={styles.serviceChip}>
                      {service}
                    </Chip>
                  ))}
                </View>
              </Dialog.Content>
              <Dialog.Actions>
                <IconButton
                  icon="close"
                  onPress={() => setSelectedShop(null)}
                />
                <IconButton
                  icon="arrow-right"
                  onPress={handleShopPress}
                />
              </Dialog.Actions>
            </>
          )}
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    zIndex: 1,
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
  },
  filterButton: {
    backgroundColor: '#fff',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filtersCard: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  ratingFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  markerContainer: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  dialog: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    margin: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  address: {
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    marginLeft: 4,
  },
  status: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  serviceChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
}); 
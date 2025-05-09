import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Searchbar, Card, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';

type Shop = {
  id: string;
  name: string;
  description: string;
  address: string;
  rating: number;
  total_ratings: number;
  distance?: number;
};

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      } catch (err) {
        setError('Failed to get location');
      }
    })();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('shops')
        .select('*')
        .eq('is_active', true);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate distances if location is available
      const shopsWithDistance = location
        ? data.map((shop: Shop) => ({
            ...shop,
            distance: calculateDistance(
              location.coords.latitude,
              location.coords.longitude,
              shop.location.coordinates[1],
              shop.location.coordinates[0]
            ),
          }))
        : data;

      // Sort by distance if available
      const sortedShops = shopsWithDistance.sort((a: Shop, b: Shop) => {
        if (a.distance && b.distance) {
          return a.distance - b.distance;
        }
        return 0;
      });

      setShops(sortedShops);
    } catch (err) {
      setError('Failed to fetch shops');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchShops();
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (value: number) => {
    return (value * Math.PI) / 180;
  };

  const renderShopCard = ({ item }: { item: Shop }) => (
    <Card style={styles.card} onPress={() => router.push(`/shop/${item.id}`)}>
      <Card.Title
        title={item.name}
        subtitle={item.distance ? `${item.distance.toFixed(1)} km away` : item.address}
      />
      <Card.Content>
        <Text numberOfLines={2}>{item.description}</Text>
        <View style={styles.ratingContainer}>
          <Text>Rating: {item.rating.toFixed(1)} ({item.total_ratings})</Text>
        </View>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => router.push(`/shop/${item.id}`)}>View Details</Button>
        <Button onPress={() => router.push(`/shop/${item.id}/order`)}>Order Now</Button>
      </Card.Actions>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search shops..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={shops}
          renderItem={renderShopCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No shops found</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    margin: 16,
    elevation: 4,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  ratingContainer: {
    marginTop: 8,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    margin: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#666',
  },
}); 
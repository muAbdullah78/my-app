import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Searchbar, Card, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
// REMOVED: import * as Location from 'expo-location'; // Removed this line
import { supabase } from '../../lib/supabase';

type Shop = {
  id: string;
  name: string;
  description: string;
  address: string;
  rating: number;
  total_ratings: number;
  // REMOVED: distance?: number; // Removed this property
};

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // REMOVED: const [location, setLocation] = useState<Location.LocationObject | null>(null); // Removed this state
  const [error, setError] = useState(''); // Keep this for other errors

  // REMOVED: useEffect hook for fetching location (lines 23-34 in original)

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

      // REMOVED: Logic to calculate and sort by distance (lines 54-66 in original)
      // Replaced with:
      setShops(data as Shop[]);

    } catch (err) {
      // If error has a message property, use it, otherwise use a generic message
      setError(err instanceof Error ? err.message : 'Failed to fetch shops');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [searchQuery]); // Keep searchQuery as dependency

  const onRefresh = () => {
    setRefreshing(true);
    fetchShops();
  };

  // REMOVED: calculateDistance and toRad helper functions (lines 68-86 in original)

  const renderShopCard = ({ item }: { item: Shop }) => (
    <Card style={styles.card} onPress={() => router.push(`/shop/${item.id}`)}>
      <Card.Title
        title={item.name}
        // MODIFIED: Removed distance check, now just shows address
        subtitle={item.address}
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
        <Text style={styles.error}>Error: {error}</Text> // Added "Error: " prefix
      ) : (
        <FlatList
          data={shops}
          renderItem={renderShopCard}
          keyExtractor={(item) => item.id.toString()} // Ensure key is a string
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
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Text, Card, Button, Chip, Divider, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
};

type Review = {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    full_name: string;
  };
};

type Shop = {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  rating: number;
  total_ratings: number;
  opening_hours: {
    [key: string]: { open: string; close: string };
  };
  services: Service[];
};

export default function ShopDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchShopDetails();
    fetchReviews();
  }, [id]);

  const fetchShopDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select(`
          *,
          services (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setShop(data);
    } catch (err) {
      setError('Failed to fetch shop details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          user:user_profiles (full_name)
        `)
        .eq('shop_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  const renderService = ({ item }: { item: Service }) => (
    <Card style={styles.serviceCard}>
      <Card.Content>
        <Text variant="titleMedium">{item.name}</Text>
        <Text variant="bodyMedium" style={styles.serviceDescription}>
          {item.description}
        </Text>
        <View style={styles.serviceDetails}>
          <Chip icon="clock-outline">{item.duration} mins</Chip>
          <Chip icon="currency-usd">${item.price.toFixed(2)}</Chip>
        </View>
      </Card.Content>
    </Card>
  );

  const renderReview = ({ item }: { item: Review }) => (
    <Card style={styles.reviewCard}>
      <Card.Content>
        <View style={styles.reviewHeader}>
          <Text variant="titleMedium">{item.user.full_name}</Text>
          <View style={styles.ratingContainer}>
            <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
            <Text>{item.rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text variant="bodyMedium" style={styles.reviewComment}>
          {item.comment}
        </Text>
        <Text variant="bodySmall" style={styles.reviewDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !shop) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error || 'Shop not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineMedium">{shop.name}</Text>
          <View style={styles.ratingContainer}>
            <MaterialCommunityIcons name="star" size={20} color="#FFD700" />
            <Text variant="titleMedium">
              {shop.rating.toFixed(1)} ({shop.total_ratings} reviews)
            </Text>
          </View>
          <Text variant="bodyMedium" style={styles.address}>
            {shop.address}
          </Text>
          <Text variant="bodyMedium">{shop.phone}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleLarge">About</Text>
          <Text variant="bodyMedium">{shop.description}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleLarge">Opening Hours</Text>
          {Object.entries(shop.opening_hours).map(([day, hours]) => (
            <View key={day} style={styles.hoursRow}>
              <Text variant="bodyMedium" style={styles.day}>
                {day}
              </Text>
              <Text variant="bodyMedium">
                {hours.open} - {hours.close}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleLarge">Services</Text>
          <FlatList
            data={shop.services}
            renderItem={renderService}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleLarge">Reviews</Text>
          <FlatList
            data={reviews}
            renderItem={renderReview}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => router.push(`/shop/${id}/order`)}
          style={styles.orderButton}
        >
          Order Now
        </Button>
      </View>
    </ScrollView>
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
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  sectionCard: {
    margin: 16,
    marginTop: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  address: {
    marginVertical: 8,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  day: {
    fontWeight: 'bold',
  },
  serviceCard: {
    marginVertical: 8,
  },
  serviceDescription: {
    marginVertical: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 8,
  },
  reviewCard: {
    marginVertical: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewComment: {
    marginVertical: 8,
  },
  reviewDate: {
    color: '#666',
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  orderButton: {
    paddingVertical: 8,
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
}); 
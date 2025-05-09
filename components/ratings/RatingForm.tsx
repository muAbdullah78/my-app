import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  IconButton,
  Portal,
  Dialog,
  Card,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';

type RatingFormProps = {
  orderId: string;
  shopId: string;
  userId: string;
  onSubmit: () => void;
  onCancel: () => void;
};

export default function RatingForm({
  orderId,
  shopId,
  userId,
  onSubmit,
  onCancel,
}: RatingFormProps) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => asset.uri);
        setImages(current => [...current, ...newImages]);
      }
    } catch (err) {
      console.error('Error picking images:', err);
      setError('Failed to pick images');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Upload images first
      const uploadedImageUrls = await Promise.all(
        images.map(async (uri) => {
          const response = await fetch(uri);
          const blob = await response.blob();
          const filename = uri.split('/').pop() || 'image.jpg';
          const fileExt = filename.split('.').pop();
          const filePath = `${orderId}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('review-images')
            .upload(filePath, blob);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('review-images')
            .getPublicUrl(filePath);

          return publicUrl;
        })
      );

      // Create the rating
      const { error: ratingError } = await supabase
        .from('ratings')
        .insert({
          order_id: orderId,
          shop_id: shopId,
          user_id: userId,
          rating,
          review_text: reviewText.trim(),
          images: uploadedImageUrls,
          is_verified_purchase: true,
        });

      if (ratingError) throw ratingError;

      onSubmit();
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(current => current.filter((_, i) => i !== index));
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <IconButton
            key={star}
            icon={star <= rating ? 'star' : 'star-outline'}
            size={32}
            iconColor={star <= rating ? colors.warning : colors.textLight}
            onPress={() => setRating(star)}
          />
        ))}
      </View>
    );
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <ScrollView>
          <Text variant="titleLarge" style={styles.title}>
            Rate Your Purchase
          </Text>

          <View style={styles.ratingContainer}>
            <Text variant="titleMedium">Your Rating</Text>
            {renderStars()}
          </View>

          <TextInput
            label="Write your review (optional)"
            value={reviewText}
            onChangeText={setReviewText}
            multiline
            numberOfLines={4}
            style={styles.reviewInput}
          />

          <View style={styles.imagesSection}>
            <Text variant="titleMedium">Add Photos (optional)</Text>
            <View style={styles.imagesContainer}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: image }} style={styles.image} />
                  <IconButton
                    icon="close"
                    size={20}
                    style={styles.removeButton}
                    onPress={() => removeImage(index)}
                  />
                </View>
              ))}
              {images.length < 5 && (
                <Button
                  mode="outlined"
                  icon="camera"
                  onPress={handleImagePick}
                  style={styles.addImageButton}
                >
                  Add Photo
                </Button>
              )}
            </View>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={onCancel}
              style={styles.button}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.button}
              loading={loading}
              disabled={loading || rating === 0}
            >
              Submit Review
            </Button>
          </View>
        </ScrollView>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  reviewInput: {
    marginBottom: 24,
  },
  imagesSection: {
    marginBottom: 24,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.error,
  },
  addImageButton: {
    width: 100,
    height: 100,
    justifyContent: 'center',
  },
  error: {
    color: colors.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  button: {
    flex: 1,
  },
}); 
import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import {
  Text,
  Card,
  Button,
  IconButton,
  Menu,
  Portal,
  Dialog,
  TextInput,
  Avatar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';

type RatingProps = {
  rating: {
    id: string;
    user_id: string;
    rating: number;
    review_text?: string;
    images: string[];
    helpful_count: number;
    reported_count: number;
    is_verified_purchase: boolean;
    created_at: string;
    user: {
      id: string;
      name: string;
      avatar_url?: string;
    };
    response?: {
      id: string;
      response_text: string;
      created_at: string;
    };
  };
  currentUserId?: string;
  isShopOwner?: boolean;
  onUpdate?: () => void;
};

export default function Rating({
  rating,
  currentUserId,
  isShopOwner,
  onUpdate,
}: RatingProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportDialogVisible, setReportDialogVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [responseDialogVisible, setResponseDialogVisible] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleHelpful = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('rating_helpful')
        .insert({
          rating_id: rating.id,
          user_id: currentUserId,
        });

      if (error) throw error;
      onUpdate?.();
    } catch (err) {
      console.error('Error marking rating as helpful:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('rating_reports')
        .insert({
          rating_id: rating.id,
          user_id: currentUserId,
          reason: reportReason,
        });

      if (error) throw error;
      setReportDialogVisible(false);
      onUpdate?.();
    } catch (err) {
      console.error('Error reporting rating:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('rating_responses')
        .insert({
          rating_id: rating.id,
          response_text: responseText,
        });

      if (error) throw error;
      setResponseDialogVisible(false);
      onUpdate?.();
    } catch (err) {
      console.error('Error adding response:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (count: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialCommunityIcons
            key={star}
            name={star <= count ? 'star' : 'star-outline'}
            size={20}
            color={star <= count ? colors.warning : colors.textLight}
          />
        ))}
      </View>
    );
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Avatar.Image
              size={40}
              source={
                rating.user.avatar_url
                  ? { uri: rating.user.avatar_url }
                  : require('@/assets/images/default-avatar.png')
              }
            />
            <View style={styles.nameContainer}>
              <Text variant="titleMedium">{rating.user.name}</Text>
              <Text variant="bodySmall" style={styles.date}>
                {formatDate(rating.created_at)}
              </Text>
            </View>
          </View>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            {currentUserId && currentUserId !== rating.user_id && (
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  setReportDialogVisible(true);
                }}
                title="Report"
              />
            )}
            {isShopOwner && !rating.response && (
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  setResponseDialogVisible(true);
                }}
                title="Respond"
              />
            )}
          </Menu>
        </View>

        {renderStars(rating.rating)}

        {rating.is_verified_purchase && (
          <View style={styles.verifiedBadge}>
            <MaterialCommunityIcons
              name="check-circle"
              size={16}
              color={colors.success}
            />
            <Text style={styles.verifiedText}>Verified Purchase</Text>
          </View>
        )}

        {rating.review_text && (
          <Text style={styles.reviewText}>{rating.review_text}</Text>
        )}

        {rating.images.length > 0 && (
          <View style={styles.imagesContainer}>
            {rating.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.reviewImage}
              />
            ))}
          </View>
        )}

        <View style={styles.actions}>
          <Button
            mode="outlined"
            icon="thumb-up"
            onPress={handleHelpful}
            loading={loading}
            disabled={loading || !currentUserId}
          >
            Helpful ({rating.helpful_count})
          </Button>
        </View>

        {rating.response && (
          <Card style={styles.responseCard}>
            <Card.Content>
              <Text variant="titleSmall">Shop Response:</Text>
              <Text style={styles.responseText}>{rating.response.response_text}</Text>
              <Text variant="bodySmall" style={styles.responseDate}>
                {formatDate(rating.response.created_at)}
              </Text>
            </Card.Content>
          </Card>
        )}
      </Card.Content>

      <Portal>
        <Dialog
          visible={reportDialogVisible}
          onDismiss={() => setReportDialogVisible(false)}
        >
          <Dialog.Title>Report Review</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Reason"
              value={reportReason}
              onChangeText={setReportReason}
              multiline
              numberOfLines={3}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setReportDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleReport}
              loading={loading}
              disabled={!reportReason.trim() || loading}
            >
              Submit
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={responseDialogVisible}
          onDismiss={() => setResponseDialogVisible(false)}
        >
          <Dialog.Title>Respond to Review</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Response"
              value={responseText}
              onChangeText={setResponseText}
              multiline
              numberOfLines={4}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setResponseDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleResponse}
              loading={loading}
              disabled={!responseText.trim() || loading}
            >
              Submit
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameContainer: {
    marginLeft: 12,
  },
  date: {
    color: colors.textLight,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  verifiedText: {
    color: colors.success,
    marginLeft: 4,
    fontSize: 12,
  },
  reviewText: {
    marginVertical: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
    gap: 8,
  },
  reviewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  responseCard: {
    marginTop: 16,
    backgroundColor: colors.surface,
  },
  responseText: {
    marginVertical: 8,
    fontStyle: 'italic',
  },
  responseDate: {
    color: colors.textLight,
  },
}); 
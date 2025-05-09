import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Avatar, List, Divider, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

type Conversation = {
  id: string;
  last_message_at: string;
  shop: {
    id: string;
    name: string;
    logo_url?: string;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count: number;
};

type ConversationListProps = {
  userId: string;
  onSelectConversation: (conversationId: string) => void;
};

export default function ConversationList({
  userId,
  onSelectConversation,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversations();
  }, [userId]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          last_message_at,
          shop:shops(
            id,
            name,
            logo_url
          ),
          last_message:messages(
            content,
            created_at,
            sender_id
          ),
          unread_count:messages(count)
        `)
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Transform the data to match our Conversation type
        const transformedData: Conversation[] = data.map(conv => ({
          id: conv.id,
          last_message_at: conv.last_message_at,
          shop: {
            id: conv.shop[0].id,
            name: conv.shop[0].name,
            logo_url: conv.shop[0].logo_url,
          },
          last_message: conv.last_message[0] ? {
            content: conv.last_message[0].content,
            created_at: conv.last_message[0].created_at,
            sender_id: conv.last_message[0].sender_id,
          } : undefined,
          unread_count: conv.unread_count[0].count,
        }));
        setConversations(transformedData);
      }
    } catch (err) {
      setError('Failed to fetch conversations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const truncateMessage = (message: string) => {
    if (message.length > 50) {
      return message.substring(0, 50) + '...';
    }
    return message;
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
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
    <FlatList
      data={conversations}
      keyExtractor={item => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      renderItem={({ item }) => (
        <Card
          style={styles.conversationCard}
          onPress={() => onSelectConversation(item.id)}
        >
          <Card.Content style={styles.conversationContent}>
            <Avatar.Image
              size={50}
              source={
                item.shop.logo_url
                  ? { uri: item.shop.logo_url }
                  : require('@/assets/images/default-shop.png')
              }
            />
            <View style={styles.conversationInfo}>
              <View style={styles.conversationHeader}>
                <Text variant="titleMedium">{item.shop.name}</Text>
                <Text variant="bodySmall" style={styles.timestamp}>
                  {formatDate(item.last_message_at)}
                </Text>
              </View>
              {item.last_message && (
                <View style={styles.messagePreview}>
                  <Text
                    variant="bodyMedium"
                    numberOfLines={1}
                    style={styles.messageText}
                  >
                    {truncateMessage(item.last_message.content)}
                  </Text>
                  {item.unread_count > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>
                        {item.unread_count}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      )}
      ItemSeparatorComponent={() => <Divider />}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="chat-outline"
            size={48}
            color={colors.textLight}
          />
          <Text style={styles.emptyText}>No conversations yet</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: colors.error,
    textAlign: 'center',
  },
  conversationCard: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timestamp: {
    color: colors.textLight,
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageText: {
    flex: 1,
    color: colors.textLight,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
}); 
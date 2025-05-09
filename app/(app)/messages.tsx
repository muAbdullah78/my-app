import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Text,
  Card,
  TextInput,
  IconButton,
  ActivityIndicator,
  Avatar,
  Divider,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/auth';

type Message = {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  order_id: string | null;
  attachments: string[];
  is_read: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  sender: {
    full_name: string;
    avatar_url?: string;
  };
  receiver: {
    full_name: string;
    avatar_url?: string;
  };
  order?: {
    id: string;
    status: string;
  };
};

type Conversation = {
  id: string;
  other_user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  last_message: Message;
  unread_count: number;
};

export default function Messages() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchConversations();
    // Subscribe to new messages
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user?.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          handleNewMessage(newMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user?.id}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          updateMessageStatus(updatedMessage);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          receiver_id,
          order_id,
          attachments,
          is_read,
          status,
          sender:user_profiles!messages_sender_id_fkey (
            full_name,
            avatar_url
          ),
          receiver:user_profiles!messages_receiver_id_fkey (
            full_name,
            avatar_url
          ),
          order:orders (
            id,
            status
          )
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages into conversations
      const conversationMap = new Map<string, Conversation>();
      data.forEach((message) => {
        const otherUserId =
          message.sender_id === user.id
            ? message.receiver_id
            : message.sender_id;
        const otherUser =
          message.sender_id === user.id
            ? message.receiver
            : message.sender;

        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            id: otherUserId,
            other_user: {
              id: otherUserId,
              full_name: otherUser.full_name,
              avatar_url: otherUser.avatar_url,
            },
            last_message: message,
            unread_count: 0,
          });
        }

        const conversation = conversationMap.get(otherUserId)!;
        if (!message.is_read && message.receiver_id === user.id) {
          conversation.unread_count++;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (err) {
      setError('Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles!messages_sender_id_fkey (
            full_name,
            avatar_url
          ),
          receiver:user_profiles!messages_receiver_id_fkey (
            full_name,
            avatar_url
          ),
          order:orders (
            id,
            status
          )
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Mark messages as read
      const unreadMessages = data.filter(
        (message) => !message.is_read && message.receiver_id === user.id
      );
      if (unreadMessages.length > 0) {
        const { error: updateError } = await supabase
          .from('messages')
          .update({ is_read: true })
          .in(
            'id',
            unreadMessages.map((m) => m.id)
          );

        if (updateError) throw updateError;
      }

      setMessages(data);
    } catch (err) {
      setError('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message: Message) => {
    if (selectedConversation?.id === message.sender_id) {
      setMessages((prev) => [...prev, message]);
      flatListRef.current?.scrollToEnd();
    }
    fetchConversations(); // Refresh conversation list
  };

  const updateMessageStatus = (message: Message) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, status: message.status } : m))
    );
  };

  const handleTyping = () => {
    if (!selectedConversation) return;

    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Notify other user that we're typing
    supabase
      .channel('typing')
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user?.id, conversationId: selectedConversation.id },
      });

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const sendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return;

    try {
      setSending(true);
      const tempId = Date.now().toString();
      const tempMessage = {
        id: tempId,
        content: newMessage.trim(),
        sender_id: user.id,
        receiver_id: selectedConversation.id,
        status: 'sending' as const,
        created_at: new Date().toISOString(),
        is_read: false,
      };

      // Optimistically add message to UI
      setMessages((prev) => [...prev, tempMessage as Message]);

      const { data, error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: selectedConversation.id,
        content: newMessage.trim(),
      }).select().single();

      if (error) throw error;

      // Update message with server data
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...data, status: 'sent' } : m))
      );

      setNewMessage('');
      fetchMessages(selectedConversation.id);
    } catch (err) {
      setError('Failed to send message');
      // Remove failed message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === user?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwnMessage && (
          <Avatar.Text
            size={32}
            label={item.sender.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')}
            style={styles.avatar}
          />
        )}
        <Card
          style={[
            styles.messageCard,
            isOwnMessage ? styles.ownMessageCard : styles.otherMessageCard,
          ]}
        >
          <Card.Content>
            {!isOwnMessage && (
              <Text variant="labelSmall" style={styles.senderName}>
                {item.sender.full_name}
              </Text>
            )}
            <Text variant="bodyMedium">{item.content}</Text>
            {item.order && (
              <View style={styles.orderReference}>
                <MaterialCommunityIcons name="clipboard-text" size={16} />
                <Text variant="bodySmall">
                  Order #{item.order.id} - {item.order.status}
                </Text>
              </View>
            )}
            <View style={styles.messageFooter}>
              <Text variant="labelSmall" style={styles.timestamp}>
                {new Date(item.created_at).toLocaleTimeString()}
              </Text>
              {isOwnMessage && (
                <MaterialCommunityIcons
                  name={
                    item.status === 'read'
                      ? 'check-all'
                      : item.status === 'delivered'
                      ? 'check-all'
                      : item.status === 'sent'
                      ? 'check'
                      : 'clock-outline'
                  }
                  size={16}
                  color={item.status === 'read' ? '#4CAF50' : '#666'}
                  style={styles.statusIcon}
                />
              )}
            </View>
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <Card
      style={styles.conversationCard}
      onPress={() => {
        setSelectedConversation(item);
        fetchMessages(item.id);
      }}
    >
      <Card.Content style={styles.conversationContent}>
        <Avatar.Text
          size={48}
          label={item.other_user.full_name
            .split(' ')
            .map((n) => n[0])
            .join('')}
        />
        <View style={styles.conversationInfo}>
          <Text variant="titleMedium">{item.other_user.full_name}</Text>
          <Text
            variant="bodySmall"
            numberOfLines={1}
            style={styles.lastMessage}
          >
            {item.last_message.content}
          </Text>
        </View>
        <View style={styles.conversationMeta}>
          <Text variant="labelSmall" style={styles.timestamp}>
            {new Date(item.last_message.created_at).toLocaleTimeString()}
          </Text>
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unread_count}</Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  if (loading && !selectedConversation) {
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
      {selectedConversation ? (
        <>
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              onPress={() => setSelectedConversation(null)}
            />
            <Text variant="titleLarge">{selectedConversation.other_user.full_name}</Text>
          </View>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            ListFooterComponent={
              isTyping ? (
                <View style={styles.typingIndicator}>
                  <Text variant="bodySmall" style={styles.typingText}>
                    {selectedConversation.other_user.full_name} is typing...
                  </Text>
                </View>
              ) : null
            }
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.inputContainer}
          >
            <TextInput
              value={newMessage}
              onChangeText={(text) => {
                setNewMessage(text);
                handleTyping();
              }}
              placeholder="Type a message..."
              multiline
              style={styles.input}
              right={
                <TextInput.Icon
                  icon="send"
                  disabled={!newMessage.trim() || sending}
                  onPress={sendMessage}
                />
              }
            />
          </KeyboardAvoidingView>
        </>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.conversationsList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No conversations yet</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 4,
  },
  conversationsList: {
    padding: 16,
  },
  conversationCard: {
    marginBottom: 8,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 16,
  },
  lastMessage: {
    color: '#666',
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  timestamp: {
    color: '#666',
    marginTop: 4,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginRight: 8,
  },
  messageCard: {
    maxWidth: '80%',
  },
  ownMessageCard: {
    backgroundColor: '#007AFF',
  },
  otherMessageCard: {
    backgroundColor: '#fff',
  },
  senderName: {
    color: '#666',
    marginBottom: 4,
  },
  orderReference: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    backgroundColor: '#f5f5f5',
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#666',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  statusIcon: {
    marginLeft: 4,
  },
  typingIndicator: {
    padding: 8,
    marginLeft: 16,
  },
  typingText: {
    color: '#666',
    fontStyle: 'italic',
  },
}); 
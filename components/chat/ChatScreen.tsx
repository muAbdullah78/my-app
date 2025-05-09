import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import {
  Text,
  TextInput,
  IconButton,
  Avatar,
  ActivityIndicator,
  Portal,
  Dialog,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  status: 'sent' | 'delivered' | 'read';
  attachments?: {
    id: string;
    file_url: string;
    file_type: string;
    file_name: string;
  }[];
};

type ChatScreenProps = {
  conversationId: string;
  userId: string;
  shopName: string;
  shopLogoUrl?: string;
};

export default function ChatScreen({
  conversationId,
  userId,
  shopName,
  shopLogoUrl,
}: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();
    subscribeToNewMessages();
  }, [conversationId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          attachments:message_attachments(
            id,
            file_url,
            file_type,
            file_name
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        setMessages(data);
      }
    } catch (err) {
      setError('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNewMessages = () => {
    const subscription = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
          flatListRef.current?.scrollToEnd();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !uploading) return;

    try {
      setSending(true);
      setError('');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: newMessage.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setNewMessage('');
      flatListRef.current?.scrollToEnd();
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (err) {
      setError('Failed to pick image');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);
      setError('');

      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = uri.split('/').pop() || 'image.jpg';
      const fileExt = filename.split('.').pop();
      const filePath = `${conversationId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(filePath);

      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: '',
        })
        .select()
        .single();

      if (messageError) throw messageError;

      const { error: attachmentError } = await supabase
        .from('message_attachments')
        .insert({
          message_id: message.id,
          file_url: publicUrl,
          file_type: 'image',
          file_name: filename,
          file_size: blob.size,
        });

      if (attachmentError) throw attachmentError;

      flatListRef.current?.scrollToEnd();
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const renderMessage = ({ item: message }: { item: Message }) => {
    const isOwnMessage = message.sender_id === userId;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwnMessage && (
          <Avatar.Image
            size={32}
            source={
              shopLogoUrl
                ? { uri: shopLogoUrl }
                : require('@/assets/images/default-shop.png')
            }
            style={styles.avatar}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          {message.attachments?.map((attachment) => (
            <Image
              key={attachment.id}
              source={{ uri: attachment.file_url }}
              style={styles.attachmentImage}
              resizeMode="cover"
            />
          ))}
          {message.content && (
            <Text
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              ]}
            >
              {message.content}
            </Text>
          )}
          <Text style={styles.timestamp}>
            {new Date(message.created_at).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <View style={styles.inputContainer}>
        <IconButton
          icon="image"
          size={24}
          onPress={() => setShowImagePicker(true)}
          disabled={uploading}
        />
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
          maxLength={1000}
          disabled={sending || uploading}
        />
        <IconButton
          icon="send"
          size={24}
          onPress={handleSendMessage}
          disabled={(!newMessage.trim() && !uploading) || sending || uploading}
        />
      </View>

      <Portal>
        <Dialog visible={showImagePicker} onDismiss={() => setShowImagePicker(false)}>
          <Dialog.Title>Send Image</Dialog.Title>
          <Dialog.Content>
            <Text>Choose an image to send</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <IconButton
              icon="camera"
              size={24}
              onPress={() => {
                setShowImagePicker(false);
                // TODO: Implement camera capture
              }}
            />
            <IconButton
              icon="image"
              size={24}
              onPress={() => {
                setShowImagePicker(false);
                handleImagePick();
              }}
            />
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  avatar: {
    marginRight: 8,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '100%',
  },
  ownBubble: {
    backgroundColor: colors.primary,
  },
  otherBubble: {
    backgroundColor: colors.surface,
  },
  messageText: {
    fontSize: 16,
  },
  ownMessageText: {
    color: colors.white,
  },
  otherMessageText: {
    color: colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    maxHeight: 100,
  },
  attachmentImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
}); 
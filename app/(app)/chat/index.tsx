import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Appbar } from 'react-native-paper';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import ConversationList from '@/components/chat/ConversationList';
import ChatScreenComponent from '@/components/chat/ChatScreen';

type Conversation = {
  id: string;
  shop: {
    id: string;
    name: string;
    logo_url?: string;
  };
};

export default function ChatScreen() {
  const [userId, setUserId] = useState<string>();
  const [selectedConversation, setSelectedConversation] = useState<Conversation>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    } catch (err) {
      console.error('Error getting current user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          shop:shops(
            id,
            name,
            logo_url
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      if (data) {
        // Transform the data to match our Conversation type
        const conversation: Conversation = {
          id: data.id,
          shop: {
            id: data.shop[0].id,
            name: data.shop[0].name,
            logo_url: data.shop[0].logo_url,
          },
        };
        setSelectedConversation(conversation);
      }
    } catch (err) {
      console.error('Error fetching conversation details:', err);
    }
  };

  const handleBack = () => {
    setSelectedConversation(undefined);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={styles.container}>
        <Text>Please sign in to access chat</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content
          title={selectedConversation ? selectedConversation.shop.name : 'Messages'}
        />
        {selectedConversation && (
          <Appbar.BackAction onPress={handleBack} />
        )}
      </Appbar.Header>

      {selectedConversation ? (
        <ChatScreenComponent
          conversationId={selectedConversation.id}
          userId={userId}
          shopName={selectedConversation.shop.name}
          shopLogoUrl={selectedConversation.shop.logo_url}
        />
      ) : (
        <ConversationList
          userId={userId}
          onSelectConversation={handleSelectConversation}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
}); 
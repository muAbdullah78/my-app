import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import EmptyState from '@/components/ui/EmptyState';
import SearchBar from '@/components/ui/SearchBar';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';

type Chat = {
  id: string;
  user_id: string;
  shop_id: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  shop: {
    name: string;
    avatar_url: string;
  };
};

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error: chatsError } = await supabase
        .from('chats')
        .select(`
          *,
          shop:shops(name, avatar_url)
        `)
        .eq('user_id', user?.id)
        .order('last_message_time', { ascending: false });

      if (chatsError) throw chatsError;

      setChats(data || []);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch chats');
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.shop.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navigateToChat = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            text="Try Again"
            onPress={fetchChats}
            style={styles.retryButton}
          />
        </View>
      );
    }

    if (filteredChats.length === 0) {
      return (
        <EmptyState
          title="No conversations"
          description={searchQuery ? "No matches found" : "You don't have any messages yet"}
          icon="message-square"
        />
      );
    }

    return (
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.chatItem} 
            onPress={() => navigateToChat(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.chatAvatar}>
              <Image 
                source={{ uri: item.shop.avatar_url }} 
                style={styles.avatarImage}
                defaultSource={require('@/assets/images/default-avatar.png')}
              />
              {item.unread_count > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>
                    {item.unread_count > 9 ? '9+' : item.unread_count}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName}>{item.shop.name}</Text>
                <Text style={styles.chatTime}>{item.last_message_time}</Text>
              </View>
              <Text 
                style={[
                  styles.lastMessage, 
                  item.unread_count > 0 && styles.unreadMessage
                ]}
                numberOfLines={1}
              >
                {item.last_message}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.chatsList}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        {searchVisible ? (
          <SearchBar
            placeholder="Search conversations..."
            onSearch={setSearchQuery}
            value={searchQuery}
            onClose={() => {
              setSearchVisible(false);
              setSearchQuery('');
            }}
            autoFocus
          />
        ) : (
          <View style={styles.titleRow}>
            <Text style={styles.title}>Messages</Text>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => setSearchVisible(true)}
            >
              <Search size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: colors.text,
  },
  searchButton: {
    padding: 8,
  },
  chatsList: {
    padding: 8,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  chatAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.light,
  },
  unreadBadge: {
    position: 'absolute',
    right: -4,
    top: -4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  unreadCount: {
    color: colors.white,
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  chatTime: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.textLight,
  },
  lastMessage: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.textLight,
  },
  unreadMessage: {
    fontFamily: 'Poppins-Medium',
    color: colors.text,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: colors.text,
    marginTop: 12,
  },
  errorText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    minWidth: 120,
  },
});
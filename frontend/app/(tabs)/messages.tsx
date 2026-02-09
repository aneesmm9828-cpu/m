import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function MessagesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      activeOpacity={0.7}
      onPress={() => router.push(`/messages/chat?userId=${item.user?.user_id}`)}
    >
      <Image
        source={{ uri: item.user?.picture || 'https://via.placeholder.com/100' }}
        style={styles.userImage}
      />
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName}>{item.user?.name}</Text>
          <Text style={styles.messageTime}>2h ago</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.last_message?.text || 'Sent an image'}
        </Text>
      </View>
      {item.unread_count > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{item.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={() => router.push('/messages/ai-assistant')}>
          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            style={styles.aiButton}
          >
            <Ionicons name="sparkles" size={24} color={Colors.background} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* AI Assistant Card */}
      <TouchableOpacity 
        style={styles.aiCard}
        onPress={() => router.push('/messages/ai-assistant')}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
          style={styles.aiCardGradient}
        >
          <View style={styles.aiCardContent}>
            <View style={styles.aiIconContainer}>
              <Ionicons name="sparkles" size={32} color={Colors.background} />
            </View>
            <View style={styles.aiCardText}>
              <Text style={styles.aiCardTitle}>AI Assistant</Text>
              <Text style={styles.aiCardSubtitle}>
                Generate photos, videos, reels & get editing tips
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.background} />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.user?.user_id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start a conversation</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  aiButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  aiCardGradient: {
    padding: 16,
  },
  aiCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiCardText: {
    flex: 1,
  },
  aiCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.background,
    marginBottom: 4,
  },
  aiCardSubtitle: {
    fontSize: 13,
    color: Colors.background,
    opacity: 0.9,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  messageTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.background,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stories, setStories] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [conversationsRes, storiesRes] = await Promise.all([
        api.get('/messages/conversations'),
        api.get('/stories'),
      ]);
      setConversations(conversationsRes.data);
      setStories(storiesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const renderStory = ({ item }) => (
    <TouchableOpacity style={styles.storyItem}>
      <LinearGradient
        colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
        style={styles.storyGradient}
      >
        <View style={styles.storyInner}>
          <Image
            source={{ uri: item.user?.picture || 'https://via.placeholder.com/100' }}
            style={styles.storyImage}
          />
        </View>
      </LinearGradient>
      <Text style={styles.storyName} numberOfLines={1}>
        {item.user?.username || item.user?.name}
      </Text>
    </TouchableOpacity>
  );

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
        <View style={styles.lastMessageContainer}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message?.text || 'Sent an image'}
          </Text>
          {item.last_message?.image && (
            <Ionicons name="camera" size={16} color={Colors.textSecondary} style={styles.messageIcon} />
          )}
        </View>
      </View>
      {item.unread_count > 0 && (
        <View style={styles.unreadBadge}>
          <View style={styles.unreadDot} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/marb-logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>MARB</Text>
        </View>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={28} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Stories Section */}
      <View style={styles.storiesSection}>
        <Text style={styles.sectionTitle}>Stories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesScroll}>
          <FlatList
            horizontal
            data={stories}
            renderItem={renderStory}
            keyExtractor={(item, index) => index.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesList}
          />
        </ScrollView>
      </View>

      {/* AI Assistant Card */}
      <TouchableOpacity 
        style={styles.aiCard}
        onPress={() => router.push('/messages/ai-assistant')}
        activeOpacity={0.7}
      >
        <View style={styles.aiAvatar}>
          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            style={styles.aiAvatarGradient}
          >
            <Ionicons name="sparkles" size={24} color={Colors.background} />
          </LinearGradient>
        </View>
        <View style={styles.aiCardText}>
          <Text style={styles.aiCardTitle}>AI</Text>
          <Text style={styles.aiCardSubtitle}>Ask Meta AI anything</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Messages List */}
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  searchButton: {
    padding: 4,
  },
  storiesSection: {
    paddingVertical: 12,
    borderBottomWidth: 8,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  storiesScroll: {
    paddingLeft: 16,
  },
  storiesList: {
    paddingRight: 16,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 12,
    width: 70,
  },
  storyGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 3,
    marginBottom: 4,
  },
  storyInner: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    borderWidth: 3,
    borderColor: Colors.background,
    overflow: 'hidden',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  storyName: {
    fontSize: 12,
    color: Colors.text,
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  aiAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginRight: 12,
  },
  aiAvatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiCardText: {
    flex: 1,
  },
  aiCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  aiCardSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  messageIcon: {
    marginLeft: 4,
  },
  unreadBadge: {
    marginLeft: 8,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
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

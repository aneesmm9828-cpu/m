import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../utils/supabaseConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    if (!user?.user_id || !supabase) return;
    setLoading(true);
    try {
      // Fetch latest messages for each contact
      const { data: contacts, error: contactError } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.user_id)
        .limit(30);

      if (contactError) throw contactError;

      // Get latest message for each contact to simulate conversation list
      const chatList = await Promise.all(contacts.map(async (profile) => {
        const { data: latestMsg } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.user_id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${user.user_id})`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          conversation_id: profile.id,
          user: {
            user_id: profile.id,
            name: profile.full_name,
            username: profile.username,
            picture: profile.avatar_url
          },
          last_message: latestMsg || { text: 'Start a conversation', created_at: profile.updated_at },
          unread_count: 0
        };
      }));

      // Sort by latest message
      chatList.sort((a, b) => new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime());
      setConversations(chatList);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      activeOpacity={0.7}
      onPress={() => router.push('/messages/chat?userId=' + item.user?.user_id)}
    >
      <Image
        source={{ uri: item.user?.picture || 'https://via.placeholder.com/100' }}
        style={styles.userImage}
      />
      <View style={styles.conversationInfo}>
        <Text style={styles.userName}>{item.user?.name}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>{item.last_message?.text}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user?.username || 'Messages'}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="videocam-outline" size={28} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={() => router.push('/messages/new-chat')}>
            <Ionicons name="create-outline" size={26} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.notesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.notesList}>
          <TouchableOpacity style={styles.noteItem}>
            <View style={styles.noteAvatarContainer}>
              <Image source={{ uri: user?.avatar_url || 'https://via.placeholder.com/100' }} style={styles.noteAvatar} />
              <View style={styles.addNoteBadge}><Ionicons name="add" size={14} color="#fff" /></View>
            </View>
            <Text style={styles.noteText}>Your note</Text>
          </TouchableOpacity>
          {/* Mock notes */}
          <TouchableOpacity style={styles.noteItem}>
            <View style={styles.noteAvatarContainer}>
              <View style={styles.noteBubble}><Text style={styles.bubbleText}>Watching Reels... 🍿</Text></View>
              <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.noteAvatar} />
            </View>
            <Text style={styles.noteText}>Rahul</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.requestsBar}>
        <Text style={styles.sectionTitle}>Messages</Text>
        <TouchableOpacity onPress={() => router.push('/messages/requests')}>
          <Text style={styles.requestsLink}>Requests</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.conversation_id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  headerRight: { flexDirection: 'row', gap: 18 },
  headerIcon: { padding: 2 },
  searchBarContainer: { paddingHorizontal: 16, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 12, height: 36, gap: 8 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 16 },
  notesContainer: { marginBottom: 16 },
  notesList: { paddingHorizontal: 16, gap: 16 },
  noteItem: { alignItems: 'center', width: 75 },
  noteAvatarContainer: { position: 'relative', marginBottom: 6 },
  noteAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.surface },
  addNoteBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: Colors.primary, width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  noteText: { fontSize: 12, color: Colors.textSecondary },
  noteBubble: { position: 'absolute', top: -15, left: -10, backgroundColor: Colors.cardBackground, padding: 6, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, zIndex: 10, maxWidth: 80 },
  bubbleText: { fontSize: 10, color: Colors.text },
  requestsBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  requestsLink: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  conversationItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  userImage: { width: 56, height: 56, borderRadius: 28, marginRight: 12 },
  conversationInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '500', color: Colors.text },
  lastMessage: { fontSize: 14, color: Colors.textSecondary },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.text, marginTop: 16 },
});

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
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState([]);
  const [myNote, setMyNote] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [activeTab, setActiveTab] = useState('primary'); // 'primary' or 'general'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [conversationsRes, notesRes] = await Promise.all([
        api.get('/messages/conversations'),
        api.get('/notes').catch(() => ({ data: [] })),
      ]);
      setConversations(conversationsRes.data || []);
      
      // Find my note and others' notes
      const allNotes = notesRes.data || [];
      const mine = allNotes.find(n => n.user_id === user?.user_id);
      setMyNote(mine || null);
      setNotes(allNotes.filter(n => n.user_id !== user?.user_id));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCreateNote = async () => {
    if (!noteText.trim()) {
      Alert.alert('Error', 'Please enter a note');
      return;
    }
    
    try {
      await api.post('/notes', { text: noteText.trim() });
      setShowNoteModal(false);
      setNoteText('');
      Alert.alert('Success', 'Note posted!');
      await loadData();
    } catch (error) {
      console.error('Error creating note:', error);
      Alert.alert('Error', 'Failed to post note');
    }
  };

  const handleDeleteNote = async () => {
    try {
      await api.delete('/notes/me');
      setMyNote(null);
      Alert.alert('Deleted', 'Note removed');
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const getUserPicture = () => {
    if (user?.picture) {
      if (user.picture.startsWith('http')) return user.picture;
      return 'data:image/jpeg;base64,' + user.picture;
    }
    return 'https://via.placeholder.com/100';
  };

  const getConversationUserPic = (item) => {
    if (item.user?.picture) {
      if (item.user.picture.startsWith('http')) return item.user.picture;
      return 'data:image/jpeg;base64,' + item.user.picture;
    }
    return 'https://via.placeholder.com/100';
  };

  const getNoteUserPic = (note) => {
    if (note.user?.picture) {
      if (note.user.picture.startsWith('http')) return note.user.picture;
      return 'data:image/jpeg;base64,' + note.user.picture;
    }
    return 'https://via.placeholder.com/100';
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHrs > 0) return diffHrs + 'h';
    if (diffMins > 0) return diffMins + 'm';
    return 'now';
  };

  const renderNote = ({ item, index }) => {
    // First item is always "Your Note"
    if (index === 0) {
      return (
        <TouchableOpacity 
          style={styles.noteItem} 
          onPress={() => myNote ? handleDeleteNote() : setShowNoteModal(true)}
          onLongPress={() => myNote && handleDeleteNote()}
        >
          <View style={styles.noteAvatarContainer}>
            <Image source={{ uri: getUserPicture() }} style={styles.noteAvatar} />
            {myNote ? (
              <View style={styles.noteBubble}>
                <Text style={styles.noteText} numberOfLines={2}>{myNote.text}</Text>
              </View>
            ) : (
              <View style={styles.addNoteBubble}>
                <Ionicons name="add" size={16} color={Colors.textSecondary} />
              </View>
            )}
          </View>
          <Text style={styles.noteName}>Your note</Text>
        </TouchableOpacity>
      );
    }
    
    // Other users' notes
    const note = notes[index - 1];
    if (!note) return null;
    
    return (
      <TouchableOpacity style={styles.noteItem}>
        <View style={styles.noteAvatarContainer}>
          <Image source={{ uri: getNoteUserPic(note) }} style={styles.noteAvatar} />
          <View style={styles.noteBubble}>
            <Text style={styles.noteText} numberOfLines={2}>{note.text}</Text>
          </View>
        </View>
        <Text style={styles.noteName} numberOfLines={1}>{note.user?.username || 'User'}</Text>
        <Text style={styles.noteTime}>{getTimeAgo(note.created_at)}</Text>
      </TouchableOpacity>
    );
  };

  const renderConversation = ({ item }) => {
    const isOnline = item.user?.is_online;
    const hasUnread = item.unread_count > 0;
    
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        activeOpacity={0.7}
        onPress={() => router.push('/messages/chat?userId=' + item.user?.user_id)}
      >
        <View style={styles.avatarContainer}>
          <Image source={{ uri: getConversationUserPic(item) }} style={styles.userImage} />
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.userName, hasUnread && styles.unreadName]}>{item.user?.name}</Text>
            <Text style={styles.messageTime}>{getTimeAgo(item.last_message?.created_at)}</Text>
          </View>
          <View style={styles.lastMessageContainer}>
            <Text style={[styles.lastMessage, hasUnread && styles.unreadMessage]} numberOfLines={1}>
              {item.last_message?.text || 'Sent an attachment'}
            </Text>
            {item.last_message?.image && (
              <Ionicons name="image" size={14} color={Colors.textSecondary} style={styles.messageIcon} />
            )}
          </View>
        </View>
        
        {hasUnread ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{item.unread_count}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.cameraIcon}>
            <Ionicons name="camera-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    return conv.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conv.user?.username?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user?.username || 'Messages'}</Text>
        <TouchableOpacity onPress={() => router.push('/messages/new')}>
          <Ionicons name="create-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Notes Section */}
      <View style={styles.notesSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'my-note' }, ...notes]}
          renderItem={renderNote}
          keyExtractor={(item, index) => item.note_id || index.toString()}
          contentContainerStyle={styles.notesList}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'primary' && styles.activeTab]}
          onPress={() => setActiveTab('primary')}
        >
          <Text style={[styles.tabText, activeTab === 'primary' && styles.activeTabText]}>Primary</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'general' && styles.activeTab]}
          onPress={() => setActiveTab('general')}
        >
          <Text style={[styles.tabText, activeTab === 'general' && styles.activeTabText]}>General</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.requestsTab}>
          <Text style={styles.requestsText}>Requests</Text>
        </TouchableOpacity>
      </View>

      {/* AI Assistant Card */}
      <TouchableOpacity 
        style={styles.aiCard}
        onPress={() => router.push('/messages/ai-assistant')}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#00d9ff', '#00ffcc']}
          style={styles.aiAvatar}
        >
          <Ionicons name="sparkles" size={22} color="#000" />
        </LinearGradient>
        <View style={styles.aiCardText}>
          <Text style={styles.aiCardTitle}>AI Assistant</Text>
          <Text style={styles.aiCardSubtitle}>Ask anything</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.conversation_id || item.user?.user_id}
        contentContainerStyle={styles.conversationsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start a conversation with someone</Text>
          </View>
        }
      />

      {/* Create Note Modal */}
      <Modal
        visible={showNoteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.noteModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New note</Text>
              <TouchableOpacity onPress={handleCreateNote}>
                <Text style={styles.shareText}>Share</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.noteInputContainer}>
              <Image source={{ uri: getUserPicture() }} style={styles.noteModalAvatar} />
              <View style={styles.noteInputBubble}>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Share a thought..."
                  placeholderTextColor={Colors.textSecondary}
                  value={noteText}
                  onChangeText={setNoteText}
                  maxLength={60}
                  multiline
                  autoFocus
                />
              </View>
            </View>
            
            <Text style={styles.noteHint}>Notes disappear after 24 hours</Text>
            <Text style={styles.charCount}>{noteText.length}/60</Text>
            
            <View style={styles.shareWithContainer}>
              <Text style={styles.shareWithTitle}>Share with</Text>
              <TouchableOpacity style={styles.shareOption}>
                <Text style={styles.shareOptionText}>Followers you follow back</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 36,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  notesSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  notesList: {
    paddingHorizontal: 16,
  },
  noteItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  noteAvatarContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  noteAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  noteBubble: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: [{ translateX: -40 }],
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 80,
  },
  noteText: {
    fontSize: 11,
    color: Colors.text,
    textAlign: 'center',
  },
  addNoteBubble: {
    position: 'absolute',
    top: -8,
    left: '50%',
    transform: [{ translateX: -14 }],
    backgroundColor: Colors.cardBackground,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteName: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 2,
  },
  noteTime: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
  },
  activeTab: {
    backgroundColor: Colors.text,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.background,
  },
  requestsTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  requestsText: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiCardText: {
    flex: 1,
  },
  aiCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  aiCardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  conversationsList: {
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  userImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4fffb0',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  userName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  unreadName: {
    fontWeight: '700',
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
  unreadMessage: {
    color: Colors.text,
    fontWeight: '500',
  },
  messageIcon: {
    marginLeft: 4,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.background,
  },
  cameraIcon: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  // Note Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteModal: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    width: SCREEN_WIDTH * 0.9,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cancelText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  shareText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  noteInputContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  noteModalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  noteInputBubble: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  noteInput: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    minHeight: 60,
  },
  noteHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginBottom: 16,
  },
  shareWithContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
  },
  shareWithTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shareOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
});

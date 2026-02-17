import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Viewer {
  user_id: string;
  name: string;
  username: string;
  picture: string | null;
}

export default function StoryViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user: currentUser } = useAuthStore();
  const [story, setStory] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [viewCount, setViewCount] = useState(0);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [showViewers, setShowViewers] = useState(false);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [isOwnStory, setIsOwnStory] = useState(false);
  const storyId = params.storyId as string;
  const userId = params.userId as string;

  useEffect(() => {
    loadStory();
  }, [storyId, userId]);

  const loadStory = async () => {
    try {
      // Get user stories
      const storiesRes = await api.get(`/stories/user/${userId}`);
      const userRes = await api.get(`/users/${userId}`);
      
      if (storiesRes.data && storiesRes.data.length > 0) {
        const storyData = storyId 
          ? storiesRes.data.find((s: any) => s.story_id === storyId) || storiesRes.data[0]
          : storiesRes.data[0];
        
        setStory(storyData);
        setUser(userRes.data);
        
        // Check if it's own story
        const isOwn = currentUser?.user_id === userId;
        setIsOwnStory(isOwn);
        
        // Record view if not own story
        if (!isOwn && storyData?.story_id) {
          try {
            await api.post(`/stories/${storyData.story_id}/view`);
          } catch (err) {
            console.log('View recording error:', err);
          }
        }
        
        // If own story, get view count
        if (isOwn && storyData?.story_id) {
          loadViewCount(storyData.story_id);
        }
      }
    } catch (error) {
      console.error('Error loading story:', error);
    }
  };

  const loadViewCount = async (sid: string) => {
    try {
      const res = await api.get(`/stories/${sid}/viewers`);
      setViewCount(res.data.view_count || 0);
      setViewers(res.data.viewers || []);
    } catch (error) {
      console.log('Error loading view count:', error);
    }
  };

  const openViewersList = async () => {
    setShowViewers(true);
    setLoadingViewers(true);
    
    try {
      const res = await api.get(`/stories/${story.story_id}/viewers`);
      setViewCount(res.data.view_count || 0);
      setViewers(res.data.viewers || []);
    } catch (error) {
      console.log('Error loading viewers:', error);
    } finally {
      setLoadingViewers(false);
    }
  };

  const renderViewer = ({ item }: { item: Viewer }) => (
    <View style={styles.viewerItem}>
      <Image
        source={{ uri: item.picture || 'https://via.placeholder.com/100' }}
        style={styles.viewerImage}
      />
      <View style={styles.viewerInfo}>
        <Text style={styles.viewerName}>{item.name}</Text>
        <Text style={styles.viewerUsername}>@{item.username}</Text>
      </View>
    </View>
  );

  if (!story) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Calculate time ago
  const getTimeAgo = () => {
    if (!story.created_at) return '';
    const created = new Date(story.created_at);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffHrs > 0) return `${diffHrs}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Story Image */}
      <Image
        source={{ uri: `data:image/jpeg;base64,${story.image}` }}
        style={styles.storyImage}
        resizeMode="contain"
      />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
        
        <View style={styles.userInfo}>
          <Image
            source={{ uri: user?.picture ? `data:image/jpeg;base64,${user.picture}` : 'https://via.placeholder.com/100' }}
            style={styles.userImage}
          />
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.storyTime}>{getTimeAgo()}</Text>
          
          <View style={styles.spacer} />
          
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        {isOwnStory ? (
          // Show Views button for own story
          <TouchableOpacity 
            style={styles.viewsButton}
            onPress={openViewersList}
          >
            <Ionicons name="eye-outline" size={24} color={Colors.text} />
            <Text style={styles.viewsText}>{viewCount} Views</Text>
          </TouchableOpacity>
        ) : (
          // Show reply option for others' stories
          <View style={styles.replyContainer}>
            <Ionicons name="happy-outline" size={28} color={Colors.text} />
            <Text style={styles.replyText}>Send message</Text>
          </View>
        )}
        <TouchableOpacity>
          <Ionicons name="paper-plane-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Viewers Modal */}
      <Modal
        visible={showViewers}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowViewers(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Viewers</Text>
              <TouchableOpacity onPress={() => setShowViewers(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.viewCountHeader}>
              <Ionicons name="eye-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.viewCountText}>{viewCount} views</Text>
            </View>
            
            {loadingViewers ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
            ) : viewers.length > 0 ? (
              <FlatList
                data={viewers}
                keyExtractor={(item) => item.user_id}
                renderItem={renderViewer}
                style={styles.viewersList}
              />
            ) : (
              <View style={styles.emptyViewers}>
                <Ionicons name="eye-off-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyText}>No views yet</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: Colors.text,
    borderRadius: 1.5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.text,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  storyTime: {
    fontSize: 13,
    color: Colors.text,
    opacity: 0.7,
  },
  spacer: {
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.text,
  },
  viewsText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  replyContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.text,
  },
  replyText: {
    fontSize: 15,
    color: Colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  viewCountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  viewCountText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  viewersList: {
    paddingHorizontal: 16,
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  viewerImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  viewerInfo: {
    flex: 1,
  },
  viewerName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  viewerUsername: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyViewers: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
});

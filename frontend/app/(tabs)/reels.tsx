import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Platform,
  useWindowDimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../utils/supabaseConfig';
import ReelPlayer from '../../components/ReelPlayer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * REELS SCREEN - FULL SCREEN VERTICAL EXPERIENCE
 */
export default function ReelsScreen() {
  const { width: CURRENT_WIDTH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate exact tab bar height to match _layout.tsx
  const tabBarHeight = Platform.OS === 'ios' ? 60 : 65;
  const bottomPadding = Platform.OS === 'android'
    ? Math.max(insets.bottom, 8) + 8
    : insets.bottom || 8;
  const totalBottomHeight = tabBarHeight + bottomPadding;

  const { user } = useAuthStore();
  const [reels, setReels] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Comments Modal State
  const [showComments, setShowComments] = useState(false);
  const [selectedReel, setSelectedReel] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);

  // The actual visible height for the video
  const VISIBLE_HEIGHT = containerHeight > 0 ? containerHeight - totalBottomHeight : 0;

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    setLoading(true);
    console.log('🔄 Fetching reels from Supabase...');

    try {
      // 1. Fetch reels first
      const { data: reelsData, error: reelsError } = await supabase
        .from('reels')
        .select('*')
        .order('created_at', { ascending: false });

      if (reelsError) throw reelsError;

      if (!reelsData || reelsData.length === 0) {
        console.log('ℹ️ No reels found.');
        setReels([]);
        return;
      }

      // 2. Fetch associated profiles manually to bypass join issues
      const userIds = [...new Set(reelsData.map(r => r.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      const profilesMap = (profilesData || []).reduce((acc: any, p: any) => {
        acc[p.id] = p;
        return acc;
      }, {});

      // 3. Format reels
      const formattedReels = reelsData.map(reel => {
        const profile = profilesMap[reel.user_id];
        return {
          ...reel,
          reel_id: reel.id,
          video: reel.video_url,
          likes_count: 0,
          is_liked: false,
          user: profile ? {
            user_id: profile.id,
            username: profile.username || 'user',
            picture: profile.avatar_url
          } : {
            user_id: reel.user_id,
            username: 'user',
            picture: 'https://via.placeholder.com/100'
          }
        };
      });

      console.log(`✅ Success: Found ${formattedReels.length} reels.`);
      setReels(formattedReels);
    } catch (error: any) {
      console.error('❌ Error loading reels:', error?.message || error);
      setReels([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReels();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const openComments = async (reel: any) => {
    setSelectedReel(reel);
    setShowComments(true);

    // Fetch comments for this reel
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*, profiles:user_id(username, avatar_url)')
          .eq('target_id', reel.id)
          .eq('target_type', 'reel')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setComments(data || []);
      } catch (err) {
        console.error('Error fetching comments:', err);
      }
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedReel || !user) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: user.user_id,
          target_id: selectedReel.id,
          target_type: 'reel',
          content: commentText.trim()
        })
        .select('*, profiles:user_id(username, avatar_url)')
        .single();

      if (error) throw error;

      setComments([data, ...comments]);
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const getUserPicture = () => {
    if (user && user.picture) {
      if (user.picture.startsWith('http')) return user.picture;
      return 'data:image/jpeg;base64,' + user.picture;
    }
    return 'https://via.placeholder.com/100';
  };

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const { height } = e.nativeEvent.layout;
        if (height > 0) setContainerHeight(height);
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {VISIBLE_HEIGHT > 0 && (
        <FlatList
          ref={flatListRef}
          data={reels}
          horizontal={false} // CHANGE TO VERTICAL
          renderItem={({ item, index }) => (
            <View style={{
              height: VISIBLE_HEIGHT,
              width: CURRENT_WIDTH,
              backgroundColor: '#000',
              overflow: 'hidden'
            }}>
              <ReelPlayer
                item={item}
                isActive={index === currentIndex}
                onCommentPress={() => openComments(item)}
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          pagingEnabled={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate="fast"
          getItemLayout={(data, index) => ({
            length: VISIBLE_HEIGHT,
            offset: VISIBLE_HEIGHT * index,
            index,
          })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 80,
            minimumViewTime: 200
          }}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews={true}
          style={{ height: VISIBLE_HEIGHT, flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { height: VISIBLE_HEIGHT, width: CURRENT_WIDTH }]}>
              {loading && !refreshing ? (
                <ActivityIndicator size="large" color={Colors.primary} />
              ) : (
                <>
                  <Ionicons name="play-circle-outline" size={80} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.emptyText}>No Reels Yet</Text>
                  <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                    <Text style={styles.refreshText}>Refresh</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          }
        />
      )}

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowComments(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.commentsModal}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={comments}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Image
                    source={{ uri: item.profiles?.avatar_url || 'https://via.placeholder.com/100' }}
                    style={styles.commentUserImage}
                  />
                  <View style={styles.commentContent}>
                    <Text style={styles.commentUsername}>{item.profiles?.username || 'User'}</Text>
                    <Text style={styles.commentText}>{item.content}</Text>
                    <Text style={styles.commentTime}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              )}
              keyExtractor={(item, index) => item.id || index.toString()}
              style={styles.commentsList}
              ListEmptyComponent={
                <View style={styles.noComments}>
                  <Text style={styles.noCommentsText}>No comments yet</Text>
                  <Text style={styles.noCommentsSubtext}>Be the first to comment</Text>
                </View>
              }
            />

            <View style={styles.addCommentContainer}>
              <Image source={{ uri: getUserPicture() }} style={styles.commentInputImage} />
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor={Colors.textSecondary}
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                onPress={handleAddComment}
                disabled={!commentText.trim()}
              >
                <Text style={[styles.postButton, !commentText.trim() && styles.postButtonDisabled]}>
                  Post
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  emptyContainer: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    opacity: 0.8
  },
  refreshBtn: {
    marginTop: 20,
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  refreshText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  // Comments Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  commentsModal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
  },
  commentUserImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  commentUsername: {
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  commentTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
    backgroundColor: Colors.cardBackground,
  },
  commentInputImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    maxHeight: 80,
  },
  postButton: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
});

import React, { useState, useEffect, useRef } from 'react';
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
  TextInput,
  Animated,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { Video, ResizeMode } from 'expo-av';
import { supabase } from '../../utils/supabaseConfig';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000;

export default function StoryViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user: currentUser } = useAuthStore();

  const [stories, setStories] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef<any>(null);

  const userId = params.userId as string;

  useEffect(() => {
    loadStories();
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
      setIsPaused(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      setIsPaused(false);
    });

    return () => {
      if (progressAnimation.current) progressAnimation.current.stop();
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [userId]);

  useEffect(() => {
    if (stories.length > 0 && !isPaused && !isKeyboardVisible) {
      startProgress();
    } else {
      if (progressAnimation.current) progressAnimation.current.stop();
    }
  }, [currentIndex, stories, isPaused, isKeyboardVisible]);

  const loadStories = async () => {
    if (!supabase) return;
    try {
      const now = new Date().toISOString();
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:user_id (id, username, full_name, avatar_url)
        `)
        .eq('user_id', userId)
        .gt('expires_at', now)
        .order('created_at', { ascending: true });

      if (storiesError) throw storiesError;

      if (!storiesData || storiesData.length === 0) {
        router.back();
        return;
      }

      setStories(storiesData);
      const profile = storiesData[0].profiles;
      setUser({
        username: profile.username,
        name: profile.full_name,
        picture: profile.avatar_url
      });

      if (currentUser?.user_id !== userId) {
        recordStoryView(storiesData[0].id);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
      router.back();
    }
  };

  const recordStoryView = async (storyId: string) => {
    if (!supabase || !currentUser) return;
    await supabase.from('story_views').upsert({
      story_id: storyId,
      viewer_id: currentUser.user_id
    });
  };

  const startProgress = () => {
    progressAnim.setValue(0);
    if (progressAnimation.current) progressAnimation.current.stop();

    progressAnimation.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });

    progressAnimation.current.start(({ finished }: { finished: boolean }) => {
      if (finished) goToNext();
    });
  };

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (currentUser?.user_id !== userId) recordStoryView(stories[nextIdx].id);
    } else {
      router.back();
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleTap = (locationX: number) => {
    if (isKeyboardVisible) {
        Keyboard.dismiss();
        return;
    }

    if (locationX < SCREEN_WIDTH * 0.3) {
      goToPrev();
    } else if (locationX > SCREEN_WIDTH * 0.7) {
      goToNext();
    }
  };

  const handleDelete = async () => {
    console.log('[DELETE_DEBUG] 🗑️ Delete button pressed');

    if (!supabase) {
      Alert.alert('Error', 'Supabase client missing');
      return;
    }

    // CRITICAL: Capture ID and data BEFORE any state changes or alerts
    const activeStory = stories[currentIndex];
    if (!activeStory) return;

    const targetStoryId = activeStory.id;
    const targetMediaUrl = activeStory.media_url;

    // Pause timer
    setIsPaused(true);

    const performDelete = async () => {
      try {
        console.log('[DELETE_DEBUG] 🚀 Executing delete for:', targetStoryId);

        const { data, error: dbError } = await supabase
          .from('stories')
          .delete()
          .eq('id', targetStoryId)
          .select();

        console.log('[DELETE_DEBUG] Raw DB Result:', { data, dbError });

        if (dbError) throw dbError;
        if (!data || data.length === 0) {
          throw new Error('Story not found in database or permission denied.');
        }

        // Cleanup Storage (Non-blocking)
        try {
          const fileName = targetMediaUrl.split('/').pop()?.split('?')[0];
          if (fileName) {
            console.log('[DELETE_DEBUG] 🧹 Storage cleanup:', fileName);
            await supabase.storage.from('media').remove([fileName]);
          }
        } catch (sErr) {
          console.warn('Storage cleanup failed:', sErr);
        }

        // UPDATE UI IMMEDIATELY
        setStories(prev => {
          const filtered = prev.filter(s => s.id !== targetStoryId);
          console.log('[DELETE_DEBUG] UI Updated. Remaining:', filtered.length);
          if (filtered.length === 0) {
            router.back();
          } else {
            // If we deleted the last item, move index back
            if (currentIndex >= filtered.length) {
              setCurrentIndex(filtered.length - 1);
            }
            setIsPaused(false);
          }
          return filtered;
        });

      } catch (err: any) {
        console.error('[DELETE_DEBUG] Fatal Error:', err.message);
        Alert.alert('Delete failed', err.message);
        setIsPaused(false);
      }
    };

    // Use a simpler confirmation dialog that doesn't nest logic too deeply
    Alert.alert(
      'Delete Story',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setIsPaused(false) },
        { text: 'Delete', style: 'destructive', onPress: performDelete }
      ],
      { cancelable: false }
    );
  };

  const fetchViewers = async () => {
    if (!supabase) return;
    setLoadingViewers(true);
    setShowViewers(true);
    setIsPaused(true);

    const { data } = await supabase
      .from('story_views')
      .select(`
        profiles:viewer_id (id, username, full_name, avatar_url)
      `)
      .eq('story_id', stories[currentIndex].id);

    if (data) setViewers(data.map((v: any) => v.profiles));
    setLoadingViewers(false);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !supabase) return;
    Alert.alert('Sent', 'Reply sent!');
    setReplyText('');
    Keyboard.dismiss();
  };

  if (stories.length === 0) return <View style={styles.centered}><ActivityIndicator color={Colors.primary} /></View>;

  const currentStory = stories[currentIndex];
  const isOwnStory = currentUser?.user_id === userId;

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Background Media */}
      <View style={styles.mediaContainer}>
        {currentStory.media_type === 'video' ? (
          <Video
            source={{ uri: currentStory.media_url }}
            style={styles.media}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={!isPaused && !isKeyboardVisible}
            onPlaybackStatusUpdate={(s: any) => s.didJustFinish && goToNext()}
          />
        ) : (
          <Image source={{ uri: currentStory.media_url }} style={styles.media} resizeMode="contain" />
        )}
      </View>

      {/* Navigation Layer */}
      <View style={styles.navLayer} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.navSide}
            activeOpacity={1}
            onPress={() => handleTap(10)}
            onLongPress={() => setIsPaused(true)}
            onPressOut={() => setIsPaused(false)}
          />
          <View style={{ flex: 1 }} pointerEvents="box-none" />
          <TouchableOpacity
            style={styles.navSide}
            activeOpacity={1}
            onPress={() => handleTap(SCREEN_WIDTH - 10)}
            onLongPress={() => setIsPaused(true)}
            onPressOut={() => setIsPaused(false)}
          />
      </View>

      {/* CRITICAL OVERLAY: Floating Top Buttons (Delete and Close) */}
      <View style={styles.topControlLayer} pointerEvents="box-none">
          <View style={styles.progressContainer}>
            {stories.map((_, index) => (
              <View key={index} style={styles.progressBarWrapper}>
                  <View style={styles.progressBarBg}>
                  {index < currentIndex ? (
                      <View style={[styles.progressBarFill, { width: '100%' }]} />
                  ) : index === currentIndex ? (
                      <Animated.View style={[styles.progressBarFill, {
                      width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                      }]} />
                  ) : null}
                  </View>
              </View>
            ))}
          </View>

          <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.userInfo}
                activeOpacity={0.7}
                onPress={() => {
                  setIsPaused(true);
                  router.push(`/profile/${userId}`);
                }}
              >
                  <Image source={{ uri: user?.picture || 'https://via.placeholder.com/100' }} style={styles.avatar} />
                  <View>
                      <Text style={styles.username}>{user?.username}</Text>
                      <Text style={styles.timeLabel}>Active</Text>
                  </View>
              </TouchableOpacity>

              <View style={styles.headerActions}>
                  {isOwnStory && (
                      <TouchableOpacity
                        onPress={handleDelete}
                        style={styles.primaryActionBtn}
                        hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
                      >
                          <Ionicons name="trash-outline" size={26} color="#fff" />
                      </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.primaryActionBtn}
                    hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}
                  >
                      <Ionicons name="close" size={32} color="#fff" />
                  </TouchableOpacity>
              </View>
          </View>
      </View>

      {/* Bottom Overlay */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.bottomOverlay}
        pointerEvents="box-none"
      >
        <View style={styles.bottomBar}>
          <View style={styles.replyRow}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.replyInput}
                placeholder="Send message"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={replyText}
                onChangeText={setReplyText}
                selectionColor={Colors.primary}
                cursorColor={Colors.primary}
              />
            </View>

            {replyText.length > 0 ? (
              <TouchableOpacity onPress={handleSendReply} style={styles.sendButton}>
                <Text style={styles.sendText}>Send</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.engagementIcons}>
                {isOwnStory && (
                  <TouchableOpacity style={styles.viewersBtn} onPress={fetchViewers}>
                    <Ionicons name="eye-outline" size={22} color="#fff" />
                    <Text style={styles.viewersText}>Activity</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setIsLiked(!isLiked)} style={styles.iconBtn}>
                  <Ionicons name={isLiked ? "heart" : "heart-outline"} size={30} color={isLiked ? "#ff3b5c" : "#fff"} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}>
                  <Ionicons name="paper-plane-outline" size={26} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Viewers Modal */}
      <Modal visible={showViewers} transparent animationType="slide" onRequestClose={() => setShowViewers(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Viewers</Text>
                <TouchableOpacity onPress={() => { setShowViewers(false); setIsPaused(false); }}>
                    <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
            </View>
            <FlatList
                data={viewers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.viewerItem}>
                        <Image source={{ uri: item.avatar_url || 'https://via.placeholder.com/100' }} style={styles.vAvatar} />
                        <Text style={styles.vName}>{item.username}</Text>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No views yet</Text>}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mediaContainer: { flex: 1 },
  media: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },

  navLayer: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 10 },
  navSide: { width: SCREEN_WIDTH * 0.25, height: '100%' },

  topControlLayer: { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 40, paddingBottom: 20, zIndex: 1000 },
  progressContainer: { flexDirection: 'row', gap: 4, paddingHorizontal: 10, marginBottom: 15 },
  progressBarWrapper: { flex: 1, height: 2 },
  progressBarBg: { flex: 1, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#fff' },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#fff' },
  username: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  timeLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  primaryActionBtn: { padding: 8, zIndex: 2000 },

  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000 },
  bottomBar: { paddingHorizontal: 16, paddingBottom: 30 },
  replyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inputWrapper: { flex: 1, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, justifyContent: 'center' },
  replyInput: { color: '#fff', fontSize: 15, height: 44, padding: 0 },
  engagementIcons: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  viewersBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewersText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  iconBtn: { padding: 4 },
  sendButton: { paddingHorizontal: 8 },
  sendText: { color: Colors.primary, fontWeight: 'bold', fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: SCREEN_HEIGHT * 0.6, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  viewerItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  vAvatar: { width: 44, height: 44, borderRadius: 22 },
  vName: { color: Colors.text, fontSize: 15, fontWeight: '500' },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 20 },
});

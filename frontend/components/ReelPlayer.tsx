import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  ActivityIndicator,
  Share,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../utils/supabaseConfig';
import { useRouter } from 'expo-router';
import { api } from '../utils/api';
import TipModal from './creator/TipModal';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface ReelPlayerProps {
  item: any;
  isActive: boolean;
  onCommentPress?: () => void;
}

const ReelPlayer: React.FC<ReelPlayerProps> = ({ item, isActive, onCommentPress }) => {
  const { user } = useAuthStore();
  const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
  // Use a fallback height if SCREEN_HEIGHT feels too large for the container
  const displayWidth = windowWidth;
  const displayHeight = windowHeight * 0.8; // Approximate safe area
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [liked, setLiked] = useState(item.is_liked || false);
  const [likesCount, setLikesCount] = useState(item.likes_count || 0);
  const [showHeart, setShowHeart] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isFollowing, setIsFollowing] = useState(user?.following?.includes(item.user_id) || false);
  const [isSaved, setIsSaved] = useState(false);

  const scrollAnim = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const pauseIconOpacity = useRef(new Animated.Value(0)).current;

  // Instagram-style video handling
  useEffect(() => {
    if (isActive) {
      setHasError(false);
      setIsReady(false); // Reset ready state when changing reels
      videoRef.current?.playAsync();
      setIsPaused(false);
    } else {
      videoRef.current?.pauseAsync();
      setIsReady(false);
    }
  }, [isActive]);

  const onVideoLoad = (status: AVPlaybackStatus) => {
    console.log('Video loaded status:', status);
    if (status.isLoaded) {
      setIsReady(true);
    }
  };

  // Sync follow state when user or item changes
  useEffect(() => {
    if (user && item.user_id) {
      setIsFollowing(user.following?.includes(item.user_id) || false);
    }
  }, [user, item.user_id]);

  // Check if reel is saved
  useEffect(() => {
    const checkSaved = async () => {
      if (!user || !item.id || !supabase) return;
      try {
        const { count, error } = await supabase
          .from('saved_collections')
          .select('*', { count: 'exact', head: true })
          .match({ user_id: user.user_id, reel_id: item.id });

        if (!error) setIsSaved((count || 0) > 0);
      } catch (err) {
        console.error('Check saved error:', err);
      }
    };
    checkSaved();
  }, [user, item.id]);

  const handleLike = async (isDoubleTap = false) => {
    if (!supabase || !user) return;

    if (isDoubleTap && liked) {
      animateOverlayHeart();
      return;
    }

    const newState = isDoubleTap ? true : !liked;
    if (newState === liked && !isDoubleTap) return;

    setLiked(newState);
    setLikesCount(prev => (newState ? prev + 1 : Math.max(0, prev - 1)));

    if (newState) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (isDoubleTap) animateOverlayHeart();
    }

    try {
      if (newState) {
        await supabase.from('likes').insert({
          user_id: user.user_id,
          target_type: 'reel',
          target_id: item.id,
        });
      } else {
        await supabase.from('likes').delete().match({
          user_id: user.user_id,
          target_id: item.id,
          target_type: 'reel',
        });
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const animateOverlayHeart = () => {
    setShowHeart(true);
    heartScale.setValue(0);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.5, friction: 3, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, friction: 3, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 0, duration: 200, delay: 300, useNativeDriver: true }),
    ]).start(() => setShowHeart(false));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this reel by ${item.user?.username || 'user'} on MARB!`,
        url: item.video,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleRemix = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/(tabs)/create?remixId=${item.id}&type=reel`);
  };

  const handleHype = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Hype!', 'You hyped this reel!');
  };

  const handleFollow = async () => {
    if (!user || !item.user_id) return;

    // Optimistic UI update
    const prevFollowing = isFollowing;
    setIsFollowing(!prevFollowing);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (prevFollowing) {
        await api.post(`/users/${item.user_id}/unfollow`);
      } else {
        await api.post(`/users/${item.user_id}/follow`);
      }
    } catch (err) {
      console.error('Follow error:', err);
      setIsFollowing(prevFollowing); // Revert on error
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleSave = async () => {
    if (!user || !item.id || !supabase) return;

    const newState = !isSaved;
    setIsSaved(newState);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (newState) {
        await supabase.from('saved_collections').insert({
          user_id: user.user_id,
          reel_id: item.id
        });
        Alert.alert('Saved', 'Reel added to your collection');
      } else {
        await supabase.from('saved_collections').delete().match({
          user_id: user.user_id,
          reel_id: item.id
        });
        Alert.alert('Removed', 'Reel removed from your collection');
      }
      setShowOptionsMenu(false);
    } catch (err) {
      console.error('Save error:', err);
      setIsSaved(!newState);
      Alert.alert('Error', 'Failed to save reel');
    }
  };

  const handleBlockUser = async () => {
    Alert.alert('Block User', `Are you sure you want to block ${item.user?.username || 'this user'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('blocks').insert({
              blocker_id: user?.user_id,
              blocked_id: item.user_id,
            });
            Alert.alert('Success', 'User blocked');
            setShowOptionsMenu(false);
          } catch (err) {
            console.error('Block error:', err);
          }
        },
      },
    ]);
  };

  const handleDeleteReel = async () => {
    Alert.alert('Delete Reel', 'Are you sure you want to delete this reel?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('reels').delete().eq('id', item.id);
            if (error) throw error;
            Alert.alert('Success', 'Reel deleted');
            setShowOptionsMenu(false);
            // Ideally notify parent to refresh
          } catch (err) {
            console.error('Delete error:', err);
          }
        },
      },
    ]);
  };

  const handleReport = () => {
    Alert.alert('Report', 'Select a reason for reporting', [
      { text: 'Spam', onPress: () => Alert.alert('Reported', 'Thank you for your report.') },
      { text: 'Inappropriate Content', onPress: () => Alert.alert('Reported', 'Thank you for your report.') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleMoreOptions = () => {
    setShowOptionsMenu(true);
  };

  const renderOptionsMenu = () => (
    <Modal
      visible={showOptionsMenu}
      transparent
      animationType="fade"
      onRequestClose={() => setShowOptionsMenu(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowOptionsMenu(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.optionsSheet}>
              <View style={styles.sheetHandle} />

              {item.user_id === user?.user_id && (
                <TouchableOpacity style={styles.menuItem} onPress={handleDeleteReel}>
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  <Text style={[styles.menuItemText, { color: Colors.error }]}>Delete Reel</Text>
                </TouchableOpacity>
              )}

              {item.user_id !== user?.user_id && (
                <TouchableOpacity style={styles.menuItem} onPress={handleBlockUser}>
                  <Ionicons name="remove-circle-outline" size={20} color={Colors.error} />
                  <Text style={[styles.menuItemText, { color: Colors.error }]}>Block User</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.menuItem} onPress={handleSave}>
                <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={20} color={Colors.text} />
                <Text style={styles.menuItemText}>{isSaved ? 'Unsave Reel' : 'Save Reel'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={handleReport}>
                <Ionicons name="alert-circle-outline" size={20} color={Colors.error} />
                <Text style={[styles.menuItemText, { color: Colors.error }]}>Report</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => {
                Share.share({ message: `Check this out: ${item.video}` });
                setShowOptionsMenu(false);
              }}>
                <Ionicons name="share-social-outline" size={20} color={Colors.text} />
                <Text style={styles.menuItemText}>Share to...</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => setShowOptionsMenu(false)}>
                <Ionicons name="close-outline" size={20} color={Colors.text} />
                <Text style={styles.menuItemText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // Music text animation
  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.timing(scrollAnim, {
          toValue: -100,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      scrollAnim.setValue(0);
    }
  }, [isActive]);

  const togglePlayPause = () => {
    setIsPaused(!isPaused);

    // Feedback animation
    pauseIconOpacity.setValue(1);
    Animated.timing(pauseIconOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();

    if (videoRef.current) {
      if (isPaused) videoRef.current.playAsync();
      else videoRef.current.pauseAsync();
    }
  };

  const handleDoubleTap = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      handleLike(true);
    }
  };

  const getProgress = () => {
    if (status?.isLoaded && status.durationMillis) {
      return (status.positionMillis / status.durationMillis) * 100 + '%';
    }
    return '0%';
  };

  return (
    <View style={[styles.container, { width: windowWidth }]}>
      <View style={styles.touchArea}>
        <TouchableWithoutFeedback onPress={togglePlayPause}>
          <View style={styles.videoWrapper}>
            {/* 1. Video Component - Base Layer */}
            <Video
              ref={videoRef}
              source={{ uri: item.video }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN} // Use CONTAIN for diagnostic
              shouldPlay={isActive && !isPaused}
              isLooping
              onPlaybackStatusUpdate={setStatus}
              onLoad={onVideoLoad}
              onError={(e) => {
                console.error('Reel Video Error:', e);
                setHasError(true);
              }}
              progressUpdateIntervalMillis={500}
            />

            {/* 2. Thumbnail - Overlay until ready */}
            {(!isReady || hasError) && (
              <Image
                source={{ uri: item.thumbnail_url || 'https://via.placeholder.com/400x800?text=Video+Loading...' }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            )}

            {/* Play/Pause Overlay Icon */}
            <Animated.View style={[styles.pauseIconContainer, { opacity: pauseIconOpacity }]}>
              <Ionicons name={isPaused ? "play" : "pause"} size={60} color="rgba(255,255,255,0.7)" />
            </Animated.View>

            {/* Big Heart Overlay */}
            {showHeart && (
              <Animated.View style={[styles.heartOverlay, { transform: [{ scale: heartScale }] }]}>
                <Ionicons name="heart" size={100} color="#fff" />
              </Animated.View>
            )}

            {/* Loading Indicator */}
            {isActive && !isReady && !hasError && (
              <View style={styles.loader}>
                <ActivityIndicator color={Colors.primary} size="large" />
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </View>

      {/* Side Actions */}
      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(false)}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={34}
            color={liked ? Colors.like : '#fff'}
          />
          <Text style={styles.actionText}>{likesCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onCommentPress}>
          <Ionicons name="chatbubble-outline" size={30} color="#fff" />
          <Text style={styles.actionText}>{item.comments_count || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="paper-plane" size={30} color="#fff" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleRemix}>
          <MaterialCommunityIcons name="repeat-variant" size={32} color="#fff" />
          <Text style={styles.actionText}>Remix</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.tipButton]} onPress={() => setShowTipModal(true)}>
          <MaterialCommunityIcons name="star-four-points" size={24} color="#fff" />
          <Text style={styles.actionText}>Tip</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleHype}>
          <MaterialCommunityIcons name="chart-timeline-variant-shimmer" size={30} color="#00bcd4" />
          <Text style={styles.actionText}>Hype</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleMoreOptions}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tip Modal */}
      <TipModal
        visible={showTipModal}
        onClose={() => setShowTipModal(false)}
        username={item.user?.username || 'User'}
        avatar={item.user?.picture || 'https://via.placeholder.com/100'}
      />

      {renderOptionsMenu()}

      {/* Bottom Information */}
      <View style={styles.bottomInfo}>
        <View style={styles.userContainer}>
          <TouchableOpacity
            onPress={() => item.user_id && router.push(`/profile/${item.user_id}`)}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <Image
              source={{ uri: item.user?.picture || 'https://via.placeholder.com/100' }}
              style={styles.avatar}
            />
            <Text style={styles.username}>{item.user?.username || 'user'}</Text>
          </TouchableOpacity>

          {item.user_id !== user?.user_id && (
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={handleFollow}
            >
              <Text style={[styles.followText, isFollowing && styles.followingText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.caption} numberOfLines={2}>
          {item.caption || 'No caption provided #reels #marb'}
        </Text>

        <View style={styles.musicContainer}>
          <Ionicons name="musical-note" size={14} color="#fff" />
          <View style={styles.musicTextWrapper}>
            <Animated.Text style={[styles.musicText, { transform: [{ translateX: scrollAnim }] }]}>
              {item.music_name || `Original audio - @${item.user?.username || 'user'}`}
            </Animated.Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: getProgress() }]} />
      </View>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={styles.bottomGradient}
      />
    </View>
  );
};

// Helper for single/double tap coexistence
const TouchableWrapper = ({ children, onPress }: { children: any, onPress: () => void }) => (
  <TouchableOpacity activeOpacity={1} onPress={onPress}>
    {children}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  touchArea: { flex: 1 },
  videoWrapper: { flex: 1, backgroundColor: '#000', position: 'relative' },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000'
  },
  thumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5
  },
  heartOverlay: { position: 'absolute', zIndex: 10, shadowColor: '#000', shadowRadius: 10, shadowOpacity: 0.5 },
  pauseIconContainer: { position: 'absolute', zIndex: 5 },
  loader: { position: 'absolute', zIndex: 2 },
  rightActions: { position: 'absolute', right: 8, bottom: 50, alignItems: 'center', gap: 20, zIndex: 20 },
  actionButton: { alignItems: 'center' },
  tipButton: {
    backgroundColor: '#2196F3', // Blue color for Tip button
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  actionText: { fontSize: 11, color: '#fff', marginTop: 2, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 2 },
  bottomInfo: { position: 'absolute', bottom: 60, left: 16, right: 80, zIndex: 20 },
  userContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10, borderWidth: 1, borderColor: '#fff' },
  username: { color: '#fff', fontSize: 15, fontWeight: '700', marginRight: 12 },
  followButton: { backgroundColor: Colors.primary, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 4 },
  followingButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#fff' },
  followText: { color: Colors.background, fontSize: 13, fontWeight: '700' },
  followingText: { color: '#fff' },
  caption: { color: '#fff', fontSize: 14, lineHeight: 18, marginBottom: 12 },
  musicContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  musicTextWrapper: { width: 150, overflow: 'hidden' },
  musicText: { color: '#fff', fontSize: 13, width: 300 },
  progressBarContainer: { position: 'absolute', bottom: 45, left: 16, right: 16, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', zIndex: 30, borderRadius: 1 },
  progressBar: { height: '100%', backgroundColor: '#fff', borderRadius: 1 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, zIndex: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  optionsSheet: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  menuItemText: {
    color: Colors.text,
    fontSize: 16,
  },
});

export default ReelPlayer;

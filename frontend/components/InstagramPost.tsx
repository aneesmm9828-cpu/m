import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Share,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { supabase } from '../utils/supabaseConfig';
import { useAuthStore } from '../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import CarouselPost from './instagram-parity/CarouselPost';
import { formatDistanceToNow } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import TipModal from './creator/TipModal';

import { Video, ResizeMode } from 'expo-av';

const { width } = Dimensions.get('window');

interface InstagramPostProps {
  item: any;
  onCommentPress?: () => void;
  shouldPlay?: boolean;
}

const TruthBadge = () => (
  <View style={styles.truthBadge}>
    <Ionicons name="checkmark-circle" size={12} color="#000" />
    <Text style={styles.truthText}>Truth</Text>
  </View>
);

const InstagramPost: React.FC<InstagramPostProps> = ({ item, onCommentPress, shouldPlay = false }) => {
  const { user } = useAuthStore();
  const router = useRouter();
  const [localLiked, setLocalLiked] = useState(item.is_liked);
  const [likesCount, setLikesCount] = useState(item.likes_count || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [remixesCount, setRemixesCount] = useState(item.remixes_count || 0);
  const [tipsTotal, setTipsTotal] = useState(item.tips_total || 0);
  const [isPausedManual, setIsPausedManual] = useState(false);
  const [isMutedGlobal, setIsMutedGlobal] = useState(true);
  const [isFollowingLocal, setIsFollowingLocal] = useState(false);

  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (shouldPlay && !isPausedManual) {
        console.log('[Video] Playing:', item.post_id);
        videoRef.current.playAsync();
      } else {
        console.log('[Video] Pausing:', item.post_id);
        videoRef.current.pauseAsync();
      }
    }
  }, [shouldPlay, isPausedManual]);

  const heartScale = useRef(new Animated.Value(0)).current;
  const overlayHeartScale = useRef(new Animated.Value(0)).current;
  const overlayHeartOpacity = useRef(new Animated.Value(0)).current;
  const saveScale = useRef(new Animated.Value(1)).current;
  const remixScale = useRef(new Animated.Value(1)).current;

  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  useEffect(() => {
    setLocalLiked(item.is_liked);
    setLikesCount(item.likes_count || 0);
    setRemixesCount(item.remixes_count || 0);
    setTipsTotal(item.tips_total || 0);
  }, [item.is_liked, item.likes_count, item.remixes_count, item.tips_total]);

  const handleLike = async (isDoubleTap = false) => {
    if (!supabase || !user) return;

    // If double tap and already liked, just show animation
    if (isDoubleTap && localLiked) {
        animateOverlayHeart();
        return;
    }

    const newState = isDoubleTap ? true : !localLiked;
    if (newState === localLiked && !isDoubleTap) return;

    setLocalLiked(newState);
    setLikesCount(prev => newState ? prev + 1 : Math.max(0, prev - 1));

    if (newState) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      animateHeartIcon();
      if (isDoubleTap) animateOverlayHeart();
    }

    try {
      if (newState) {
        await supabase.from('likes').insert({
          user_id: user.user_id,
          target_type: 'post',
          target_id: item.id
        });
      } else {
        await supabase.from('likes').delete().match({
          user_id: user.user_id,
          target_id: item.id
        });
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const animateHeartIcon = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.2, friction: 3, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
  };

  const animateOverlayHeart = () => {
    overlayHeartScale.setValue(0);
    overlayHeartOpacity.setValue(1);
    Animated.sequence([
      Animated.spring(overlayHeartScale, { toValue: 1, friction: 3, useNativeDriver: true }),
      Animated.timing(overlayHeartOpacity, { toValue: 0, duration: 400, delay: 200, useNativeDriver: true }),
    ]).start();
  };

  const onDoubleTap = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      handleLike(true);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this post by ${item.user?.username} on MARB!`,
        url: item.media_url,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleSave = async () => {
    const newState = !isSaved;
    setIsSaved(newState);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.sequence([
      Animated.spring(saveScale, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(saveScale, { toValue: 1, useNativeDriver: true }),
    ]).start();

    try {
      if (newState) {
        await supabase.from('saved_collections').insert({
           user_id: user?.user_id,
           post_id: item.id
        });
      } else {
        await supabase.from('saved_collections').delete().match({
          user_id: user?.user_id,
          post_id: item.id
        });
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleRemix = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.spring(remixScale, { toValue: 1.2, useNativeDriver: true }),
      Animated.spring(remixScale, { toValue: 1, useNativeDriver: true }),
    ]).start();

    Alert.alert('Remix', 'Start remixing this post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remix', onPress: () => router.push(`/(tabs)/create?remixId=${item.id}`) }
    ]);
  };

  const handleAddYours = () => {
    router.push(`/(tabs)/create?addYoursId=${item.id}`);
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true }).toUpperCase();
    } catch (e) {
      return 'RECENTLY';
    }
  };

  const handlePinPost = async () => {
    const newState = !item.is_pinned;
    try {
      await supabase.from('posts').update({ is_pinned: newState }).eq('id', item.id);
      Alert.alert('Success', newState ? 'Post pinned to profile' : 'Post unpinned');
      setShowOptionsMenu(false);
    } catch (err) {
      console.error('Pin error:', err);
    }
  };

  const handleDeletePost = async () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('posts').delete().eq('id', item.id);
              if (error) throw error;
              Alert.alert('Success', 'Post deleted successfully');
              setShowOptionsMenu(false);
              // Ideally, refresh the feed or notify the parent to remove the item
            } catch (err) {
              console.error('Delete error:', err);
              Alert.alert('Error', 'Failed to delete post');
            }
          }
        }
      ]
    );
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
                <>
                  <TouchableOpacity style={styles.menuItem} onPress={handlePinPost}>
                    <Ionicons name="pin-outline" size={20} color={Colors.text} />
                    <Text style={styles.menuItemText}>{item.is_pinned ? 'Unpin from profile' : 'Pin to profile'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={handleDeletePost}>
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                    <Text style={[styles.menuItemText, { color: Colors.error }]}>Delete Post</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity style={styles.menuItem} onPress={() => setShowOptionsMenu(false)}>
                <Ionicons name="share-social-outline" size={20} color={Colors.text} />
                <Text style={styles.menuItemText}>Share to...</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => setShowOptionsMenu(false)}>
                <Ionicons name="link-outline" size={20} color={Colors.text} />
                <Text style={styles.menuItemText}>Copy link</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={() => setShowOptionsMenu(false)}>
                <Ionicons name="alert-circle-outline" size={20} color={Colors.error} />
                <Text style={[styles.menuItemText, { color: Colors.error }]}>Report</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const togglePlayPause = () => {
    setIsPausedManual(!isPausedManual);
  };

  const toggleMute = () => {
    setIsMutedGlobal(!isMutedGlobal);
  };

  const handleFollowLocal = async () => {
    if (!item.user?.user_id || !user) return;

    const newState = !isFollowingLocal;
    setIsFollowingLocal(newState);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (newState) {
        await api.post(`/users/${item.user.user_id}/follow`);
      } else {
        await api.post(`/users/${item.user.user_id}/unfollow`);
      }
    } catch (err) {
      console.error('Follow error:', err);
      setIsFollowingLocal(!newState);
    }
  };

  const renderMedia = () => {
    return (
      <TapGestureHandler onHandlerStateChange={onDoubleTap} numberOfTaps={2}>
        <TouchableWithoutFeedback onPress={togglePlayPause}>
          <View style={styles.mediaContainer}>
            {item.type === 'reel' || item.is_video ? (
              <View style={styles.videoWrapper}>
                  <Video
                      ref={videoRef}
                      source={{ uri: item.media_url }}
                      style={styles.postImage}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={false} // Managed via useEffect now
                      isLooping
                      isMuted={isMutedGlobal}
                      volume={1.0}
                      useNativeControls={false}
                      posterSource={{ uri: item.thumbnail_url || item.media_url }}
                      usePoster={true}
                      posterStyle={{ width: '100%', height: '100%' }}
                      onLoad={() => {
                        if (shouldPlay && !isPausedManual) {
                          videoRef.current?.playAsync();
                        }
                      }}
                  />
                  {(isPausedManual || !shouldPlay) && (
                      <View style={styles.videoOverlay}>
                          <Ionicons name="play" size={40} color="rgba(255,255,255,0.6)" />
                      </View>
                  )}
                  <TouchableOpacity style={styles.muteButton} onPress={toggleMute}>
                      <Ionicons name={isMutedGlobal ? "volume-mute" : "volume-high"} size={18} color="white" />
                  </TouchableOpacity>
              </View>
            ) : item.is_carousel ? (
              <CarouselPost media={item.carousel_media} />
            ) : (
              <Image
                source={{ uri: item.media_url }}
                style={styles.postImage}
                resizeMode="cover"
              />
            )}

            <Animated.View style={[
              styles.overlayHeart,
              {
                transform: [{ scale: overlayHeartScale }],
                opacity: overlayHeartOpacity
              }
            ]}>
              <Ionicons name="heart" size={100} color="white" />
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </TapGestureHandler>
    );
  };

  const renderCaption = () => {
    if (!item.caption) return null;

    const parts = item.caption.split(/(\s#\w+)/g);

    return (
      <View style={styles.captionContainer}>
        <Text style={styles.caption} numberOfLines={showFullCaption ? undefined : 2}>
          <Text style={styles.captionUsername}>{item.user?.username || 'User'} </Text>
          {parts.map((part: string, i: number) => {
            if (part && part.startsWith(' #')) {
              return (
                <Text key={i} style={styles.hashtag} onPress={() => router.push(`/tag/${part.trim().substring(1)}`)}>
                  {part}
                </Text>
              );
            }
            return <Text key={i}>{part}</Text>;
          })}
        </Text>
        {item.caption.length > 60 && !showFullCaption && (
          <TouchableOpacity onPress={() => setShowFullCaption(true)}>
            <Text style={styles.moreText}>more</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.postCard}>
      {/* Header */}
      <View style={styles.postHeader}>
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: item.user?.picture || 'https://via.placeholder.com/100' }}
            style={styles.postUserImage}
          />
          <View style={styles.postUserInfo}>
            <View style={styles.usernameRow}>
              <Text style={styles.postUserName}>{item.user?.username || 'User'}</Text>
              {item.is_verified && <TruthBadge />}

              {item.user_id !== user?.user_id && (
                  <TouchableOpacity onPress={handleFollowLocal} style={styles.followActionBtn}>
                      <LinearGradient
                          colors={isFollowingLocal ? ['#333', '#444'] : ['#00d9ff', '#4fffb0']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.followBadgeGradient}
                      >
                          <Text style={[styles.followBadgeText, isFollowingLocal && { color: '#888' }]}>
                              {isFollowingLocal ? 'Following' : 'Follow'}
                          </Text>
                      </LinearGradient>
                  </TouchableOpacity>
              )}
            </View>
            {item.location && <Text style={styles.postLocation}>{item.location}</Text>}
          </View>
        </View>
        <TouchableOpacity style={styles.optionsButton} onPress={() => setShowOptionsMenu(true)}>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Media */}
      {renderMedia()}
      {renderOptionsMenu()}

      {/* Actions */}
      <View style={styles.postActions}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsScroll}>
          <TouchableOpacity onPress={() => handleLike(false)} style={styles.actionItem}>
            <Animated.View style={{ transform: [{ scale: localLiked ? heartScale : 1 }] }}>
              <Ionicons
                name={localLiked ? "heart" : "heart-outline"}
                size={28}
                color={localLiked ? Colors.like : Colors.text}
              />
            </Animated.View>
            <Text style={styles.actionLabel}>Like</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={onCommentPress}>
            <Ionicons name="chatbubble-outline" size={26} color={Colors.text} />
            <Text style={styles.actionLabel}>Comment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
            <Ionicons name="paper-plane-outline" size={26} color={Colors.text} />
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={handleRemix}>
            <Animated.View style={{ transform: [{ scale: remixScale }] }}>
              <MaterialCommunityIcons name="swap-horizontal-variant" size={26} color={Colors.primary} />
            </Animated.View>
            <Text style={styles.actionLabel}>Remix</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => Alert.alert('AI Feature', 'AI functions coming soon!')}>
            <Ionicons name="star" size={26} color="#4CAF50" />
            <Text style={styles.actionLabel}>AI</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.actionItem} onPress={() => setShowTipModal(true)}>
            <MaterialCommunityIcons name="currency-inr" size={26} color="#4CAF50" />
            <Text style={styles.actionLabel}>Tip</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSave} style={styles.actionItem}>
            <Animated.View style={{ transform: [{ scale: saveScale }] }}>
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={26}
                color={isSaved ? Colors.primary : Colors.text}
              />
            </Animated.View>
            <Text style={styles.actionLabel}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TipModal
        visible={showTipModal}
        onClose={() => setShowTipModal(false)}
        username={item.user?.username || 'User'}
        avatar={item.user?.picture || 'https://via.placeholder.com/100'}
      />

      {/* Info/Stats */}
      <View style={styles.postInfo}>
        <View style={styles.statsSummary}>
           {remixesCount > 0 && (
             <TouchableOpacity style={styles.remixStats}>
                <MaterialCommunityIcons name="sparkles" size={14} color={Colors.primary} />
                <Text style={styles.remixStatsText}>{remixesCount} Remixes</Text>
             </TouchableOpacity>
           )}

           <TouchableOpacity onPress={() => {}} style={styles.likesStats}>
              <Text style={styles.likesText}>
                {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
              </Text>
           </TouchableOpacity>
        </View>

        {tipsTotal > 0 && (
          <View style={styles.tipsReceived}>
             <Text style={styles.tipsText}>💰 ₹{tipsTotal.toLocaleString()} received in tips</Text>
          </View>
        )}

        {renderCaption()}

        {item.comments_count > 0 ? (
          <TouchableOpacity onPress={onCommentPress} style={styles.viewCommentsButton}>
            <Text style={styles.viewCommentsText}>
              View all {item.comments_count} comments
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onCommentPress} style={styles.viewCommentsButton}>
            <Text style={styles.viewCommentsText}>Be the first to comment</Text>
          </TouchableOpacity>
        )}

        <View style={styles.metadataRow}>
           <Text style={styles.timestamp}>{formatTime(item.created_at)}</Text>
           {item.location && <Text style={styles.metadataDivider}>•</Text>}
           {item.location && <Text style={styles.locationText}>{item.location}</Text>}
           <Text style={styles.metadataDivider}>•</Text>
           <View style={styles.viewsCount}>
              <Ionicons name="eye-outline" size={12} color={Colors.textTertiary} />
              <Text style={styles.viewsText}>{item.views_count || 0}</Text>
           </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  postCard: {
    marginBottom: 12,
    backgroundColor: Colors.cardBackground,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postUserImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  postUserInfo: {
    justifyContent: 'center',
  },
  postUserName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  postLocation: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followActionBtn: {
    marginLeft: 4,
  },
  followBadgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  followBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  truthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  truthText: {
    color: '#000',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  optionsButton: {
    padding: 4,
  },
  mediaContainer: {
    width: width,
    height: width,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postImage: {
    width: width,
    height: width,
  },
  videoWrapper: {
    width: width,
    height: width,
    position: 'relative',
    backgroundColor: '#000',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  muteButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
    zIndex: 20,
  },
  overlayHeart: {
    position: 'absolute',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  postActions: {
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionsScroll: {
    paddingLeft: 14,
    gap: 20,
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingRight: 14,
  },
  actionItem: {
    alignItems: 'center',
    gap: 4,
  },
  actionLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  statsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 8,
  },
  remixStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  remixStatsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  tipsReceived: {
    backgroundColor: '#4CAF5015',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  tipsText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  hashtag: {
    color: Colors.primary,
    fontWeight: '600',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  metadataDivider: {
    color: Colors.textTertiary,
    fontSize: 12,
  },
  locationText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  viewsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
  reelBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    padding: 4,
  },
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
  postInfo: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  captionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 18,
  },
  captionUsername: {
    fontWeight: '700',
  },
  moreText: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginLeft: 4,
  },
  viewCommentsButton: {
    marginTop: 4,
  },
  viewCommentsText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timestamp: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 6,
    letterSpacing: 0.5,
  },
});

export default InstagramPost;

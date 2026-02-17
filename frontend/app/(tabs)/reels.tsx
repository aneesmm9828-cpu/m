import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  StatusBar,
  Modal,
  TextInput,
  Animated,
  Share,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ReelsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [followingIds, setFollowingIds] = useState([]);
  const [savedReels, setSavedReels] = useState([]);
  const [activeTab, setActiveTab] = useState('reels'); // 'reels' or 'friends'
  const flatListRef = useRef(null);

  // Comments Modal
  const [showComments, setShowComments] = useState(false);
  const [selectedReel, setSelectedReel] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  // Share Modal
  const [showShare, setShowShare] = useState(false);
  
  // Options Modal
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    loadReels();
    if (user) {
      setFollowingIds(user.following || []);
      setSavedReels(user.saved_reels || []);
    }
  }, [user]);

  const loadReels = async () => {
    try {
      const response = await api.get('/reels');
      setReels(response.data || []);
    } catch (error) {
      console.error('Error loading reels:', error);
    }
  };

  const handleLike = async (reelId, isLiked) => {
    try {
      if (isLiked) {
        await api.post('/reels/' + reelId + '/unlike');
      } else {
        await api.post('/reels/' + reelId + '/like');
      }
      setReels(reels.map(reel => {
        if (reel.reel_id === reelId) {
          const likes = isLiked
            ? reel.likes.filter(id => id !== user?.user_id)
            : [...reel.likes, user?.user_id];
          return { ...reel, likes };
        }
        return reel;
      }));
    } catch (error) {
      console.error('Error liking reel:', error);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const isFollowing = followingIds.includes(userId);
      if (isFollowing) {
        await api.post('/users/' + userId + '/unfollow');
        setFollowingIds(followingIds.filter(id => id !== userId));
      } else {
        await api.post('/users/' + userId + '/follow');
        setFollowingIds([...followingIds, userId]);
      }
    } catch (error) {
      console.error('Error following:', error);
    }
  };

  const handleSaveReel = async (reelId) => {
    try {
      const isSaved = savedReels.includes(reelId);
      if (isSaved) {
        await api.post('/reels/' + reelId + '/unsave');
        setSavedReels(savedReels.filter(id => id !== reelId));
      } else {
        await api.post('/reels/' + reelId + '/save');
        setSavedReels([...savedReels, reelId]);
      }
    } catch (error) {
      console.error('Error saving reel:', error);
    }
  };

  const handleShareReel = async (reel) => {
    try {
      await Share.share({
        message: 'Check out this reel on MARB! ' + (reel.caption || ''),
        title: 'Share Reel',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
    setShowShare(false);
  };

  const openComments = (reel) => {
    setSelectedReel(reel);
    setComments(reel.comments || []);
    setShowComments(true);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedReel) return;
    
    try {
      await api.post('/reels/' + selectedReel.reel_id + '/comment', {
        text: commentText.trim()
      });
      
      const newComment = {
        comment_id: Date.now().toString(),
        user_id: user.user_id,
        user_name: user.name,
        username: user.username,
        user_picture: user.picture,
        text: commentText.trim(),
        created_at: new Date().toISOString(),
        likes: []
      };
      
      setComments([...comments, newComment]);
      setCommentText('');
      
      setReels(reels.map(r => {
        if (r.reel_id === selectedReel.reel_id) {
          return { ...r, comments: [...(r.comments || []), newComment] };
        }
        return r;
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleReport = () => {
    setShowOptions(false);
    Alert.alert('Report', 'This reel has been reported. Thank you for your feedback.');
  };

  const handleNotInterested = () => {
    setShowOptions(false);
    // Remove current reel from list
    const newReels = reels.filter((_, i) => i !== currentIndex);
    setReels(newReels);
    Alert.alert('Noted', "We'll show you less content like this.");
  };

  const getUserPicture = () => {
    if (user && user.picture) {
      if (user.picture.startsWith('http')) return user.picture;
      return 'data:image/jpeg;base64,' + user.picture;
    }
    return 'https://via.placeholder.com/100';
  };

  const ReelItem = ({ item, index }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [showHeart, setShowHeart] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showFullCaption, setShowFullCaption] = useState(false);
    const heartScale = useRef(new Animated.Value(0)).current;
    const lastTap = useRef(0);
    const videoRef = useRef(null);
    
    const isLiked = item.likes?.includes(user?.user_id);
    const isFollowing = followingIds.includes(item.user?.user_id);
    const isSaved = savedReels.includes(item.reel_id);
    const isActive = index === currentIndex;
    const isOwnReel = item.user?.user_id === user?.user_id;

    const getReelUserPic = () => {
      if (item.user?.picture) {
        if (item.user.picture.startsWith('http')) return item.user.picture;
        return 'data:image/jpeg;base64,' + item.user.picture;
      }
      return 'https://via.placeholder.com/100';
    };

    const handleDoubleTap = () => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      
      if (now - lastTap.current < DOUBLE_TAP_DELAY) {
        if (!isLiked) {
          handleLike(item.reel_id, false);
        }
        setShowHeart(true);
        heartScale.setValue(0);
        Animated.sequence([
          Animated.spring(heartScale, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.delay(500),
          Animated.timing(heartScale, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => setShowHeart(false));
      } else {
        // Single tap - toggle pause
        setIsPaused(!isPaused);
      }
      lastTap.current = now;
    };

    const toggleMute = () => {
      setIsMuted(!isMuted);
    };

    const renderCaption = () => {
      if (!item.caption) return null;
      
      const words = item.caption.split(' ');
      
      return (
        <TouchableOpacity onPress={() => setShowFullCaption(!showFullCaption)}>
          <Text style={styles.caption} numberOfLines={showFullCaption ? undefined : 2}>
            {words.map((word, idx) => {
              if (word.startsWith('#')) {
                return (
                  <Text key={idx} style={styles.hashtag}>
                    {word}{' '}
                  </Text>
                );
              } else if (word.startsWith('@')) {
                return (
                  <Text key={idx} style={styles.mention}>
                    {word}{' '}
                  </Text>
                );
              }
              return word + ' ';
            })}
          </Text>
          {!showFullCaption && item.caption.length > 80 && (
            <Text style={styles.moreText}>more</Text>
          )}
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.reelContainer}>
        <TouchableWithoutFeedback onPress={handleDoubleTap}>
          <View style={styles.videoContainer}>
            <Image
              source={{ uri: 'data:image/jpeg;base64,' + item.video }}
              style={styles.video}
              resizeMode="cover"
            />
            
            {/* Heart Animation */}
            {showHeart && (
              <Animated.View style={[styles.heartAnimation, { transform: [{ scale: heartScale }] }]}>
                <Ionicons name="heart" size={100} color="#ff3b5c" />
              </Animated.View>
            )}
            
            {/* Pause Icon */}
            {isPaused && (
              <View style={styles.pauseOverlay}>
                <Ionicons name="play" size={80} color="rgba(255,255,255,0.8)" />
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>

        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'reels' && styles.activeTabButton]}
            onPress={() => setActiveTab('reels')}
          >
            <Text style={[styles.tabText, activeTab === 'reels' && styles.activeTabText]}>Reels</Text>
          </TouchableOpacity>
          <View style={styles.tabDivider} />
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'friends' && styles.activeTabButton]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>Friends</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cameraButton} onPress={() => router.push('/reel/create')}>
            <Ionicons name="camera-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Mute Button */}
        <TouchableOpacity style={styles.muteButton} onPress={toggleMute}>
          <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={16} color="#fff" />
        </TouchableOpacity>

        {/* Right Side Actions */}
        <View style={styles.rightActions}>
          {/* Like */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLike(item.reel_id, isLiked)}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={30} 
              color={isLiked ? '#ff3b5c' : '#fff'} 
            />
            <Text style={styles.actionText}>{item.likes?.length || 0}</Text>
          </TouchableOpacity>

          {/* Comments */}
          <TouchableOpacity style={styles.actionButton} onPress={() => openComments(item)}>
            <Ionicons name="chatbubble-outline" size={28} color="#fff" />
            <Text style={styles.actionText}>{item.comments?.length || 0}</Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity style={styles.actionButton} onPress={() => {
            setSelectedReel(item);
            setShowShare(true);
          }}>
            <Ionicons name="paper-plane-outline" size={28} color="#fff" />
          </TouchableOpacity>

          {/* Save */}
          <TouchableOpacity style={styles.actionButton} onPress={() => handleSaveReel(item.reel_id)}>
            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={28} color="#fff" />
          </TouchableOpacity>

          {/* More Options */}
          <TouchableOpacity style={styles.actionButton} onPress={() => {
            setSelectedReel(item);
            setShowOptions(true);
          }}>
            <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
          </TouchableOpacity>

          {/* User Avatar with Music Animation */}
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => router.push('/profile?userId=' + item.user?.user_id)}
          >
            <View style={styles.musicDisc}>
              <Image source={{ uri: getReelUserPic() }} style={styles.userAvatar} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Info */}
        <View style={styles.bottomInfo}>
          <View style={styles.userInfo}>
            <TouchableOpacity 
              style={styles.usernameContainer}
              onPress={() => router.push('/profile?userId=' + item.user?.user_id)}
            >
              <Text style={styles.username}>@{item.user?.username || item.user?.name}</Text>
            </TouchableOpacity>
            {!isOwnReel && (
              <TouchableOpacity 
                style={[styles.followButton, isFollowing && styles.followingButton]}
                onPress={() => handleFollow(item.user?.user_id)}
              >
                <Text style={styles.followButtonText}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {renderCaption()}
          
          {/* Music/Audio Info */}
          <TouchableOpacity style={styles.musicInfo}>
            <View style={styles.musicIcon}>
              <Ionicons name="musical-notes" size={12} color="#fff" />
            </View>
            <Text style={styles.musicText} numberOfLines={1}>
              {item.audio_name || 'Original audio'} · {item.user?.username}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View style={styles.progressFill} />
          </View>
        </View>
      </View>
    );
  };

  const renderReel = ({ item, index }) => <ReelItem item={item} index={index} />;

  const renderComment = ({ item }) => (
    <View style={styles.commentItem}>
      <Image 
        source={{ uri: item.user_picture ? (item.user_picture.startsWith('http') ? item.user_picture : 'data:image/jpeg;base64,' + item.user_picture) : 'https://via.placeholder.com/100' }} 
        style={styles.commentUserImage} 
      />
      <View style={styles.commentContent}>
        <Text style={styles.commentText}>
          <Text style={styles.commentUsername}>{item.username || item.user_name} </Text>
          {item.text}
        </Text>
        <View style={styles.commentActions}>
          <Text style={styles.commentTime}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
          </Text>
          <TouchableOpacity>
            <Text style={styles.commentReply}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={styles.commentLike}>
        <Ionicons name="heart-outline" size={14} color={Colors.textSecondary} />
        <Text style={styles.commentLikeCount}>{item.likes?.length || 0}</Text>
      </TouchableOpacity>
    </View>
  );

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <FlatList
        ref={flatListRef}
        data={reels}
        renderItem={renderReel}
        keyExtractor={(item) => item.reel_id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="play-circle-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No reels yet</Text>
            <Text style={styles.emptySubtext}>Be the first to create a reel!</Text>
          </View>
        }
      />

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowComments(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.commentsModal}>
            <View style={styles.modalHandle} />
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item, index) => item.comment_id || index.toString()}
              style={styles.commentsList}
              ListEmptyComponent={
                <View style={styles.noComments}>
                  <Text style={styles.noCommentsText}>No comments yet</Text>
                  <Text style={styles.noCommentsSubtext}>Be the first to comment!</Text>
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
              />
              <TouchableOpacity onPress={handleAddComment} disabled={!commentText.trim()}>
                <Text style={[styles.postButton, !commentText.trim() && styles.postButtonDisabled]}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal
        visible={showShare}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowShare(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowShare(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.shareModal}>
              <View style={styles.modalHandle} />
              <Text style={styles.shareTitle}>Share</Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shareOptions}>
                <TouchableOpacity style={styles.shareOption} onPress={() => handleShareReel(selectedReel)}>
                  <View style={[styles.shareIcon, { backgroundColor: '#25D366' }]}>
                    <Ionicons name="logo-whatsapp" size={24} color="#fff" />
                  </View>
                  <Text style={styles.shareLabel}>WhatsApp</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.shareOption} onPress={() => handleShareReel(selectedReel)}>
                  <View style={[styles.shareIcon, { backgroundColor: '#1DA1F2' }]}>
                    <Ionicons name="logo-twitter" size={24} color="#fff" />
                  </View>
                  <Text style={styles.shareLabel}>Twitter</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.shareOption} onPress={() => handleShareReel(selectedReel)}>
                  <View style={[styles.shareIcon, { backgroundColor: '#4267B2' }]}>
                    <Ionicons name="logo-facebook" size={24} color="#fff" />
                  </View>
                  <Text style={styles.shareLabel}>Facebook</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.shareOption} onPress={() => handleShareReel(selectedReel)}>
                  <View style={[styles.shareIcon, { backgroundColor: Colors.primary }]}>
                    <Ionicons name="link" size={24} color="#fff" />
                  </View>
                  <Text style={styles.shareLabel}>Copy Link</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.shareOption} onPress={() => handleShareReel(selectedReel)}>
                  <View style={[styles.shareIcon, { backgroundColor: '#333' }]}>
                    <Ionicons name="share-outline" size={24} color="#fff" />
                  </View>
                  <Text style={styles.shareLabel}>More</Text>
                </TouchableOpacity>
              </ScrollView>
              
              <View style={styles.shareActions}>
                <TouchableOpacity style={styles.shareActionItem}>
                  <Ionicons name="paper-plane-outline" size={24} color={Colors.text} />
                  <Text style={styles.shareActionText}>Send to</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareActionItem}>
                  <Ionicons name="bookmark-outline" size={24} color={Colors.text} />
                  <Text style={styles.shareActionText}>Add to Story</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareActionItem}>
                  <Ionicons name="repeat-outline" size={24} color={Colors.text} />
                  <Text style={styles.shareActionText}>Remix</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Options Modal */}
      <Modal
        visible={showOptions}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowOptions(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.optionsModal}>
              <View style={styles.modalHandle} />
              
              <TouchableOpacity style={styles.optionItem} onPress={handleNotInterested}>
                <Ionicons name="eye-off-outline" size={24} color={Colors.text} />
                <Text style={styles.optionText}>Not Interested</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.optionItem} onPress={handleReport}>
                <Ionicons name="flag-outline" size={24} color={Colors.text} />
                <Text style={styles.optionText}>Report</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.optionItem}>
                <Ionicons name="information-circle-outline" size={24} color={Colors.text} />
                <Text style={styles.optionText}>Why you're seeing this</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.optionItem}>
                <Ionicons name="download-outline" size={24} color={Colors.text} />
                <Text style={styles.optionText}>Download</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.optionItem}>
                <Ionicons name="person-remove-outline" size={24} color={Colors.text} />
                <Text style={styles.optionText}>Unfollow @{selectedReel?.user?.username}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.optionItem, styles.cancelOption]} onPress={() => setShowOptions(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  reelContainer: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  heartAnimation: {
    position: 'absolute',
  },
  pauseOverlay: {
    position: 'absolute',
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activeTabButton: {},
  tabText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  activeTabText: {
    color: '#fff',
  },
  tabDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 12,
  },
  cameraButton: {
    position: 'absolute',
    right: 16,
  },
  muteButton: {
    position: 'absolute',
    bottom: 180,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActions: {
    position: 'absolute',
    right: 12,
    bottom: 200,
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
    fontWeight: '600',
  },
  avatarContainer: {
    marginTop: 8,
  },
  musicDisc: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#333',
    overflow: 'hidden',
  },
  userAvatar: {
    width: '100%',
    height: '100%',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 100,
    left: 12,
    right: 80,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  usernameContainer: {
    marginRight: 12,
  },
  username: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  followButton: {
    borderWidth: 1,
    borderColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 6,
  },
  followingButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'transparent',
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  caption: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
    lineHeight: 20,
  },
  hashtag: {
    color: '#fff',
    fontWeight: '700',
  },
  mention: {
    color: '#fff',
    fontWeight: '700',
  },
  moreText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  musicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  musicIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  musicText: {
    fontSize: 13,
    color: '#fff',
    flex: 1,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    height: 2,
  },
  progressBar: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressFill: {
    height: '100%',
    width: '30%',
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  commentsModal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: SCREEN_HEIGHT * 0.7,
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
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  commentTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  commentReply: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  commentLike: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentLikeCount: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
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
  },
  postButton: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  // Share Modal
  shareModal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    paddingVertical: 12,
  },
  shareOptions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  shareOption: {
    alignItems: 'center',
    marginRight: 20,
  },
  shareIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareLabel: {
    fontSize: 12,
    color: Colors.text,
  },
  shareActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
  },
  shareActionItem: {
    alignItems: 'center',
    gap: 6,
  },
  shareActionText: {
    fontSize: 12,
    color: Colors.text,
  },
  // Options Modal
  optionsModal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
  },
  cancelOption: {
    justifyContent: 'center',
    borderBottomWidth: 0,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});

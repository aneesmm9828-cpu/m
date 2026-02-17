import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  StatusBar,
  Modal,
  FlatList,
  ActivityIndicator,
  TextInput,
  Animated,
  Alert,
  PanResponder,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { Video } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

export default function StoryViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user: currentUser } = useAuthStore();
  
  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [viewCount, setViewCount] = useState(0);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [isOwnStory, setIsOwnStory] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(null);
  const likeScale = useRef(new Animated.Value(0)).current;
  
  const userId = params.userId;
  const initialStoryId = params.storyId;

  useEffect(() => {
    loadStories();
    return () => {
      if (progressAnimation.current) {
        progressAnimation.current.stop();
      }
    };
  }, [userId]);

  useEffect(() => {
    if (stories.length > 0 && !isPaused) {
      startProgress();
    }
  }, [currentIndex, stories, isPaused]);

  const loadStories = async () => {
    try {
      const [storiesRes, userRes] = await Promise.all([
        api.get('/stories/user/' + userId),
        api.get('/users/' + userId),
      ]);
      
      const storiesData = storiesRes.data || [];
      setStories(storiesData);
      setUser(userRes.data);
      
      const isOwn = currentUser?.user_id === userId;
      setIsOwnStory(isOwn);
      
      // Find initial story index
      if (initialStoryId && storiesData.length > 0) {
        const idx = storiesData.findIndex(s => s.story_id === initialStoryId);
        if (idx >= 0) setCurrentIndex(idx);
      }
      
      // Record view if not own story
      if (!isOwn && storiesData.length > 0) {
        recordView(storiesData[0].story_id);
      }
      
      // Load view count for own story
      if (isOwn && storiesData.length > 0) {
        loadViewCount(storiesData[0].story_id);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
      router.back();
    }
  };

  const recordView = async (storyId) => {
    try {
      await api.post('/stories/' + storyId + '/view');
    } catch (err) {
      console.log('View recording error:', err);
    }
  };

  const loadViewCount = async (storyId) => {
    try {
      const res = await api.get('/stories/' + storyId + '/viewers');
      setViewCount(res.data.view_count || 0);
      setViewers(res.data.viewers || []);
    } catch (error) {
      console.log('Error loading view count:', error);
    }
  };

  const startProgress = () => {
    progressAnim.setValue(0);
    
    if (progressAnimation.current) {
      progressAnimation.current.stop();
    }
    
    progressAnimation.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    
    progressAnimation.current.start(({ finished }) => {
      if (finished) {
        goToNext();
      }
    });
  };

  const pauseProgress = () => {
    setIsPaused(true);
    if (progressAnimation.current) {
      progressAnimation.current.stop();
    }
  };

  const resumeProgress = () => {
    setIsPaused(false);
  };

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      if (!isOwnStory) {
        recordView(stories[currentIndex + 1].story_id);
      } else {
        loadViewCount(stories[currentIndex + 1].story_id);
      }
    } else {
      router.back();
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      if (isOwnStory) {
        loadViewCount(stories[currentIndex - 1].story_id);
      }
    }
  };

  const handleTap = (locationX) => {
    const isLeftSide = locationX < SCREEN_WIDTH / 3;
    const isRightSide = locationX > (SCREEN_WIDTH * 2) / 3;
    
    if (isLeftSide) {
      goToPrev();
    } else if (isRightSide) {
      goToNext();
    }
  };

  const handleLongPressIn = () => {
    pauseProgress();
  };

  const handleLongPressOut = () => {
    resumeProgress();
  };

  const handleLikeStory = async () => {
    setLiked(true);
    
    // Animate heart
    likeScale.setValue(0);
    Animated.spring(likeScale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
    
    try {
      await api.post('/stories/' + stories[currentIndex].story_id + '/like');
    } catch (error) {
      console.log('Error liking story:', error);
    }
    
    setTimeout(() => {
      Animated.timing(likeScale, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setLiked(false));
    }, 1000);
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    
    try {
      await api.post('/messages/send', {
        to_user_id: userId,
        text: 'Replied to your story: ' + replyText,
        story_id: stories[currentIndex].story_id,
      });
      setReplyText('');
      setShowReplyInput(false);
      Alert.alert('Sent', 'Reply sent!');
    } catch (error) {
      console.log('Error sending reply:', error);
    }
  };

  const handleDeleteStory = async () => {
    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/stories/' + stories[currentIndex].story_id);
              if (stories.length === 1) {
                router.back();
              } else {
                const newStories = stories.filter((_, i) => i !== currentIndex);
                setStories(newStories);
                if (currentIndex >= newStories.length) {
                  setCurrentIndex(newStories.length - 1);
                }
              }
            } catch (error) {
              console.log('Error deleting story:', error);
            }
          },
        },
      ]
    );
  };

  const openViewersList = async () => {
    pauseProgress();
    setShowViewers(true);
    setLoadingViewers(true);
    
    try {
      const res = await api.get('/stories/' + stories[currentIndex].story_id + '/viewers');
      setViewCount(res.data.view_count || 0);
      setViewers(res.data.viewers || []);
    } catch (error) {
      console.log('Error loading viewers:', error);
    } finally {
      setLoadingViewers(false);
    }
  };

  const getTimeAgo = (createdAt) => {
    if (!createdAt) return '';
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffHrs > 0) return diffHrs + 'h';
    if (diffMins > 0) return diffMins + 'm';
    return 'Just now';
  };

  const getUserPicture = () => {
    if (user && user.picture) {
      if (user.picture.startsWith('http')) {
        return user.picture;
      }
      return 'data:image/jpeg;base64,' + user.picture;
    }
    return 'https://via.placeholder.com/100';
  };

  const renderViewer = ({ item }) => (
    <View style={styles.viewerItem}>
      <Image
        source={{ uri: item.picture ? (item.picture.startsWith('http') ? item.picture : 'data:image/jpeg;base64,' + item.picture) : 'https://via.placeholder.com/100' }}
        style={styles.viewerImage}
      />
      <View style={styles.viewerInfo}>
        <Text style={styles.viewerName}>{item.name}</Text>
        <Text style={styles.viewerUsername}>@{item.username}</Text>
      </View>
    </View>
  );

  if (stories.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const currentStory = stories[currentIndex];
  const isVideo = currentStory?.media_type === 'video';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Story Content */}
      <TouchableWithoutFeedback
        onPress={(e) => handleTap(e.nativeEvent.locationX)}
        onLongPress={handleLongPressIn}
        onPressOut={handleLongPressOut}
        delayLongPress={200}
      >
        <View style={styles.storyContainer}>
          {isVideo ? (
            <Video
              source={{ uri: 'data:video/mp4;base64,' + currentStory.image }}
              style={styles.storyMedia}
              resizeMode="contain"
              shouldPlay={!isPaused}
              isLooping={false}
              onPlaybackStatusUpdate={(status) => {
                if (status.didJustFinish) goToNext();
              }}
            />
          ) : (
            <Image
              source={{ uri: 'data:image/jpeg;base64,' + currentStory.image }}
              style={styles.storyMedia}
              resizeMode="contain"
            />
          )}
          
          {/* Like Animation */}
          {liked && (
            <Animated.View style={[styles.likeAnimation, { transform: [{ scale: likeScale }] }]}>
              <Ionicons name="heart" size={100} color="#ff3b5c" />
            </Animated.View>
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Progress Bars */}
      <View style={styles.progressContainer}>
        {stories.map((_, index) => (
          <View key={index} style={styles.progressBarWrapper}>
            <View style={styles.progressBarBg}>
              {index < currentIndex ? (
                <View style={[styles.progressBarFill, { width: '100%' }]} />
              ) : index === currentIndex ? (
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              ) : null}
            </View>
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.userInfoContainer}
          onPress={() => router.push('/profile?userId=' + userId)}
        >
          <Image source={{ uri: getUserPicture() }} style={styles.userImage} />
          <View>
            <Text style={styles.userName}>{user?.username || user?.name}</Text>
            <Text style={styles.storyTime}>{getTimeAgo(currentStory?.created_at)}</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          {isOwnStory && (
            <TouchableOpacity onPress={() => setShowOptions(true)} style={styles.headerButton}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        {isOwnStory ? (
          <TouchableOpacity style={styles.viewsButton} onPress={openViewersList}>
            <Ionicons name="eye-outline" size={22} color="#fff" />
            <Text style={styles.viewsText}>{viewCount}</Text>
          </TouchableOpacity>
        ) : (
          <>
            {showReplyInput ? (
              <View style={styles.replyInputContainer}>
                <TextInput
                  style={styles.replyInput}
                  placeholder="Send message..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={replyText}
                  onChangeText={setReplyText}
                  autoFocus
                  onBlur={() => setShowReplyInput(false)}
                />
                <TouchableOpacity onPress={handleSendReply}>
                  <Ionicons name="send" size={24} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.replyButton}
                onPress={() => setShowReplyInput(true)}
              >
                <Text style={styles.replyButtonText}>Send message</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity onPress={handleLikeStory} style={styles.actionButton}>
              <Ionicons name="heart-outline" size={28} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="paper-plane-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Viewers Modal */}
      <Modal
        visible={showViewers}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowViewers(false);
          resumeProgress();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Viewers</Text>
              <TouchableOpacity onPress={() => {
                setShowViewers(false);
                resumeProgress();
              }}>
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

      {/* Options Modal (for own story) */}
      <Modal
        visible={showOptions}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowOptions(false)}>
          <View style={styles.optionsOverlay}>
            <View style={styles.optionsContent}>
              <TouchableOpacity style={styles.optionItem} onPress={() => {
                setShowOptions(false);
                handleDeleteStory();
              }}>
                <Ionicons name="trash-outline" size={24} color="#ff3b5c" />
                <Text style={[styles.optionText, { color: '#ff3b5c' }]}>Delete Story</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.optionItem} onPress={() => {
                setShowOptions(false);
                // Save to highlights
                Alert.alert('Save to Highlights', 'Story saved to highlights!');
              }}>
                <Ionicons name="bookmark-outline" size={24} color={Colors.text} />
                <Text style={styles.optionText}>Save to Highlights</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.optionItem} onPress={() => setShowOptions(false)}>
                <Ionicons name="close-outline" size={24} color={Colors.text} />
                <Text style={styles.optionText}>Cancel</Text>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyMedia: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  likeAnimation: {
    position: 'absolute',
  },
  progressContainer: {
    position: 'absolute',
    top: 50,
    left: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  progressBarWrapper: {
    flex: 1,
    height: 3,
  },
  progressBarBg: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 1.5,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  storyTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  viewsText: {
    fontSize: 14,
    color: '#fff',
  },
  replyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  replyButtonText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  replyInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  replyInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#fff',
  },
  actionButton: {
    padding: 8,
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
    maxHeight: SCREEN_HEIGHT * 0.6,
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
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    width: SCREEN_WIDTH * 0.8,
    padding: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
  },
});

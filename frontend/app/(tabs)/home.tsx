import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  RefreshControl,
  FlatList,
  Dimensions,
  Alert,
  Animated,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const STORY_SIZE = 75;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stories, setStories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [myStories, setMyStories] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  
  // Comments Modal
  const [showComments, setShowComments] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user && user.following) {
      setFollowingIds(user.following);
    }
    if (user && user.saved_posts) {
      setSavedPosts(user.saved_posts);
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [storiesRes, postsRes, myStoriesRes] = await Promise.all([
        api.get('/stories'),
        api.get('/posts/feed'),
        api.get('/stories/user/' + (user ? user.user_id : '')),
      ]);
      setStories(storiesRes.data || []);
      setPosts(postsRes.data || []);
      setMyStories(myStoriesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      try {
        const exploreRes = await api.get('/posts/explore?limit=50');
        setPosts(exploreRes.data || []);
      } catch (e) {
        console.error('Error loading explore posts:', e);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddStory = async () => {
    if (myStories.length >= 10) {
      Alert.alert('Limit Reached', 'You can only add up to 10 stories');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.7,
      base64: true,
      videoMaxDuration: 30,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video';
        
        await api.post('/stories', {
          image: asset.base64,
          media_type: isVideo ? 'video' : 'image',
        });
        Alert.alert('Success', 'Story uploaded!');
        await loadData();
      } catch (error) {
        console.error('Error uploading story:', error);
        Alert.alert('Error', 'Failed to upload story');
      }
    }
  };

  const handleViewMyStory = () => {
    if (myStories.length > 0 && user) {
      router.push('/story/view?userId=' + user.user_id);
    } else {
      handleAddStory();
    }
  };

  const handleFollow = async (userId) => {
    try {
      const isFollowing = followingIds.includes(userId);
      
      if (isFollowing) {
        await api.post('/users/' + userId + '/unfollow');
        setFollowingIds(followingIds.filter(function(id) { return id !== userId; }));
      } else {
        await api.post('/users/' + userId + '/follow');
        setFollowingIds([...followingIds, userId]);
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
    }
  };

  const handleLike = async (postId, isLiked) => {
    try {
      if (isLiked) {
        await api.post('/posts/' + postId + '/unlike');
      } else {
        await api.post('/posts/' + postId + '/like');
      }
      setPosts(posts.map(function(post) {
        if (post.post_id === postId) {
          var likes = isLiked
            ? post.likes.filter(function(id) { return id !== (user ? user.user_id : ''); })
            : [...post.likes, user ? user.user_id : ''];
          return { ...post, likes: likes };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleSavePost = async (postId) => {
    try {
      const isSaved = savedPosts.includes(postId);
      if (isSaved) {
        await api.post('/posts/' + postId + '/unsave');
        setSavedPosts(savedPosts.filter(id => id !== postId));
      } else {
        await api.post('/posts/' + postId + '/save');
        setSavedPosts([...savedPosts, postId]);
      }
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleSharePost = async (post) => {
    try {
      await Share.share({
        message: 'Check out this post on MARB! ' + (post.caption || ''),
        title: 'Share Post',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const openComments = (post) => {
    setSelectedPost(post);
    setComments(post.comments || []);
    setShowComments(true);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) return;
    
    try {
      const response = await api.post('/posts/' + selectedPost.post_id + '/comment', {
        text: commentText.trim()
      });
      
      const newComment = {
        comment_id: Date.now().toString(),
        user_id: user.user_id,
        user_name: user.name,
        user_picture: user.picture,
        text: commentText.trim(),
        created_at: new Date().toISOString()
      };
      
      setComments([...comments, newComment]);
      setCommentText('');
      
      // Update post in list
      setPosts(posts.map(p => {
        if (p.post_id === selectedPost.post_id) {
          return { ...p, comments: [...(p.comments || []), newComment] };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
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

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/marb-logo.jpg')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>MARB</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => router.push('/notifications')}>
            <Ionicons name="heart-outline" size={28} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={() => router.push('/(tabs)/create')}>
            <Ionicons name="camera-outline" size={28} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={() => router.push('/(tabs)/messages')}>
            <Ionicons name="chatbubble-outline" size={26} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.storiesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={stories}
          renderItem={renderStoryItem}
          keyExtractor={(item, index) => 'story-' + index}
          ListHeaderComponent={renderMyStory}
          contentContainerStyle={styles.storiesList}
        />
      </View>
    </View>
  );

  const renderMyStory = () => {
    const hasStory = myStories.length > 0;
    const storyCount = myStories.length;
    
    return (
      <View style={styles.storyItem}>
        <TouchableOpacity 
          style={styles.storyCircleContainer} 
          activeOpacity={0.7} 
          onPress={handleViewMyStory}
        >
          {hasStory ? (
            <LinearGradient
              colors={['#00d9ff', '#00ffcc', '#4fffb0']}
              style={styles.storyGradientRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.storyInnerCircle}>
                <Image
                  source={{ uri: getUserPicture() }}
                  style={styles.storyProfileImage}
                />
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.storyNoRing}>
              <Image
                source={{ uri: getUserPicture() }}
                style={styles.storyProfileImage}
              />
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.addStoryPlusButton}
            onPress={handleAddStory}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={14} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
        
        <Text style={styles.storyUsername} numberOfLines={1}>Your story</Text>
      </View>
    );
  };

  const renderStoryItem = ({ item }) => {
    const getStoryUserPic = () => {
      if (item.user && item.user.picture) {
        if (item.user.picture.startsWith('http')) {
          return item.user.picture;
        }
        return 'data:image/jpeg;base64,' + item.user.picture;
      }
      return 'https://via.placeholder.com/100';
    };

    return (
      <TouchableOpacity 
        style={styles.storyItem} 
        activeOpacity={0.7}
        onPress={() => router.push('/story/view?userId=' + (item.user ? item.user.user_id : ''))}
      >
        <View style={styles.storyCircleContainer}>
          <LinearGradient
            colors={['#00d9ff', '#00ffcc', '#4fffb0']}
            style={styles.storyGradientRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.storyInnerCircle}>
              <Image
                source={{ uri: getStoryUserPic() }}
                style={styles.storyProfileImage}
              />
            </View>
          </LinearGradient>
        </View>
        <Text style={styles.storyUsername} numberOfLines={1}>
          {item.user ? (item.user.username || item.user.name) : 'User'}
        </Text>
      </TouchableOpacity>
    );
  };

  const PostItem = ({ item }) => {
    const [showHeart, setShowHeart] = useState(false);
    const heartScale = useRef(new Animated.Value(0)).current;
    const lastTap = useRef(0);
    
    const isLiked = item.likes && user ? item.likes.includes(user.user_id) : false;
    const isFollowing = item.user ? followingIds.includes(item.user.user_id) : false;
    const isOwnPost = item.user && user ? item.user.user_id === user.user_id : false;
    const isSaved = savedPosts.includes(item.post_id);
    
    const getPostUserPic = () => {
      if (item.user && item.user.picture) {
        if (item.user.picture.startsWith('http')) {
          return item.user.picture;
        }
        return 'data:image/jpeg;base64,' + item.user.picture;
      }
      return 'https://via.placeholder.com/100';
    };

    const handleDoubleTap = () => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      
      if (now - lastTap.current < DOUBLE_TAP_DELAY) {
        // Double tap detected
        if (!isLiked) {
          handleLike(item.post_id, false);
        }
        // Show heart animation
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
      }
      lastTap.current = now;
    };
    
    return (
      <View style={styles.postCard}>
        <TouchableOpacity 
          style={styles.postHeader}
          onPress={() => item.user && router.push('/profile/' + item.user.user_id)}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: getPostUserPic() }}
            style={styles.postUserImage}
          />
          <View style={styles.postUserInfo}>
            <Text style={styles.postUserName}>{item.user ? (item.user.username || item.user.name) : 'User'}</Text>
            <Text style={styles.postUserId}>@{item.user ? (item.user.username || 'user') : 'user'}</Text>
          </View>
          {!isOwnPost && (
            <TouchableOpacity 
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={(e) => {
                e.stopPropagation();
                item.user && handleFollow(item.user.user_id);
              }}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.moreButton} onPress={(e) => e.stopPropagation()}>
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => router.push('/post/' + item.post_id)}
          onLongPress={handleDoubleTap}
        >
          <View style={styles.postImageContainer}>
            <Image
              source={{ uri: 'data:image/jpeg;base64,' + item.image }}
              style={styles.postImage}
              resizeMode="cover"
            />
            {showHeart && (
              <Animated.View style={[styles.heartAnimation, { transform: [{ scale: heartScale }] }]}>
                <Ionicons name="heart" size={100} color="#fff" />
              </Animated.View>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.postActions}>
          <View style={styles.leftActions}>
            <TouchableOpacity onPress={() => handleLike(item.post_id, isLiked)}>
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={28}
                color={isLiked ? '#ff3b5c' : Colors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => openComments(item)}>
              <Ionicons name="chatbubble-outline" size={26} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleSharePost(item)}>
              <Ionicons name="paper-plane-outline" size={26} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => handleSavePost(item.post_id)}>
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={26} 
              color={Colors.text} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.postInfo}>
          <Text style={styles.likesCount}>{item.likes ? item.likes.length : 0} likes</Text>
          {item.caption && (
            <Text style={styles.caption} numberOfLines={2}>
              <Text style={styles.captionUsername}>{item.user ? (item.user.username || item.user.name) : 'User'} </Text>
              {item.caption}
            </Text>
          )}
          {item.comments && item.comments.length > 0 && (
            <TouchableOpacity onPress={() => openComments(item)}>
              <Text style={styles.viewComments}>
                View all {item.comments.length} comments
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderPost = ({ item }) => <PostItem item={item} />;

  const renderComment = ({ item }) => {
    const getCommentUserPic = () => {
      if (item.user_picture) {
        if (item.user_picture.startsWith('http')) {
          return item.user_picture;
        }
        return 'data:image/jpeg;base64,' + item.user_picture;
      }
      return 'https://via.placeholder.com/100';
    };

    return (
      <View style={styles.commentItem}>
        <Image source={{ uri: getCommentUserPic() }} style={styles.commentUserImage} />
        <View style={styles.commentContent}>
          <Text style={styles.commentText}>
            <Text style={styles.commentUsername}>{item.user_name} </Text>
            {item.text}
          </Text>
          <Text style={styles.commentTime}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
          </Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="heart-outline" size={14} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.post_id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
      />

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
              renderItem={renderComment}
              keyExtractor={(item, index) => item.comment_id || index.toString()}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flatListContent: {
    flexGrow: 1,
    paddingBottom: 100,
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
    gap: 10,
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  headerIcon: {
    padding: 4,
  },
  storiesContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  storiesList: {
    paddingHorizontal: 12,
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: STORY_SIZE,
  },
  storyCircleContainer: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    position: 'relative',
  },
  storyGradientRing: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    padding: 3,
  },
  storyInnerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: (STORY_SIZE - 6) / 2,
    borderWidth: 2,
    borderColor: Colors.background,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  storyProfileImage: {
    width: '100%',
    height: '100%',
    borderRadius: STORY_SIZE / 2,
  },
  storyNoRing: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.primary,
    overflow: 'hidden',
  },
  addStoryPlusButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  storyUsername: {
    fontSize: 11,
    color: Colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  postCard: {
    marginBottom: 8,
    backgroundColor: Colors.cardBackground,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  postUserImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postUserInfo: {
    flex: 1,
  },
  postUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  postUserId: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.background,
  },
  followingButtonText: {
    color: Colors.text,
  },
  moreButton: {
    padding: 4,
  },
  postImageContainer: {
    width: width,
    height: width,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.border,
  },
  heartAnimation: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    marginLeft: 0,
  },
  postInfo: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  likesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  captionUsername: {
    fontWeight: '600',
  },
  viewComments: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
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
    height: height * 0.7,
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

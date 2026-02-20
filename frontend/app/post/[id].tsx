import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
  FlatList,
  Share,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

const { width, height } = Dimensions.get('window');

export default function PostDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const postId = params.id;
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  
  const heartScale = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts/' + postId);
      const postData = response.data;
      setPost(postData);
      setComments(postData.comments || []);
      setIsLiked(postData.likes?.includes(user?.user_id));
      // Check if saved
      const savedRes = await api.get('/users/me/saved').catch(() => ({ data: [] }));
      setIsSaved(savedRes.data?.some(p => p.post_id === postId));
      // Check if following
      setIsFollowing(user?.following?.includes(postData.user?.user_id));
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Post not found');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      if (!isLiked) {
        handleLike();
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

  const handleLike = async () => {
    try {
      if (isLiked) {
        await api.post('/posts/' + postId + '/unlike');
        setPost(prev => ({
          ...prev,
          likes: prev.likes.filter(id => id !== user?.user_id)
        }));
      } else {
        await api.post('/posts/' + postId + '/like');
        setPost(prev => ({
          ...prev,
          likes: [...(prev.likes || []), user?.user_id]
        }));
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (isSaved) {
        await api.post('/posts/' + postId + '/unsave');
      } else {
        await api.post('/posts/' + postId + '/save');
      }
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await api.post('/users/' + post.user.user_id + '/unfollow');
      } else {
        await api.post('/users/' + post.user.user_id + '/follow');
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error following:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out this post on MARB! ' + (post?.caption || ''),
        title: 'Share Post',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      const response = await api.post('/posts/' + postId + '/comment', {
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
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/posts/' + postId);
              router.back();
            } catch (error) {
              console.error('Error deleting post:', error);
            }
          }
        }
      ]
    );
  };

  const getUserPic = (item) => {
    if (item?.picture) {
      if (item.picture.startsWith('http')) return item.picture;
      return 'data:image/jpeg;base64,' + item.picture;
    }
    return 'https://via.placeholder.com/100';
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffDays > 0) return diffDays + 'd';
    if (diffHrs > 0) return diffHrs + 'h';
    return 'Just now';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!post) return null;

  const isOwnPost = post.user?.user_id === user?.user_id;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <TouchableOpacity onPress={() => setShowOptions(true)}>
          <Ionicons name="ellipsis-horizontal" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <TouchableOpacity 
          style={styles.userSection}
          onPress={() => router.push('/profile?userId=' + post.user?.user_id)}
        >
          <Image source={{ uri: getUserPic(post.user) }} style={styles.userImage} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{post.user?.username || post.user?.name}</Text>
            {post.location && <Text style={styles.location}>{post.location}</Text>}
          </View>
          {!isOwnPost && (
            <TouchableOpacity 
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={handleFollow}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Post Image */}
        <TouchableWithoutFeedback onPress={handleDoubleTap}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: 'data:image/jpeg;base64,' + post.image }}
              style={styles.postImage}
              resizeMode="cover"
            />
            {showHeart && (
              <Animated.View style={[styles.heartAnimation, { transform: [{ scale: heartScale }] }]}>
                <Ionicons name="heart" size={100} color="#fff" />
              </Animated.View>
            )}
          </View>
        </TouchableWithoutFeedback>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <View style={styles.leftActions}>
            <TouchableOpacity onPress={handleLike} data-testid="like-button">
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={28} 
                color={isLiked ? '#ff3b5c' : Colors.text} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowComments(true)} data-testid="comment-button">
              <Ionicons name="chatbubble-outline" size={26} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} data-testid="share-button">
              <Ionicons name="paper-plane-outline" size={26} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleSave} data-testid="save-button">
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={26} 
              color={Colors.text} 
            />
          </TouchableOpacity>
        </View>

        {/* Likes Count */}
        <Text style={styles.likesCount}>{post.likes?.length || 0} likes</Text>

        {/* Caption */}
        {post.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>
              <Text style={styles.captionUsername}>{post.user?.username || post.user?.name} </Text>
              {post.caption}
            </Text>
          </View>
        )}

        {/* View Comments */}
        {comments.length > 0 && (
          <TouchableOpacity onPress={() => setShowComments(true)}>
            <Text style={styles.viewComments}>View all {comments.length} comments</Text>
          </TouchableOpacity>
        )}

        {/* Time */}
        <Text style={styles.timeText}>{getTimeAgo(post.created_at)}</Text>
      </ScrollView>

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowComments(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.commentsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={comments}
              keyExtractor={(item, index) => item.comment_id || index.toString()}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Image source={{ uri: getUserPic(item) }} style={styles.commentImage} />
                  <View style={styles.commentContent}>
                    <Text style={styles.commentText}>
                      <Text style={styles.commentUsername}>{item.user_name} </Text>
                      {item.text}
                    </Text>
                    <View style={styles.commentActions}>
                      <Text style={styles.commentTime}>{getTimeAgo(item.created_at)}</Text>
                      <TouchableOpacity>
                        <Text style={styles.replyText}>Reply</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity>
                    <Ionicons name="heart-outline" size={14} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
              style={styles.commentsList}
              ListEmptyComponent={
                <View style={styles.noComments}>
                  <Text style={styles.noCommentsText}>No comments yet</Text>
                  <Text style={styles.noCommentsSubtext}>Be the first to comment</Text>
                </View>
              }
            />
            
            <View style={styles.addCommentContainer}>
              <Image source={{ uri: getUserPic(user) }} style={styles.commentInputImage} />
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor={Colors.textSecondary}
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity onPress={handleAddComment} disabled={!commentText.trim()}>
                <Text style={[styles.postButton, !commentText.trim() && styles.postButtonDisabled]}>
                  Post
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Options Modal */}
      <Modal
        visible={showOptions}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowOptions(false)}>
          <View style={styles.optionsOverlay}>
            <View style={styles.optionsContent}>
              {isOwnPost ? (
                <>
                  <TouchableOpacity style={styles.optionItem} onPress={() => {
                    setShowOptions(false);
                    handleDelete();
                  }}>
                    <Ionicons name="trash-outline" size={24} color="#ff3b5c" />
                    <Text style={[styles.optionText, { color: '#ff3b5c' }]}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.optionItem}>
                    <Ionicons name="pencil-outline" size={24} color={Colors.text} />
                    <Text style={styles.optionText}>Edit</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={styles.optionItem}>
                    <Ionicons name="flag-outline" size={24} color="#ff3b5c" />
                    <Text style={[styles.optionText, { color: '#ff3b5c' }]}>Report</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.optionItem} onPress={() => {
                    setShowOptions(false);
                    handleFollow();
                  }}>
                    <Ionicons name={isFollowing ? "person-remove-outline" : "person-add-outline"} size={24} color={Colors.text} />
                    <Text style={styles.optionText}>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity style={styles.optionItem} onPress={handleShare}>
                <Ionicons name="share-outline" size={24} color={Colors.text} />
                <Text style={styles.optionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionItem} onPress={() => setShowOptions(false)}>
                <Ionicons name="close-outline" size={24} color={Colors.text} />
                <Text style={styles.optionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  location: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.primary,
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
  imageContainer: {
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
  },
  actionsRow: {
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
  likesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  captionContainer: {
    paddingHorizontal: 12,
    marginBottom: 8,
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
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  // Comments Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  commentsModal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
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
  commentImage: {
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
    gap: 12,
    marginTop: 4,
  },
  commentTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  replyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
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
  // Options Modal
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    width: width * 0.8,
    padding: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
  },
});

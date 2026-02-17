import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Dimensions,
  Alert,
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
  const { user, setUser } = useAuthStore();
  const [stories, setStories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [myStories, setMyStories] = useState([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user?.following) {
      setFollowingIds(user.following);
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [storiesRes, postsRes, myStoriesRes] = await Promise.all([
        api.get('/stories'),
        api.get('/posts/feed'),
        api.get(`/stories/user/${user?.user_id}`),
      ]);
      setStories(storiesRes.data || []);
      setPosts(postsRes.data || []);
      setMyStories(myStoriesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      // Load explore posts as fallback if feed is empty
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
    if (myStories.length > 0) {
      router.push(`/story/view?userId=${user?.user_id}`);
    } else {
      handleAddStory();
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const isFollowing = followingIds.includes(userId);
      
      if (isFollowing) {
        await api.post(`/users/${userId}/unfollow`);
        setFollowingIds(prev => prev.filter(id => id !== userId));
      } else {
        await api.post(`/users/${userId}/follow`);
        setFollowingIds(prev => [...prev, userId]);
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      Alert.alert('Error', 'Failed to follow user');
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await api.post(`/posts/${postId}/unlike`);
      } else {
        await api.post(`/posts/${postId}/like`);
      }
      setPosts(posts.map(post => {
        if (post.post_id === postId) {
          const likes = isLiked
            ? post.likes.filter(id => id !== user?.user_id)
            : [...post.likes, user?.user_id];
          return { ...post, likes };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const getUserPicture = () => {
    if (user?.picture) {
      if (user.picture.startsWith('http')) {
        return user.picture;
      }
      return `data:image/jpeg;base64,${user.picture}`;
    }
    return 'https://via.placeholder.com/100';
  };

  const renderHeader = () => (
    <>
      {/* Header */}
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
          <TouchableOpacity style={styles.headerIcon} onPress={() => router.push('/(tabs)/messages')}>
            <Ionicons name="chatbubble-outline" size={26} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stories Section */}
      <View style={styles.storiesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={stories}
          renderItem={renderStoryItem}
          keyExtractor={(item, index) => `story-${index}`}
          ListHeaderComponent={renderMyStory}
          contentContainerStyle={styles.storiesList}
        />
      </View>
    </>
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
        {hasStory && <Text style={styles.storyCount}>{storyCount} stories</Text>}
      </View>
    );
  };

  const renderStoryItem = ({ item }) => {
    const getStoryUserPic = () => {
      if (item.user?.picture) {
        if (item.user.picture.startsWith('http')) {
          return item.user.picture;
        }
        return `data:image/jpeg;base64,${item.user.picture}`;
      }
      return 'https://via.placeholder.com/100';
    };

    return (
      <TouchableOpacity 
        style={styles.storyItem} 
        activeOpacity={0.7}
        onPress={() => router.push(`/story/view?userId=${item.user?.user_id}`)}
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
          {item.user?.username || item.user?.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPost = ({ item }) => {
    const isLiked = item.likes?.includes(user?.user_id);
    const isFollowing = followingIds.includes(item.user?.user_id);
    const isOwnPost = item.user?.user_id === user?.user_id;
    
    const getPostUserPic = () => {
      if (item.user?.picture) {
        if (item.user.picture.startsWith('http')) {
          return item.user.picture;
        }
        return `data:image/jpeg;base64,${item.user.picture}`;
      }
      return 'https://via.placeholder.com/100';
    };
    
    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Image
            source={{ uri: getPostUserPic() }}
            style={styles.postUserImage}
          />
          <View style={styles.postUserInfo}>
            <Text style={styles.postUserName}>{item.user?.username || item.user?.name}</Text>
            <Text style={styles.postUserId}>@{item.user?.username || 'user'}</Text>
          </View>
          {!isOwnPost && (
            <TouchableOpacity 
              style={[
                styles.followButton,
                isFollowing && styles.followingButton
              ]}
              onPress={() => handleFollow(item.user?.user_id)}
            >
              <Text style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText
              ]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Image
          source={{ uri: `data:image/jpeg;base64,${item.image}` }}
          style={styles.postImage}
          resizeMode="cover"
        />

        <View style={styles.postActions}>
          <View style={styles.leftActions}>
            <TouchableOpacity onPress={() => handleLike(item.post_id, isLiked)}>
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={28}
                color={isLiked ? Colors.error : Colors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={26} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="paper-plane-outline" size={26} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity>
            <Ionicons name="bookmark-outline" size={26} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.postInfo}>
          <Text style={styles.likesCount}>{item.likes?.length || 0} likes</Text>
          {item.caption && (
            <Text style={styles.caption}>
              <Text style={styles.captionUsername}>{item.user?.username || item.user?.name} </Text>
              {item.caption}
            </Text>
          )}
          {item.comments?.length > 0 && (
            <TouchableOpacity>
              <Text style={styles.viewComments}>
                View all {item.comments.length} comments
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
  storyCount: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
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
  postImage: {
    width: width,
    height: width,
    backgroundColor: Colors.border,
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
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stories, setStories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [myStories, setMyStories] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [storiesRes, postsRes, myStoriesRes] = await Promise.all([
        api.get('/stories'),
        api.get('/posts/feed'),
        api.get(`/stories/user/${user?.user_id}`),
      ]);
      setStories(storiesRes.data);
      setPosts(postsRes.data);
      setMyStories(myStoriesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddStory = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
      base64: true,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets[0].base64) {
      try {
        await api.post('/stories', {
          image: result.assets[0].base64,
        });
        Alert.alert('Success', 'Story uploaded!');
        await loadData();
      } catch (error) {
        console.error('Error uploading story:', error);
        Alert.alert('Error', 'Failed to upload story');
      }
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

  const renderMyStory = () => {
    const hasStory = myStories.length > 0;
    
    return (
      <TouchableOpacity style={styles.storyItem} activeOpacity={0.7} onPress={handleAddStory}>
        {hasStory ? (
          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            style={styles.storyGradient}
          >
            <View style={styles.storyInner}>
              <Image
                source={{ uri: user?.picture || 'https://via.placeholder.com/100' }}
                style={styles.storyImage}
              />
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.addStoryContainer}>
            <Image
              source={{ uri: user?.picture || 'https://via.placeholder.com/100' }}
              style={styles.storyImage}
            />
            <View style={styles.addStoryButton}>
              <Ionicons name="add" size={20} color={Colors.background} />
            </View>
          </View>
        )}
        <Text style={styles.storyName} numberOfLines={1}>
          {hasStory ? 'Your story' : 'Add story'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderStoryItem = ({ item }) => (
    <TouchableOpacity style={styles.storyItem} activeOpacity={0.7}>
      <LinearGradient
        colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
        style={styles.storyGradient}
      >
        <View style={styles.storyInner}>
          <Image
            source={{ uri: item.user?.picture || 'https://via.placeholder.com/100' }}
            style={styles.storyImage}
          />
        </View>
      </LinearGradient>
      <Text style={styles.storyName} numberOfLines={1}>
        {item.user?.username || item.user?.name}
      </Text>
    </TouchableOpacity>
  );

  const renderPost = ({ item }) => {
    const isLiked = item.likes?.includes(user?.user_id);
    
    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Image
            source={{ uri: item.user?.picture || 'https://via.placeholder.com/100' }}
            style={styles.postUserImage}
          />
          <View style={styles.postUserInfo}>
            <Text style={styles.postUserName}>{item.user?.name}</Text>
            <Text style={styles.postTime}>2h ago</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={24} color={Colors.textSecondary} />
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
          <TouchableOpacity style={styles.headerIcon} onPress={() => router.push('/camera/capture')}>
            <Ionicons name="camera-outline" size={28} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="heart-outline" size={28} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="chatbubble-outline" size={26} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stories */}
      <View style={styles.storiesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={stories}
          renderItem={renderStoryItem}
          keyExtractor={(item, index) => index.toString()}
          ListHeaderComponent={renderMyStory}
          contentContainerStyle={styles.storiesList}
        />
      </View>

      {/* Posts Feed */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.post_id}
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
            <Text style={styles.emptySubtext}>Follow users to see their posts</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    gap: 8,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
    width: 70,
  },
  storyGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 3,
    marginBottom: 4,
  },
  storyInner: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    borderWidth: 3,
    borderColor: Colors.background,
    overflow: 'hidden',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  addStoryContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  addStoryButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  storyName: {
    fontSize: 12,
    color: Colors.text,
  },
  postCard: {
    marginBottom: 16,
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
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  postTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
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
    paddingVertical: 12,
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
    fontSize: 15,
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

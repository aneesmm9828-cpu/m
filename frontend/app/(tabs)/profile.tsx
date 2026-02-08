import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const imageSize = (width - 6) / 3;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, setIsAuthenticated } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const [postsRes, storiesRes] = await Promise.all([
        api.get(`/posts/user/${user?.user_id}`),
        api.get(`/stories/user/${user?.user_id}`),
      ]);
      setPosts(postsRes.data);
      setMyStories(storiesRes.data);
      setStats({
        posts: postsRes.data.length,
        followers: user?.followers?.length || 0,
        following: user?.following?.length || 0,
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleAddStory = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      try {
        await api.post('/stories', {
          image: result.assets[0].base64,
        });
        Alert.alert('Success', 'Story uploaded!');
        await loadProfile();
      } catch (error) {
        console.error('Error uploading story:', error);
        Alert.alert('Error', 'Failed to upload story');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      logout();
      setIsAuthenticated(false);
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: handleLogout },
      ],
      { cancelable: true }
    );
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity style={styles.postItem} activeOpacity={0.7}>
      <Image
        source={{ uri: `data:image/jpeg;base64,${item.image}` }}
        style={styles.postImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const hasStory = myStories.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={confirmLogout}>
            <Ionicons name="log-out-outline" size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          {/* Profile Picture with Story Ring */}
          <TouchableOpacity style={styles.profileImageContainer} onPress={handleAddStory}>
            {hasStory ? (
              <LinearGradient
                colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
                style={styles.profileImageGradient}
              >
                <View style={styles.profileImageInner}>
                  <Image
                    source={{ uri: user?.picture || 'https://via.placeholder.com/150' }}
                    style={styles.profileImage}
                  />
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.profileImageNoBorder}>
                <Image
                  source={{ uri: user?.picture || 'https://via.placeholder.com/150' }}
                  style={styles.profileImage}
                />
              </View>
            )}
            {/* Add Story Button */}
            <View style={styles.addStoryButton}>
              <Ionicons name="add" size={20} color={Colors.background} />
            </View>
          </TouchableOpacity>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.posts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {/* Name and Bio */}
          <View style={styles.infoContainer}>
            <Text style={styles.name}>{user?.name}</Text>
            {user?.username && (
              <Text style={styles.username}>@{user.username}</Text>
            )}
            {user?.bio && (
              <Text style={styles.bio}>{user.bio}</Text>
            )}
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
            <LinearGradient
              colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.editButtonGradient}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={styles.tab}>
            <Ionicons name="grid" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Ionicons name="play-circle-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Ionicons name="bookmark-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Posts Grid */}
        <View style={styles.postsContainer}>
          {posts.length > 0 ? (
            <FlatList
              data={posts}
              renderItem={renderPost}
              keyExtractor={(item) => item.post_id}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={styles.row}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>Share your first moment</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  profileImageContainer: {
    alignSelf: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  profileImageGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 4,
  },
  profileImageInner: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
    borderWidth: 4,
    borderColor: Colors.background,
    overflow: 'hidden',
  },
  profileImageNoBorder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  addStoryButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  infoContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  username: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  bio: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  editButton: {
    marginBottom: 8,
  },
  editButtonGradient: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  postsContainer: {
    marginTop: 2,
  },
  row: {
    gap: 2,
  },
  postItem: {
    width: imageSize,
    height: imageSize,
    marginBottom: 2,
  },
  postImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.border,
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

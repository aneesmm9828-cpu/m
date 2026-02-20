import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 4) / 3;

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user: currentUser } = useAuthStore();
  
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [stories, setStories] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [id]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      const [userRes, postsRes, reelsRes, storiesRes] = await Promise.all([
        api.get('/users/' + id),
        api.get('/users/' + id + '/posts').catch(() => ({ data: [] })),
        api.get('/reels/user/' + id).catch(() => ({ data: [] })),
        api.get('/stories/user/' + id).catch(() => ({ data: [] })),
      ]);
      
      setUser(userRes.data);
      setPosts(postsRes.data || []);
      setReels(reelsRes.data || []);
      setStories(storiesRes.data || []);
      
      // Check if following
      setIsFollowing(currentUser?.following?.includes(id));
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'User not found');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await api.post('/users/' + id + '/unfollow');
        setUser(prev => ({
          ...prev,
          followers_count: (prev.followers_count || 0) - 1
        }));
      } else {
        await api.post('/users/' + id + '/follow');
        setUser(prev => ({
          ...prev,
          followers_count: (prev.followers_count || 0) + 1
        }));
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error following:', error);
    }
  };

  const handleMessage = () => {
    router.push('/chat/' + id);
  };

  const handleBlock = async () => {
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/users/' + id + '/block');
              Alert.alert('Blocked', 'User has been blocked');
              router.back();
            } catch (error) {
              console.error('Error blocking:', error);
            }
          },
        },
      ]
    );
  };

  const getUserPic = () => {
    if (user?.picture) {
      if (user.picture.startsWith('http')) return user.picture;
      return 'data:image/jpeg;base64,' + user.picture;
    }
    return 'https://via.placeholder.com/150';
  };

  const getActiveData = () => {
    switch (activeTab) {
      case 'posts':
        return posts;
      case 'reels':
        return reels;
      default:
        return [];
    }
  };

  const renderGridItem = ({ item }) => {
    const getImage = () => {
      if (item.image) {
        return 'data:image/jpeg;base64,' + item.image;
      }
      if (item.video) {
        return 'data:video/mp4;base64,' + item.video;
      }
      return 'https://via.placeholder.com/150';
    };

    return (
      <TouchableOpacity 
        style={styles.gridItem}
        onPress={() => router.push('/post/' + (item.post_id || item.reel_id))}
      >
        <Image source={{ uri: getImage() }} style={styles.gridImage} />
        {activeTab === 'reels' && (
          <View style={styles.reelIndicator}>
            <Ionicons name="play" size={16} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.profileContent}>
      {/* Profile Info Row */}
      <View style={styles.profileRow}>
        {/* Profile Picture with Story Ring */}
        <TouchableOpacity 
          style={styles.profilePicContainer}
          onPress={() => stories.length > 0 && router.push('/story/view?userId=' + id)}
        >
          {stories.length > 0 ? (
            <LinearGradient
              colors={['#00d9ff', '#00ffcc', '#4fffb0']}
              style={styles.storyRing}
            >
              <View style={styles.storyRingInner}>
                <Image source={{ uri: getUserPic() }} style={styles.profilePic} />
              </View>
            </LinearGradient>
          ) : (
            <Image source={{ uri: getUserPic() }} style={styles.profilePic} />
          )}
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.followers_count || user?.followers?.length || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.following_count || user?.following?.length || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Name & Bio */}
      <View style={styles.bioSection}>
        <Text style={styles.displayName}>{user?.name}</Text>
        {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}
        {user?.link && (
          <TouchableOpacity>
            <Text style={styles.link}>{user.link}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followingBtn]}
          onPress={handleFollow}
        >
          <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.messageBtn} onPress={handleMessage}>
          <Text style={styles.messageBtnText}>Message</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.moreBtn} onPress={() => setShowOptions(true)}>
          <Ionicons name="chevron-down" size={18} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Ionicons
            name="grid-outline"
            size={24}
            color={activeTab === 'posts' ? Colors.primary : Colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reels' && styles.activeTab]}
          onPress={() => setActiveTab('reels')}
        >
          <Ionicons
            name="play-circle-outline"
            size={24}
            color={activeTab === 'reels' ? Colors.primary : Colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tagged' && styles.activeTab]}
          onPress={() => setActiveTab('tagged')}
        >
          <Ionicons
            name="person-outline"
            size={24}
            color={activeTab === 'tagged' ? Colors.primary : Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerUsername}>{user?.username || user?.name}</Text>
        <TouchableOpacity onPress={() => setShowOptions(true)}>
          <Ionicons name="ellipsis-horizontal" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={getActiveData()}
        renderItem={renderGridItem}
        keyExtractor={(item, index) => item.post_id || item.reel_id || index.toString()}
        numColumns={3}
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
            <Ionicons 
              name={activeTab === 'posts' ? 'camera-outline' : 'play-circle-outline'} 
              size={48} 
              color={Colors.textSecondary} 
            />
            <Text style={styles.emptyText}>No {activeTab} yet</Text>
          </View>
        }
      />

      {/* Options Modal */}
      {showOptions && (
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsModal}>
            <TouchableOpacity style={styles.optionItem} onPress={handleBlock}>
              <Ionicons name="ban-outline" size={24} color="#ff3b5c" />
              <Text style={[styles.optionText, { color: '#ff3b5c' }]}>Block</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem}>
              <Ionicons name="flag-outline" size={24} color="#ff3b5c" />
              <Text style={[styles.optionText, { color: '#ff3b5c' }]}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem}>
              <Ionicons name="volume-mute-outline" size={24} color={Colors.text} />
              <Text style={styles.optionText}>Mute</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem}>
              <Ionicons name="shield-outline" size={24} color={Colors.text} />
              <Text style={styles.optionText}>Restrict</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={() => setShowOptions(false)}>
              <Ionicons name="close-outline" size={24} color={Colors.text} />
              <Text style={styles.optionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
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
  headerUsername: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  profileContent: {
    paddingHorizontal: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  profilePicContainer: {
    marginRight: 24,
  },
  storyRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
  },
  storyRingInner: {
    flex: 1,
    borderRadius: 42,
    backgroundColor: Colors.background,
    padding: 2,
  },
  profilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bioSection: {
    paddingBottom: 16,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  link: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },
  followBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.background,
  },
  followingBtnText: {
    color: Colors.text,
  },
  messageBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
  },
  messageBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  moreBtn: {
    width: 40,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  gridItem: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  reelIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsModal: {
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

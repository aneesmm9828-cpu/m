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
  Modal,
  TextInput,
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
const HIGHLIGHT_SIZE = 70;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, setIsAuthenticated } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
  });
  
  // Highlight Modal
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [highlightName, setHighlightName] = useState('');
  const [selectedStories, setSelectedStories] = useState([]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const [postsRes, storiesRes, savedRes, reelsRes, highlightsRes] = await Promise.all([
        api.get('/posts/user/' + user?.user_id),
        api.get('/stories/user/' + user?.user_id),
        api.get('/users/me/saved').catch(() => ({ data: [] })),
        api.get('/reels/user/' + user?.user_id).catch(() => ({ data: [] })),
        api.get('/highlights/user/' + user?.user_id).catch(() => ({ data: [] })),
      ]);
      setPosts(postsRes.data || []);
      setMyStories(storiesRes.data || []);
      setSavedPosts(savedRes.data || []);
      setReels(reelsRes.data || []);
      setHighlights(highlightsRes.data || []);
      setStats({
        posts: (postsRes.data || []).length,
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
          media_type: result.assets[0].type === 'video' ? 'video' : 'image',
        });
        Alert.alert('Success', 'Story uploaded!');
        await loadProfile();
      } catch (error) {
        console.error('Error uploading story:', error);
        Alert.alert('Error', 'Failed to upload story');
      }
    }
  };

  const handleCreateHighlight = async () => {
    if (!highlightName.trim()) {
      Alert.alert('Error', 'Please enter a name for your highlight');
      return;
    }
    
    try {
      await api.post('/highlights', {
        name: highlightName,
        cover_image: myStories[0]?.image || '',
        story_ids: selectedStories,
      });
      setShowHighlightModal(false);
      setHighlightName('');
      setSelectedStories([]);
      Alert.alert('Success', 'Highlight created!');
      await loadProfile();
    } catch (error) {
      console.error('Error creating highlight:', error);
      Alert.alert('Error', 'Failed to create highlight');
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

  const getUserPicture = () => {
    if (user && user.picture) {
      if (user.picture.startsWith('http')) {
        return user.picture;
      }
      return 'data:image/jpeg;base64,' + user.picture;
    }
    return 'https://via.placeholder.com/150';
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity style={styles.postItem} activeOpacity={0.7}>
      <Image
        source={{ uri: 'data:image/jpeg;base64,' + item.image }}
        style={styles.postImage}
        resizeMode="cover"
      />
      {item.likes && item.likes.length > 0 && (
        <View style={styles.postOverlay}>
          <Ionicons name="heart" size={14} color="#fff" />
          <Text style={styles.postOverlayText}>{item.likes.length}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderReel = ({ item }) => (
    <TouchableOpacity style={styles.postItem} activeOpacity={0.7}>
      <Image
        source={{ uri: 'data:image/jpeg;base64,' + item.video }}
        style={styles.postImage}
        resizeMode="cover"
      />
      <View style={styles.reelIcon}>
        <Ionicons name="play" size={20} color="#fff" />
      </View>
    </TouchableOpacity>
  );

  const renderHighlight = ({ item, index }) => {
    if (index === 0) {
      // Add new highlight button
      return (
        <TouchableOpacity 
          style={styles.highlightItem} 
          onPress={() => setShowHighlightModal(true)}
        >
          <View style={styles.addHighlightCircle}>
            <Ionicons name="add" size={28} color={Colors.text} />
          </View>
          <Text style={styles.highlightName} numberOfLines={1}>New</Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity style={styles.highlightItem}>
        <View style={styles.highlightCircle}>
          <Image
            source={{ uri: item.cover_image ? 'data:image/jpeg;base64,' + item.cover_image : 'https://via.placeholder.com/100' }}
            style={styles.highlightImage}
          />
        </View>
        <Text style={styles.highlightName} numberOfLines={1}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const hasStory = myStories.length > 0;

  const getActiveContent = () => {
    switch (activeTab) {
      case 'posts':
        return posts;
      case 'reels':
        return reels;
      case 'saved':
        return savedPosts;
      default:
        return posts;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="menu-outline" size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{user?.username || 'Profile'}</Text>
          <TouchableOpacity onPress={confirmLogout}>
            <Ionicons name="log-out-outline" size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileTopRow}>
            {/* Profile Picture with Story Ring */}
            <TouchableOpacity 
              style={styles.profileImageContainer} 
              onPress={() => hasStory ? router.push('/story/view?userId=' + user?.user_id) : handleAddStory()}
            >
              {hasStory ? (
                <LinearGradient
                  colors={['#00d9ff', '#00ffcc', '#4fffb0']}
                  style={styles.profileImageGradient}
                >
                  <View style={styles.profileImageInner}>
                    <Image
                      source={{ uri: getUserPicture() }}
                      style={styles.profileImage}
                    />
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.profileImageNoBorder}>
                  <Image
                    source={{ uri: getUserPicture() }}
                    style={styles.profileImage}
                  />
                </View>
              )}
              <TouchableOpacity style={styles.addStoryButton} onPress={handleAddStory}>
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
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
          </View>

          {/* Name and Bio */}
          <View style={styles.infoContainer}>
            <Text style={styles.name}>{user?.name}</Text>
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
              style={styles.editButton} 
              activeOpacity={0.8}
              onPress={() => router.push('/profile/edit')}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.shareButton} 
              activeOpacity={0.8}
              onPress={() => router.push('/profile/qr')}
            >
              <Text style={styles.shareButtonText}>Share Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.discoverButton}>
              <Ionicons name="person-add-outline" size={18} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Story Highlights */}
        <View style={styles.highlightsSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ id: 'add' }, ...highlights]}
            renderItem={renderHighlight}
            keyExtractor={(item, index) => item.id || index.toString()}
            contentContainerStyle={styles.highlightsList}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons 
              name="grid" 
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
            style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
            onPress={() => setActiveTab('saved')}
          >
            <Ionicons 
              name="bookmark-outline" 
              size={24} 
              color={activeTab === 'saved' ? Colors.primary : Colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>

        {/* Content Grid */}
        <View style={styles.postsContainer}>
          {getActiveContent().length > 0 ? (
            <FlatList
              data={getActiveContent()}
              renderItem={activeTab === 'reels' ? renderReel : renderPost}
              keyExtractor={(item) => item.post_id || item.reel_id || Math.random().toString()}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={styles.row}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={activeTab === 'saved' ? 'bookmark-outline' : activeTab === 'reels' ? 'play-circle-outline' : 'images-outline'} 
                size={64} 
                color={Colors.textSecondary} 
              />
              <Text style={styles.emptyText}>
                {activeTab === 'saved' ? 'No saved posts' : activeTab === 'reels' ? 'No reels yet' : 'No posts yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'saved' ? 'Save posts to see them here' : 'Share your first moment'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Highlight Modal */}
      <Modal
        visible={showHighlightModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHighlightModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowHighlightModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Highlight</Text>
              <TouchableOpacity onPress={handleCreateHighlight}>
                <Text style={styles.modalDone}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.highlightInput}
              placeholder="Highlight name"
              placeholderTextColor={Colors.textSecondary}
              value={highlightName}
              onChangeText={setHighlightName}
            />
            
            <Text style={styles.selectStoriesText}>Select stories to add:</Text>
            
            <FlatList
              data={myStories}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.storySelectItem,
                    selectedStories.includes(item.story_id) && styles.storySelected
                  ]}
                  onPress={() => {
                    if (selectedStories.includes(item.story_id)) {
                      setSelectedStories(selectedStories.filter(id => id !== item.story_id));
                    } else {
                      setSelectedStories([...selectedStories, item.story_id]);
                    }
                  }}
                >
                  <Image
                    source={{ uri: 'data:image/jpeg;base64,' + item.image }}
                    style={styles.storySelectImage}
                  />
                  {selectedStories.includes(item.story_id) && (
                    <View style={styles.selectedCheck}>
                      <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.story_id}
              numColumns={3}
              contentContainerStyle={styles.storiesGrid}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 24,
  },
  profileImageGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
  },
  profileImageInner: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
    borderWidth: 3,
    borderColor: Colors.background,
    overflow: 'hidden',
  },
  profileImageNoBorder: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
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
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  infoContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  bio: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 4,
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
  },
  editButton: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  shareButton: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  discoverButton: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  highlightsSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  highlightsList: {
    paddingHorizontal: 16,
  },
  highlightItem: {
    alignItems: 'center',
    marginRight: 16,
    width: HIGHLIGHT_SIZE,
  },
  addHighlightCircle: {
    width: HIGHLIGHT_SIZE,
    height: HIGHLIGHT_SIZE,
    borderRadius: HIGHLIGHT_SIZE / 2,
    borderWidth: 1,
    borderColor: Colors.text,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightCircle: {
    width: HIGHLIGHT_SIZE,
    height: HIGHLIGHT_SIZE,
    borderRadius: HIGHLIGHT_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  highlightImage: {
    width: '100%',
    height: '100%',
  },
  highlightName: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 6,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  postsContainer: {
    minHeight: 200,
  },
  row: {
    gap: 2,
    marginBottom: 2,
  },
  postItem: {
    width: imageSize,
    height: imageSize,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postOverlayText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  reelIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
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
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  highlightInput: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    fontSize: 16,
    color: Colors.text,
  },
  selectStoriesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  storiesGrid: {
    paddingHorizontal: 16,
  },
  storySelectItem: {
    width: (width - 48) / 3,
    height: (width - 48) / 3,
    margin: 2,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  storySelectImage: {
    width: '100%',
    height: '100%',
  },
  storySelected: {
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  selectedCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
});

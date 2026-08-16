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
  ActivityIndicator,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { useAuthStore } from '../store/authStore';
import { getFeedPosts } from '../utils/supabaseHelpers';
import VideoCard from '../components/VideoCard';

const { width, height } = Dimensions.get('window');

const CATEGORIES = [
  'All', 'New to you', 'Gaming', 'Music', 'Live', 'News', 'Movies', 'Fashion', 'Learning', 'Sports', 'Podcasts', 'Mixes'
];

const EXPLORE_ITEMS = [
  { id: 'trending', name: 'Trending', icon: 'fire', color: '#ff4500' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#ff69b4' },
  { id: 'music', name: 'Music', icon: 'music', color: '#00ced1' },
  { id: 'movies', name: 'Movies', icon: 'film', color: '#ff1493' },
  { id: 'live', name: 'Live', icon: 'broadcast-tower', color: '#ff0000' },
  { id: 'gaming', name: 'Gaming', icon: 'gamepad', color: '#32cd32' },
  { id: 'news', name: 'News', icon: 'newspaper', color: '#4169e1' },
  { id: 'sports', name: 'Sports', icon: 'trophy', color: '#ffa500' },
];

export default function VideoHubScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('Home');
  const [showExplore, setShowExplore] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const feedPosts = await getFeedPosts(50);
      setPosts(feedPosts);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderTopBar = () => (
    <View style={styles.navBar}>
      <View style={styles.navLeft}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Hub</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.headerIcon}>
          <MaterialCommunityIcons name="cast" size={24} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIcon}>
          <View>
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
            <View style={styles.notificationBadge} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIcon} onPress={() => router.push('/video-search')}>
          <Ionicons name="search-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
          <Image
            source={{ uri: user?.picture || 'https://via.placeholder.com/100' }}
            style={styles.headerAvatar}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderExploreMenu = () => (
    <View style={styles.exploreContainer}>
      <Text style={styles.exploreHeader}>Explore</Text>
      <View style={styles.exploreGrid}>
        {EXPLORE_ITEMS.map((item) => (
          <TouchableOpacity key={item.id} style={styles.exploreItem}>
            <View style={[styles.exploreIconContainer, { backgroundColor: item.color + '20' }]}>
              <FontAwesome5 name={item.icon} size={20} color={item.color} />
            </View>
            <Text style={styles.exploreText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => setShowExplore(!showExplore)}
        >
          <MaterialCommunityIcons name="compass-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.activeChip]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.activeChipText]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {showExplore && renderExploreMenu()}
    </View>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.createSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Create</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.sheetItem} onPress={() => { setShowCreateModal(false); router.push('/shorts'); }}>
              <View style={styles.sheetIconBox}>
                <MaterialCommunityIcons name="play-box-outline" size={24} color={Colors.text} />
              </View>
              <Text style={styles.sheetText}>Create a Short</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetItem} onPress={() => setShowCreateModal(false)}>
              <View style={styles.sheetIconBox}>
                <Ionicons name="cloud-upload-outline" size={24} color={Colors.text} />
              </View>
              <Text style={styles.sheetText}>Upload a video</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetItem} onPress={() => { setShowCreateModal(false); router.push('/live/host'); }}>
              <View style={styles.sheetIconBox}>
                <MaterialCommunityIcons name="broadcast" size={24} color={Colors.text} />
              </View>
              <Text style={styles.sheetText}>Go Live</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetItem} onPress={() => setShowCreateModal(false)}>
              <View style={styles.sheetIconBox}>
                <Ionicons name="create-outline" size={24} color={Colors.text} />
              </View>
              <Text style={styles.sheetText}>Create a post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderBottomNav = () => (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Home')}>
        <Ionicons
          name={activeTab === 'Home' ? 'home' : 'home-outline'}
          size={24}
          color={activeTab === 'Home' ? Colors.text : Colors.textSecondary}
        />
        <Text style={[styles.navText, activeTab === 'Home' && styles.activeNavText]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => router.push('/shorts')}>
        <MaterialCommunityIcons
          name={activeTab === 'Shorts' ? 'play-box' : 'play-box-outline'}
          size={24}
          color={activeTab === 'Shorts' ? Colors.text : Colors.textSecondary}
        />
        <Text style={[styles.navText, activeTab === 'Shorts' && styles.activeNavText]}>Shorts</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
        <Ionicons name="add-circle-outline" size={40} color={Colors.text} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('Subscriptions')}>
        <MaterialCommunityIcons
          name={activeTab === 'Subscriptions' ? 'youtube-subscription' : 'youtube-subscription'}
          size={24}
          color={activeTab === 'Subscriptions' ? Colors.text : Colors.textSecondary}
        />
        <Text style={[styles.navText, activeTab === 'Subscriptions' && styles.activeNavText]}>Subs</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('You')}>
        <Image
          source={{ uri: user?.picture || 'https://via.placeholder.com/100' }}
          style={[styles.navAvatar, activeTab === 'You' && styles.activeNavAvatar]}
        />
        <Text style={[styles.navText, activeTab === 'You' && styles.activeNavText]}>You</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderTopBar()}

      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <VideoCard
            item={item}
            onPress={() => router.push({ pathname: '/video/[id]', params: { id: item.id } })}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No videos available</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {renderBottomNav()}
      {renderCreateModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  navLeft: { flexDirection: 'row', alignItems: 'center' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text, marginLeft: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerIcon: { padding: 4 },
  headerAvatar: { width: 28, height: 28, borderRadius: 14, marginLeft: 4 },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },

  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
  },
  exploreButton: {
    paddingRight: 12,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginRight: 12,
  },
  categoryList: { gap: 8 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeChip: { backgroundColor: Colors.text },
  categoryText: { color: Colors.text, fontSize: 14, fontWeight: '500' },
  activeChipText: { color: Colors.background },

  exploreContainer: {
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exploreHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  exploreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  exploreItem: {
    width: (width - 64) / 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  exploreIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  exploreText: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },

  bottomNav: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 4,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  activeNavText: {
    color: Colors.text,
  },
  createButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
  },
  activeNavAvatar: {
    borderColor: Colors.text,
    borderWidth: 2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  createSheet: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 16,
  },
  sheetIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.text, marginTop: 16 },
});

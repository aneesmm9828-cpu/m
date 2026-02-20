import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';

export default function ArchiveScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [reels, setReels] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadArchive();
  }, []);

  const loadArchive = async () => {
    try {
      // Load archived content
      const [postsRes, storiesRes, reelsRes] = await Promise.all([
        api.get('/archive/posts').catch(() => ({ data: [] })),
        api.get('/archive/stories').catch(() => ({ data: [] })),
        api.get('/archive/reels').catch(() => ({ data: [] })),
      ]);
      setPosts(postsRes.data || []);
      setStories(storiesRes.data || []);
      setReels(reelsRes.data || []);
    } catch (error) {
      console.error('Error loading archive:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadArchive();
    setRefreshing(false);
  };

  const getActiveData = () => {
    switch (activeTab) {
      case 'posts':
        return posts;
      case 'stories':
        return stories;
      case 'reels':
        return reels;
      default:
        return [];
    }
  };

  const renderItem = ({ item }) => {
    const getImage = () => {
      if (item.image) {
        return item.image.startsWith('http') ? item.image : 'data:image/jpeg;base64,' + item.image;
      }
      if (item.video) {
        return 'data:video/mp4;base64,' + item.video;
      }
      return 'https://via.placeholder.com/150';
    };

    return (
      <TouchableOpacity style={styles.gridItem}>
        <Image source={{ uri: getImage() }} style={styles.gridImage} />
        {(activeTab === 'reels' || item.media_type === 'video') && (
          <View style={styles.videoIndicator}>
            <Ionicons name="play" size={16} color="#fff" />
          </View>
        )}
        {activeTab === 'stories' && (
          <View style={styles.storyDate}>
            <Text style={styles.storyDateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons 
          name={activeTab === 'posts' ? 'grid-outline' : activeTab === 'stories' ? 'time-outline' : 'play-circle-outline'} 
          size={48} 
          color={Colors.textSecondary} 
        />
      </View>
      <Text style={styles.emptyTitle}>No archived {activeTab}</Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'posts' && 'When you archive posts, they will appear here'}
        {activeTab === 'stories' && 'Stories that have expired will be saved here'}
        {activeTab === 'reels' && 'Archived reels will show up here'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Archive</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Ionicons 
            name="grid-outline" 
            size={22} 
            color={activeTab === 'posts' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>Posts</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'stories' && styles.activeTab]}
          onPress={() => setActiveTab('stories')}
        >
          <Ionicons 
            name="time-outline" 
            size={22} 
            color={activeTab === 'stories' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'stories' && styles.activeTabText]}>Stories</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'reels' && styles.activeTab]}
          onPress={() => setActiveTab('reels')}
        >
          <Ionicons 
            name="play-circle-outline" 
            size={22} 
            color={activeTab === 'reels' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'reels' && styles.activeTabText]}>Reels</Text>
        </TouchableOpacity>
      </View>

      {/* Content Grid */}
      <FlatList
        data={getActiveData()}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.post_id || item.story_id || item.reel_id || index.toString()}
        numColumns={3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={getActiveData().length === 0 ? styles.emptyList : null}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  gridItem: {
    width: '33.33%',
    aspectRatio: 1,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  storyDate: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  storyDateText: {
    fontSize: 10,
    color: '#fff',
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

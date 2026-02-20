import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');
const imageSize = (width - 6) / 3;

export default function ArchiveScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('posts'); // posts, stories, reels
  const [archivedPosts, setArchivedPosts] = useState([]);
  const [archivedStories, setArchivedStories] = useState([]);
  const [archivedReels, setArchivedReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchive();
  }, []);

  const loadArchive = async () => {
    try {
      const [postsRes, storiesRes, reelsRes] = await Promise.all([
        api.get('/users/me/archive/posts').catch(() => ({ data: [] })),
        api.get('/users/me/archive/stories').catch(() => ({ data: [] })),
        api.get('/users/me/archive/reels').catch(() => ({ data: [] })),
      ]);
      setArchivedPosts(postsRes.data || []);
      setArchivedStories(storiesRes.data || []);
      setArchivedReels(reelsRes.data || []);
    } catch (error) {
      console.error('Error loading archive:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = (item, type) => {
    Alert.alert(
      'Unarchive',
      'Show this on your profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unarchive',
          onPress: async () => {
            try {
              await api.post('/' + type + '/' + (item.post_id || item.story_id || item.reel_id) + '/unarchive');
              loadArchive();
            } catch (error) {
              console.error('Error unarchiving:', error);
            }
          },
        },
      ]
    );
  };

  const handleDelete = (item, type) => {
    Alert.alert(
      'Delete',
      'Delete permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/' + type + '/' + (item.post_id || item.story_id || item.reel_id));
              loadArchive();
            } catch (error) {
              console.error('Error deleting:', error);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const imageSource = item.image || item.video;
    const itemId = item.post_id || item.story_id || item.reel_id;
    const type = item.post_id ? 'posts' : item.story_id ? 'stories' : 'reels';
    
    return (
      <TouchableOpacity 
        style={styles.itemContainer}
        onLongPress={() => {
          Alert.alert(
            'Options',
            'What would you like to do?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Unarchive', onPress: () => handleUnarchive(item, type) },
              { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item, type) },
            ]
          );
        }}
      >
        <Image
          source={{ uri: 'data:image/jpeg;base64,' + imageSource }}
          style={styles.itemImage}
          resizeMode="cover"
        />
        {item.is_reel || item.reel_id && (
          <View style={styles.reelIndicator}>
            <Ionicons name="play" size={14} color="#fff" />
          </View>
        )}
        <View style={styles.dateOverlay}>
          <Text style={styles.dateText}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getActiveData = () => {
    switch (activeTab) {
      case 'posts':
        return archivedPosts;
      case 'stories':
        return archivedStories;
      case 'reels':
        return archivedReels;
      default:
        return [];
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Archive</Text>
        <View style={{ width: 24 }} />
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

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
        <Text style={styles.infoText}>
          Only you can see your archived {activeTab}. Long press to unarchive or delete.
        </Text>
      </View>

      {/* Content */}
      <FlatList
        data={getActiveData()}
        renderItem={renderItem}
        keyExtractor={(item) => item.post_id || item.story_id || item.reel_id || Math.random().toString()}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={activeTab === 'posts' ? 'grid-outline' : activeTab === 'stories' ? 'time-outline' : 'play-circle-outline'} 
              size={64} 
              color={Colors.textSecondary} 
            />
            <Text style={styles.emptyTitle}>No archived {activeTab}</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'posts' 
                ? "Posts you archive will appear here" 
                : activeTab === 'stories'
                ? "Your expired stories will appear here"
                : "Reels you archive will appear here"}
            </Text>
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
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  row: {
    gap: 2,
  },
  gridContent: {
    paddingBottom: 100,
  },
  itemContainer: {
    width: imageSize,
    height: imageSize,
    marginBottom: 2,
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.border,
  },
  reelIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  dateOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dateText: {
    fontSize: 10,
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

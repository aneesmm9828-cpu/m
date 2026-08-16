import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';

const { width } = Dimensions.get('window');
const imageSize = (width - 6) / 3;

export default function HashtagScreen() {
  const router = useRouter();
  const { tag } = useLocalSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('top'); // 'top' or 'recent'

  useEffect(() => {
    loadTagPosts();
  }, [tag]);

  const loadTagPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts/tag/' + tag);
      setPosts(response.data || []);
    } catch (error) {
      console.error('Error loading tag posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity
      style={styles.postItem}
      activeOpacity={0.7}
      onPress={() => router.push('/post/' + item.post_id)}
    >
      <Image
        source={{ uri: 'data:image/jpeg;base64,' + (item.image || item.images[0]) }}
        style={styles.postImage}
        resizeMode="cover"
      />
      {item.images && item.images.length > 1 && (
        <View style={styles.carouselIndicator}>
          <Ionicons name="copy-outline" size={16} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerInfo}>
      <View style={styles.tagIconContainer}>
        <Text style={styles.tagHash}>#</Text>
      </View>
      <View style={styles.tagStats}>
        <Text style={styles.tagName}>#{tag}</Text>
        <Text style={styles.postCount}>{posts.length} posts</Text>
        <TouchableOpacity style={styles.followButton}>
          <Text style={styles.followButtonText}>Follow</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>#{tag}</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.post_id}
        numColumns={3}
        ListHeaderComponent={
          <>
            {renderHeader()}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'top' && styles.activeTab]}
                onPress={() => setActiveTab('top')}
              >
                <Text style={[styles.tabText, activeTab === 'top' && styles.activeTabText]}>Top</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
                onPress={() => setActiveTab('recent')}
              >
                <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>Recent</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No posts yet for this tag</Text>
            </View>
          )
        }
        loading={loading}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerInfo: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  tagIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  tagHash: {
    fontSize: 40,
    fontWeight: '300',
    color: Colors.text,
  },
  tagStats: {
    flex: 1,
  },
  tagName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  postCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  followButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  followButtonText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabs: {
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
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.text,
  },
  row: {
    gap: 2,
    marginBottom: 2,
  },
  postItem: {
    width: imageSize,
    height: imageSize,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  carouselIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});

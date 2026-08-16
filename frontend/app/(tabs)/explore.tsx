import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import {
  getUnifiedFeed,
  getTrendingPosts,
  getTrendingTopics,
  getSuggestedUsers
} from '../../utils/supabaseHelpers';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Responsive Grid Logic
const getNumColumns = () => {
  if (SCREEN_WIDTH > 1024) return 4; // Desktop
  if (SCREEN_WIDTH > 768) return 3; // Tablet
  return 2; // Mobile
};

const numColumns = getNumColumns();
const COLUMN_WIDTH = (SCREEN_WIDTH - (numColumns + 1)) / numColumns;

// --- Components ---

const TruthBadge = () => (
  <View style={styles.truthBadge}>
    <Ionicons name="checkmark-circle" size={12} color="#000" />
    <Text style={styles.truthText}>Truth</Text>
  </View>
);

const SearchBar = ({ value, onChangeText, onFocus }: any) => (
  <View style={styles.searchContainer}>
    <View style={styles.searchBar}>
      <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search accounts, posts, reels, hashtags, audio..."
        placeholderTextColor={Colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
      />
    </View>
  </View>
);

const ExploreTabs = ({ activeTab, onTabPress }: any) => (
  <View style={styles.tabsContainer}>
    <TouchableOpacity
      style={styles.tab}
      onPress={() => onTabPress('explore')}
      activeOpacity={0.8}
    >
      {activeTab === 'explore' ? (
        <LinearGradient
          colors={[Colors.primary, Colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activeTabGradient}
        >
          <Text style={styles.activeTabText}>✨ Explore</Text>
        </LinearGradient>
      ) : (
        <View style={styles.inactiveTabPill}>
          <Text style={styles.inactiveTabText}>✨ Explore</Text>
        </View>
      )}
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.tab}
      onPress={() => onTabPress('trending')}
      activeOpacity={0.8}
    >
      {activeTab === 'trending' ? (
        <LinearGradient
          colors={[Colors.primary, Colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activeTabGradient}
        >
          <Text style={styles.activeTabText}>🔥 Trending</Text>
        </LinearGradient>
      ) : (
        <View style={styles.inactiveTabPill}>
          <Text style={styles.inactiveTabText}>🔥 Trending</Text>
        </View>
      )}
    </TouchableOpacity>
  </View>
);

const SectionHeader = ({ title, onSeeAll }: any) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <TouchableOpacity onPress={onSeeAll}>
      <Text style={styles.seeAllText}>See all</Text>
    </TouchableOpacity>
  </View>
);

const CategoryFilters = ({ activeCategory, onCategoryPress }: any) => {
  const categories = ['All', 'Photography', 'Food', 'Travel', 'Fashion', 'Music', 'Tech', 'Sports', 'Art'];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesList}
    >
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat}
          style={styles.categoryItem}
          onPress={() => onCategoryPress(cat)}
          activeOpacity={0.7}
        >
          {activeCategory === cat ? (
            <LinearGradient
              colors={[Colors.primary, Colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.categoryGradient}
            >
              <Text style={styles.activeCategoryText}>{cat}</Text>
            </LinearGradient>
          ) : (
            <View style={styles.inactiveCategoryPill}>
              <Text style={styles.inactiveCategoryText}>{cat}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const SuggestedUserCard = ({ user, onProfilePress }: any) => {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    setLoading(true);
    try {
      const endpoint = following ? `/users/${user.id}/unfollow` : `/users/${user.id}/follow`;
      await api.post(endpoint);
      setFollowing(!following);
    } catch (err: any) {
      console.error('Follow error:', err);
      Alert.alert('Action Failed', 'Could not complete follow/unfollow request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity style={styles.userCard} onPress={() => onProfilePress(user.id)} activeOpacity={0.9}>
      <View style={styles.profileRing}>
        <Image source={{ uri: user.avatar_url || 'https://via.placeholder.com/100' }} style={styles.userAvatar} />
      </View>
      <Text style={styles.userName} numberOfLines={1}>{user.full_name || user.username}</Text>
      <Text style={styles.userHandle} numberOfLines={1}>@{user.username}</Text>

      <TouchableOpacity
        style={[styles.followButton, following && styles.followingButton]}
        onPress={handleFollow}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={following ? Colors.text : "#000"} />
        ) : (
          <Text style={[styles.followButtonText, following && styles.followingButtonText]}>
            {following ? 'Following' : '+ Follow'}
          </Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// --- Main Screen ---

export default function ExploreScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('explore');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [discoverFeed, setDiscoverFeed] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [trending, topics, suggested, discover] = await Promise.all([
        getTrendingPosts(8),
        getTrendingTopics(12),
        getSuggestedUsers(12),
        getUnifiedFeed(50)
      ]);

      setTrendingPosts(trending);
      setTrendingTopics(topics);
      setSuggestedUsers(suggested);
      setDiscoverFeed(discover);
    } catch (error) {
      console.error('Error loading explore data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const filteredDiscoverFeed = useMemo(() => {
    if (activeCategory === 'All') return discoverFeed;
    // Simple mock filtering based on index for demo
    // In production, each post would have a 'category' field
    return discoverFeed.filter((_, idx) => (idx % 3 === 0));
  }, [activeCategory, discoverFeed]);

  const renderDiscoverItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.discoverCard}
      onPress={() => router.push(item.type === 'reel' ? '/(tabs)/reels' : `/post/${item.id}`)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.media_url }} style={styles.discoverImage} />
      {(item.truthVerified || Math.random() > 0.8) && <TruthBadge />}
      {item.type === 'reel' && (
        <View style={styles.reelIcon}>
          <Ionicons name="play" size={16} color="white" />
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)']}
        style={styles.cardGradient}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. TOP SEARCH BAR */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFocus={() => router.push('/search')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* 2. EXPLORE / TRENDING NAVIGATION */}
        <ExploreTabs activeTab={activeTab} onTabPress={setActiveTab} />

        {activeTab === 'explore' ? (
          <>
            {/* 3. TRENDING POSTS SECTION */}
            <SectionHeader title="🔥 Trending Posts" onSeeAll={() => Alert.alert('Trending', 'View all trending posts coming soon!')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingPostsList}>
              {loading ? (
                [1,2,3].map(i => <View key={i} style={[styles.trendingPostSkeleton, { width: SCREEN_WIDTH * 0.75 }]} />)
              ) : trendingPosts.length > 0 ? (
                trendingPosts.map((post, idx) => (
                  <TouchableOpacity
                    key={post.id}
                    style={[styles.trendingPostCard, { width: SCREEN_WIDTH * 0.75 }]}
                    onPress={() => router.push(post.type === 'reel' ? '/(tabs)/reels' : `/post/${post.id}`)}
                  >
                    <Image source={{ uri: post.media_url }} style={styles.trendingPostImage} />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      style={styles.trendingPostOverlay}
                    >
                      <Text style={styles.trendingPostTitle} numberOfLines={1}>{post.caption || 'Trending Momentum'}</Text>
                      <View style={styles.trendingStatsRow}>
                        <Ionicons name="heart" size={12} color={Colors.primary} />
                        <Text style={styles.trendingPostStats}>{post.likes_count} likes</Text>
                        <Text style={styles.trendingPostStats}> • </Text>
                        <Ionicons name="chatbubble" size={11} color="#fff" />
                        <Text style={styles.trendingPostStats}>{post.comments_count} comments</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No trending posts yet this week.</Text>
                </View>
              )}
            </ScrollView>

            {/* 4. TRENDING NOW SECTION (Hashtags) */}
            <SectionHeader title="📈 Trending Now" onSeeAll={() => Alert.alert('Topics', 'Trending topics discovery coming soon!')} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hashtagsList}
            >
              {trendingTopics.length > 0 ? trendingTopics.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  style={styles.hashtagPill}
                  onPress={() => router.push(`/tag/${topic.name.replace('#', '')}`)}
                >
                  <Text style={styles.hashtagText}>#{topic.name.replace('#', '')} <Text style={styles.hashtagCount}>{topic.post_count}</Text></Text>
                </TouchableOpacity>
              )) : (
                ['repost', 'HappyDays', 'PositiveVibes', 'marb', 'realupload'].map(tag => (
                   <TouchableOpacity key={tag} style={styles.hashtagPill}>
                      <Text style={styles.hashtagText}>#{tag} 1</Text>
                   </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* 5. CATEGORY FILTER NAVIGATION */}
            <CategoryFilters
              activeCategory={activeCategory}
              onCategoryPress={setActiveCategory}
            />

            {/* 6. SUGGESTED FOR YOU SECTION */}
            <SectionHeader title="👥 Suggested for you" onSeeAll={() => Alert.alert('Suggestions', 'Full suggested accounts list coming soon!')} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestedUsersList}
            >
              {loading ? (
                 [1,2,3].map(i => <View key={i} style={styles.userCardSkeleton} />)
              ) : suggestedUsers.length > 0 ? suggestedUsers.map((user) => (
                <SuggestedUserCard
                  key={user.id}
                  user={user}
                  onProfilePress={(id: string) => router.push(`/profile/${id}`)}
                />
              )) : (
                <Text style={styles.emptyText}>No suggestions found.</Text>
              )}
            </ScrollView>

            {/* 9. DISCOVER SECTION */}
            <View style={styles.discoverHeader}>
              <Text style={styles.sectionTitle}>✨ Discover</Text>
            </View>
            <FlatList
              data={filteredDiscoverFeed}
              renderItem={renderDiscoverItem}
              keyExtractor={(item) => item.id}
              numColumns={numColumns}
              scrollEnabled={false}
              contentContainerStyle={styles.discoverGrid}
              ListEmptyComponent={
                <View style={styles.emptyDiscover}>
                  <Text style={styles.emptyText}>No posts found for this category</Text>
                </View>
              }
            />
          </>
        ) : (
          <View style={styles.trendingFullState}>
             <MaterialCommunityIcons name="fire" size={80} color={Colors.primary} />
             <Text style={styles.trendingComingSoon}>Trending Feed is currently updating...</Text>
             <TouchableOpacity style={styles.tryAgainBtn} onPress={onRefresh}>
                <Text style={styles.tryAgainText}>Refresh Trends</Text>
             </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 12. FLOATING MARB BUTTON */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push('/create')}
        aria-label="Create"
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryLight]}
          style={styles.floatingGradient}
        >
          <MaterialCommunityIcons name="sparkles" size={32} color="#000" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Search
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15 },

  // Tabs
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 8 },
  tab: { flex: 1, height: 46, borderRadius: 23, overflow: 'hidden' },
  activeTabGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  activeTabText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  inactiveTabPill: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  inactiveTabText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 14 },

  // Sections
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  seeAllText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },

  // Trending Posts
  trendingPostsList: { paddingLeft: 16, gap: 14, paddingRight: 16 },
  trendingPostCard: { height: 210, borderRadius: 20, overflow: 'hidden', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  trendingPostImage: { width: '100%', height: '100%' },
  trendingPostOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15 },
  trendingPostTitle: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  trendingStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendingPostStats: { color: '#eee', fontSize: 12, fontWeight: '500' },
  trendingPostSkeleton: { height: 210, borderRadius: 20, backgroundColor: Colors.surface, marginRight: 14 },

  // Hashtags
  hashtagsList: { paddingLeft: 16, gap: 10, paddingRight: 16 },
  hashtagPill: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 25, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  hashtagText: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  hashtagCount: { color: Colors.textSecondary, fontSize: 12, fontWeight: 'normal' },

  // Categories
  categoriesList: { paddingLeft: 16, gap: 12, marginTop: 24, marginBottom: 8, paddingRight: 16 },
  categoryItem: { height: 42, borderRadius: 21, overflow: 'hidden' },
  categoryGradient: { flex: 1, paddingHorizontal: 22, justifyContent: 'center', alignItems: 'center' },
  activeCategoryText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  inactiveCategoryPill: { flex: 1, paddingHorizontal: 22, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  inactiveCategoryText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 14 },

  // Suggested Users
  suggestedUsersList: { paddingLeft: 16, gap: 14, paddingBottom: 10, paddingRight: 16 },
  userCard: { width: 160, padding: 20, borderRadius: 20, backgroundColor: Colors.surface, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  profileRing: { padding: 3, borderRadius: 40, borderWidth: 2, borderColor: Colors.primary, marginBottom: 12 },
  userAvatar: { width: 70, height: 70, borderRadius: 35 },
  userName: { color: Colors.text, fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
  userHandle: { color: Colors.textSecondary, fontSize: 12, marginTop: 4, marginBottom: 16 },
  followButton: { width: '100%', height: 36, borderRadius: 10, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  followingButton: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.borderLight },
  followButtonText: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  followingButtonText: { color: Colors.text },
  userCardSkeleton: { width: 160, height: 210, borderRadius: 20, backgroundColor: Colors.surface, marginRight: 14 },

  // Discover Grid
  discoverHeader: { paddingHorizontal: 16, marginTop: 28, marginBottom: 16 },
  discoverGrid: { paddingHorizontal: 1 },
  discoverCard: { width: COLUMN_WIDTH, height: COLUMN_WIDTH * 1.4, margin: 0.5, position: 'relative', overflow: 'hidden', borderRadius: 4 },
  discoverImage: { width: '100%', height: '100%', backgroundColor: Colors.surface },
  cardGradient: { ...StyleSheet.absoluteFillObject },
  reelIcon: { position: 'absolute', top: 12, right: 12, zIndex: 10 },

  // Truth Badge
  truthBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    zIndex: 10
  },
  truthText: { color: '#000', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },

  // Floating Action
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 68,
    height: 68,
    borderRadius: 34,
    elevation: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  floatingGradient: { flex: 1, borderRadius: 34, justifyContent: 'center', alignItems: 'center' },

  // Other
  emptyContainer: { paddingLeft: 16, paddingVertical: 20 },
  emptyDiscover: { width: SCREEN_WIDTH, alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: Colors.textSecondary, fontStyle: 'italic', fontSize: 14 },
  trendingFullState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  trendingComingSoon: { color: Colors.textSecondary, fontSize: 16, marginTop: 20, fontWeight: '500' },
  tryAgainBtn: { marginTop: 30, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.primary },
  tryAgainText: { color: Colors.primary, fontWeight: 'bold', fontSize: 15 },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');
const imageSize = (width - 6) / 3;

const SEARCH_FILTERS = [
  { id: 'top', label: 'Top' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'audio', label: 'Audio' },
  { id: 'tags', label: 'Tags' },
  { id: 'places', label: 'Places' },
  { id: 'reels', label: 'Reels' },
];

const TRENDING_TAGS = [
  '#photography', '#travel', '#food', '#fitness', '#fashion',
  '#art', '#music', '#nature', '#beauty', '#lifestyle'
];

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [activeFilter, setActiveFilter] = useState('top');
  const [isSearching, setIsSearching] = useState(false);
  const [followingIds, setFollowingIds] = useState([]);

  useEffect(() => {
    loadExplorePosts();
    if (user?.following) {
      setFollowingIds(user.following);
    }
  }, [user]);

  const loadExplorePosts = async () => {
    try {
      const [postsRes, reelsRes] = await Promise.all([
        api.get('/posts/explore'),
        api.get('/reels').catch(() => ({ data: [] })),
      ]);
      setPosts(postsRes.data || []);
      setReels(reelsRes.data || []);
    } catch (error) {
      console.error('Error loading explore posts:', error);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.length > 1) {
      setIsSearching(true);
      try {
        const [usersRes, tagsRes] = await Promise.all([
          api.get('/users/search/' + query),
          api.get('/tags/search/' + query).catch(() => ({ data: [] })),
        ]);
        setUsers(usersRes.data || []);
        setTags(tagsRes.data || []);
      } catch (error) {
        console.error('Error searching:', error);
      }
    } else {
      setIsSearching(false);
      setUsers([]);
      setTags([]);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const isFollowing = followingIds.includes(userId);
      if (isFollowing) {
        await api.post('/users/' + userId + '/unfollow');
        setFollowingIds(followingIds.filter(id => id !== userId));
      } else {
        await api.post('/users/' + userId + '/follow');
        setFollowingIds([...followingIds, userId]);
      }
    } catch (error) {
      console.error('Error following:', error);
    }
  };

  const addToRecentSearches = (item) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.id !== item.id);
      return [item, ...filtered].slice(0, 10);
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  const getUserPic = (item) => {
    if (item.picture) {
      if (item.picture.startsWith('http')) return item.picture;
      return 'data:image/jpeg;base64,' + item.picture;
    }
    return 'https://via.placeholder.com/100';
  };

  const renderPost = ({ item, index }) => {
    // Create varied sizes like Instagram
    const isLarge = index % 10 === 0 || index % 10 === 6;
    
    return (
      <TouchableOpacity 
        style={[styles.postItem, isLarge && styles.largePost]} 
        activeOpacity={0.7}
        onPress={() => router.push('/post/' + item.post_id)}
      >
        <Image
          source={{ uri: 'data:image/jpeg;base64,' + item.image }}
          style={styles.postImage}
          resizeMode="cover"
        />
        {item.is_reel && (
          <View style={styles.reelIndicator}>
            <Ionicons name="play" size={16} color="#fff" />
          </View>
        )}
        {item.carousel && (
          <View style={styles.carouselIndicator}>
            <Ionicons name="copy-outline" size={16} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderUser = ({ item }) => {
    const isFollowing = followingIds.includes(item.user_id);
    
    return (
      <TouchableOpacity 
        style={styles.userItem} 
        activeOpacity={0.7}
        onPress={() => {
          addToRecentSearches({ id: item.user_id, type: 'user', ...item });
          router.push('/profile?userId=' + item.user_id);
        }}
      >
        <Image source={{ uri: getUserPic(item) }} style={styles.userImage} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.username || item.name}</Text>
          <Text style={styles.userFullName}>{item.name}</Text>
          {item.followers_count && (
            <Text style={styles.userFollowers}>{item.followers_count} followers</Text>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={(e) => {
            e.stopPropagation();
            handleFollow(item.user_id);
          }}
        >
          <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderTag = ({ item }) => (
    <TouchableOpacity 
      style={styles.tagItem}
      onPress={() => {
        addToRecentSearches({ id: item.tag, type: 'tag', name: item.tag });
        // Navigate to tag page
      }}
    >
      <View style={styles.tagIcon}>
        <Text style={styles.tagHash}>#</Text>
      </View>
      <View style={styles.tagInfo}>
        <Text style={styles.tagName}>{item.tag}</Text>
        <Text style={styles.tagCount}>{item.post_count || 0} posts</Text>
      </View>
    </TouchableOpacity>
  );

  const renderRecentSearch = ({ item }) => (
    <TouchableOpacity style={styles.recentItem}>
      {item.type === 'user' ? (
        <Image source={{ uri: getUserPic(item) }} style={styles.recentImage} />
      ) : (
        <View style={styles.recentTagIcon}>
          <Text style={styles.tagHash}>#</Text>
        </View>
      )}
      <View style={styles.recentInfo}>
        <Text style={styles.recentName}>{item.username || item.name}</Text>
        {item.type === 'user' && <Text style={styles.recentSubtext}>{item.name}</Text>}
      </View>
      <TouchableOpacity onPress={() => setRecentSearches(prev => prev.filter(s => s.id !== item.id))}>
        <Ionicons name="close" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSearchResults = () => {
    if (activeFilter === 'accounts' || (activeFilter === 'top' && users.length > 0)) {
      return (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.user_id}
          ListEmptyComponent={
            <View style={styles.emptySearch}>
              <Text style={styles.emptySearchText}>No accounts found</Text>
            </View>
          }
        />
      );
    }
    
    if (activeFilter === 'tags') {
      return (
        <FlatList
          data={tags.length > 0 ? tags : TRENDING_TAGS.map(t => ({ tag: t.slice(1) }))}
          renderItem={renderTag}
          keyExtractor={(item) => item.tag}
        />
      );
    }
    
    if (activeFilter === 'reels') {
      return (
        <FlatList
          data={reels}
          renderItem={renderPost}
          keyExtractor={(item) => item.reel_id}
          numColumns={3}
          columnWrapperStyle={styles.row}
        />
      );
    }
    
    // Top results - mix of users and posts
    return (
      <ScrollView>
        {users.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Accounts</Text>
            {users.slice(0, 3).map(u => renderUser({ item: u }))}
          </View>
        )}
        {tags.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Tags</Text>
            {tags.slice(0, 3).map(t => renderTag({ item: t }))}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TouchableOpacity onPress={() => setIsSearching(false)}>
          {isSearching && <Ionicons name="arrow-back" size={24} color={Colors.text} style={styles.backIcon} />}
        </TouchableOpacity>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => setIsSearching(true)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isSearching ? (
        <>
          {/* Search Filters */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
            contentContainerStyle={styles.filtersList}
          >
            {SEARCH_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[styles.filterTab, activeFilter === filter.id && styles.activeFilterTab]}
                onPress={() => setActiveFilter(filter.id)}
              >
                <Text style={[styles.filterText, activeFilter === filter.id && styles.activeFilterText]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Search Results or Recent */}
          {searchQuery.length > 1 ? (
            renderSearchResults()
          ) : (
            <View style={styles.recentContainer}>
              <View style={styles.recentHeader}>
                <Text style={styles.recentTitle}>Recent</Text>
                {recentSearches.length > 0 && (
                  <TouchableOpacity onPress={clearRecentSearches}>
                    <Text style={styles.clearText}>Clear all</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {recentSearches.length > 0 ? (
                <FlatList
                  data={recentSearches}
                  renderItem={renderRecentSearch}
                  keyExtractor={(item) => item.id.toString()}
                />
              ) : (
                <View style={styles.noRecent}>
                  <Text style={styles.noRecentText}>No recent searches</Text>
                </View>
              )}
            </View>
          )}
        </>
      ) : (
        /* Explore Grid */
        <FlatList
          data={[...posts, ...reels.map(r => ({ ...r, is_reel: true }))]}
          renderItem={renderPost}
          keyExtractor={(item) => item.post_id || item.reel_id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.gridContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="compass-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>Discover something new</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backIcon: {
    marginRight: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 36,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  filtersContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filtersList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.cardBackground,
    marginRight: 8,
  },
  activeFilterTab: {
    backgroundColor: Colors.text,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeFilterText: {
    color: Colors.background,
  },
  row: {
    gap: 2,
  },
  postItem: {
    width: imageSize,
    height: imageSize,
    marginBottom: 2,
  },
  largePost: {
    width: imageSize * 2 + 2,
    height: imageSize * 2 + 2,
  },
  postImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.border,
  },
  reelIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  carouselIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  gridContent: {
    paddingBottom: 100,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  userFullName: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  userFollowers: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
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
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  tagIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tagHash: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  tagInfo: {
    flex: 1,
  },
  tagName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  tagCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  recentContainer: {
    flex: 1,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  clearText: {
    fontSize: 14,
    color: Colors.primary,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  recentImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  recentTagIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  recentSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  noRecent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noRecentText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptySearch: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySearchText: {
    fontSize: 14,
    color: Colors.textSecondary,
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
});

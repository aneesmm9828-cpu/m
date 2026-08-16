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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../utils/supabaseConfig';
import StoryHighlight from '../../components/instagram-parity/StoryHighlight';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = (SCREEN_WIDTH - 4) / 3;

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user: currentUser } = useAuthStore();
  
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('grid');
  const [isOnline, setIsOnline] = useState(true); // Placeholder

  const isOwnProfile = id === currentUser?.user_id || !id;

  useEffect(() => {
    loadUserProfile();
  }, [id]);

  const loadUserProfile = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const targetId = id || currentUser?.user_id;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single();

      if (error) throw error;
      setUser(profile);

      const { data: userPosts, error: postsError } = await supabase
        .from('posts')
        .select('*, post_media(*)')
        .eq('user_id', targetId)
        .order('created_at', { ascending: false });
      
      if (postsError) throw postsError;

      const formattedPosts = (userPosts || []).map(post => ({
        ...post,
        media_url: post.post_media && post.post_media.length > 0 ? post.post_media[0].media_url : '',
        media_type: post.post_media && post.post_media.length > 0 ? post.post_media[0].media_type : 'image',
      }));

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'User not found');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Top Row: Avatar and Stats */}
      <View style={styles.topRow}>
        <View style={styles.profilePicContainer}>
          <Image
            key={user?.avatar_url || 'default'} // Add key to force re-render
            source={{ uri: user?.avatar_url || 'https://via.placeholder.com/150' }}
            style={styles.profilePic}
          />
          {isOnline && <View style={styles.onlineBadge} />}
          {isOwnProfile && (
            <TouchableOpacity style={styles.addAvatarBtn}>
              <Ionicons name="add" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.followers_count || '1.2K'}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.following_count || '450'}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.fullName}>{user?.full_name || user?.username}</Text>
        <Text style={styles.bio}>{user?.bio || 'Digital Creator | Content Enthusiast'}</Text>

        {/* Profile Music */}
        <TouchableOpacity style={styles.musicBar}>
          <Ionicons name="musical-notes" size={14} color={Colors.primary} />
          <Text style={styles.musicText}>Odisha Music - MARB Original</Text>
        </TouchableOpacity>

        {isOwnProfile && (
            <TouchableOpacity style={styles.dashboardBtn} onPress={() => router.push('/professional-dashboard')}>
              <Text style={styles.dashboardText}>Professional Dashboard</Text>
              <Text style={styles.dashboardSub}>1.2K accounts reached in the last 30 days.</Text>
            </TouchableOpacity>
        )}

        {!isOwnProfile && (
            <View style={styles.mutualSection}>
                <View style={styles.mutualAvatars}>
                    <Image source={{ uri: 'https://via.placeholder.com/50' }} style={styles.mutualSmallAvatar} />
                    <Image source={{ uri: 'https://via.placeholder.com/50' }} style={[styles.mutualSmallAvatar, { marginLeft: -12 }]} />
                </View>
                <Text style={styles.mutualText}>Followed by <Text style={styles.boldText}>Rahul</Text>, <Text style={styles.boldText}>Priya</Text> + 12 more</Text>
            </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {isOwnProfile ? (
          <>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/profile/edit')}>
              <Text style={styles.actionBtnText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>Share Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={[styles.followBtn, isFollowing && styles.followingBtn]} onPress={handleFollow}>
              <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => {
              const targetId = id || currentUser?.user_id;
              router.push(`/messages/chat?userId=${targetId}`);
            }}>
              <Text style={styles.actionBtnText}>Message</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Highlights */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.highlightsContainer}>
        {isOwnProfile && <StoryHighlight title="New" isNew />}
        <StoryHighlight title="Odisha" coverUrl="https://via.placeholder.com/100" />
        <StoryHighlight title="Travel" coverUrl="https://via.placeholder.com/100" />
        <StoryHighlight title="Work" coverUrl="https://via.placeholder.com/100" />
        <StoryHighlight title="Nature" coverUrl="https://via.placeholder.com/100" />
      </ScrollView>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'grid' && styles.activeTab]} onPress={() => setActiveTab('grid')}>
          <Ionicons name="grid-outline" size={24} color={activeTab === 'grid' ? Colors.primary : Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'reels' && styles.activeTab]} onPress={() => setActiveTab('reels')}>
          <MaterialCommunityIcons name="play-box-outline" size={24} color={activeTab === 'reels' ? Colors.primary : Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'tagged' && styles.activeTab]} onPress={() => setActiveTab('tagged')}>
          <Ionicons name="person-outline" size={24} color={activeTab === 'tagged' ? Colors.primary : Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isVideo = item.media_type === 'video';

    return (
      <TouchableOpacity
        style={styles.postThumbnail}
        onPress={() => {
          if (isVideo && activeTab === 'reels') {
            router.push('/(tabs)/reels');
          } else {
            // Pass the user ID and index so the detail screen can load all posts
            const targetId = id || currentUser?.user_id;
            router.push({
              pathname: `/post/${item.id}`,
              params: { userId: targetId, index: index.toString() }
            });
          }
        }}
      >
        <Image source={{ uri: item.media_url }} style={styles.postImg} />
        {item.is_pinned && (
          <View style={styles.pinIndicator}>
            <Ionicons name="pin" size={12} color="#fff" />
          </View>
        )}
        {isVideo && (
          <Ionicons name="play" size={16} color="#fff" style={styles.videoIcon} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={posts}
        numColumns={3}
        ListHeaderComponent={renderHeader}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadUserProfile} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  headerContent: { padding: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profilePicContainer: { position: 'relative' },
  profilePic: { width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: Colors.border },
  addAvatarBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.primary, width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  onlineBadge: { position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#4caf50', borderWidth: 2, borderColor: Colors.background, zIndex: 1 },
  statsRow: { flexDirection: 'row', gap: 20 },
  statItem: { alignItems: 'center' },
  statNumber: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: Colors.textSecondary, fontSize: 12 },
  infoSection: { marginTop: 12 },
  fullName: { color: Colors.text, fontSize: 15, fontWeight: 'bold' },
  bio: { color: Colors.text, fontSize: 14, marginTop: 2, lineHeight: 18 },
  musicBar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginTop: 10 },
  musicText: { color: Colors.text, fontSize: 12, fontWeight: '500' },
  dashboardBtn: { backgroundColor: Colors.surface, padding: 12, borderRadius: 8, marginTop: 12 },
  dashboardText: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  dashboardSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  mutualSection: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  mutualAvatars: { flexDirection: 'row' },
  mutualSmallAvatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.background },
  mutualText: { color: Colors.textSecondary, fontSize: 12, flex: 1 },
  boldText: { color: Colors.text, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  actionBtn: { flex: 1, backgroundColor: Colors.surface, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  actionBtnText: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  followBtn: { flex: 1, backgroundColor: Colors.primary, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  followBtnText: { color: '#000', fontSize: 14, fontWeight: '600' },
  followingBtn: { backgroundColor: Colors.surface },
  followingBtnText: { color: Colors.text },
  highlightsContainer: { marginTop: 20, marginBottom: 8 },
  tabsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  postThumbnail: { width: GRID_SIZE, height: (GRID_SIZE * 4) / 3, padding: 1 },
  postImg: { width: '100%', height: '100%', borderRadius: 4 },
  pinIndicator: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 10 },
  videoIcon: { position: 'absolute', top: 8, right: 8 },
});

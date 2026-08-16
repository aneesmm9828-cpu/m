import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ActivityIndicator,
  Share,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { useCallStore } from '../../store/callStore';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  getUserProfile,
  getUserPosts,
  getUserHighlights,
  getFollowers,
  getFollowing,
  getTaggedPosts,
} from '../../utils/supabaseHelpers';
import { supabase } from '../../utils/supabaseConfig';

const { width } = Dimensions.get('window');
const isDesktop = width > 1024;
const isTablet = width > 768 && width <= 1024;
const GRID_SIZE = isDesktop ? (width - 350) / 3 : (width - 4) / 3;

// --- Sub-components ---

const ProfileBadge = ({ icon, text, color }: { icon: string; text: string; color?: string }) => (
  <View style={styles.badge}>
    <MaterialCommunityIcons name={icon as any} size={14} color={color || Colors.primary} />
    <Text style={styles.badgeText}>{text}</Text>
  </View>
);

const ProfileStat = ({ label, count, onPress }: { label: string; count: number | string; onPress?: () => void }) => (
  <TouchableOpacity style={styles.statItem} onPress={onPress} disabled={!onPress}>
    <Text style={styles.statCount}>{count}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const TruthBadge = () => (
  <View style={styles.truthBadge}>
    <Ionicons name="checkmark-circle" size={10} color="#000" />
    <Text style={styles.truthText}>Truth</Text>
  </View>
);

const SkeletonBox = ({ width, height, borderRadius, style }: any) => (
  <View style={[{ width, height, borderRadius, backgroundColor: '#1a1a1a' }, style]} />
);

// --- Main Screen ---

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user: currentUser, logout, setIsAuthenticated } = useAuthStore();
  const { initCall } = useCallStore();

  const targetUserId = params.id as string || currentUser?.user_id;
  const isOwnProfile = !params.id || params.id === currentUser?.user_id;

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [taggedPosts, setTaggedPosts] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [hasActiveStory, setHasActiveStory] = useState(false);

  const loadData = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      const [profileRes, postsRes, highlightsRes, followersRes, followingRes, taggedRes, storiesRes] = await Promise.all([
        getUserProfile(targetUserId),
        getUserPosts(targetUserId),
        getUserHighlights(targetUserId),
        getFollowers(targetUserId),
        getFollowing(targetUserId),
        getTaggedPosts(targetUserId),
        supabase.from('stories').select('id').eq('user_id', targetUserId).gt('expires_at', new Date().toISOString()).limit(1)
      ]);

      setProfile({
        ...profileRes,
        followers_count: followersRes.length,
        following_count: followingRes.length,
      });
      setPosts(postsRes || []);
      setHighlights(highlightsRes || []);
      setTaggedPosts(taggedRes || []);
      setHasActiveStory((storiesRes.data || []).length > 0);

      // Fetch Reels separately if needed or filter from unified if available
      const { data: reelsRes } = await supabase.from('reels').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false });
      setReels(reelsRes || []);

      if (isOwnProfile) {
        const { data: savedRes } = await supabase.from('saved_collections').select('*, collection_items(*)').eq('user_id', targetUserId);
        // For simplicity, fetching all saved posts across collections or a general one
        setSavedPosts([]); // Placeholder for complex saved logic
      }

    } catch (error) {
      console.error('Error loading profile data:', error);
      Alert.alert('Error', 'Unable to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [targetUserId, isOwnProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleShare = async () => {
    const profileUrl = `https://marb.app/@${profile?.username}`;
    try {
      await Share.share({
        message: `Check out my MARB profile: ${profileUrl}`,
        url: profileUrl,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const renderHeader = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.headerContent}>
          <View style={styles.topRow}>
            <SkeletonBox width={90} height={90} borderRadius={45} />
            <View style={styles.statsRow}>
               <SkeletonBox width={60} height={40} borderRadius={8} />
               <SkeletonBox width={60} height={40} borderRadius={8} />
               <SkeletonBox width={60} height={40} borderRadius={8} />
            </View>
          </View>
          <View style={styles.infoSection}>
             <SkeletonBox width={150} height={24} borderRadius={4} style={{ marginBottom: 10 }} />
             <SkeletonBox width={width - 40} height={16} borderRadius={4} style={{ marginBottom: 5 }} />
             <SkeletonBox width={200} height={16} borderRadius={4} />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.headerContent}>
        {/* 1. PROFILE HEADER TOP */}
        <View style={styles.topRow}>
          <View style={styles.profilePicContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => hasActiveStory && router.push(`/story/view?userId=${targetUserId}`)}
            >
              <LinearGradient
                colors={hasActiveStory ? [Colors.primary, Colors.primaryLight] : ['#333', '#333']}
                style={styles.gradientRing}
              >
                <View style={styles.picInner}>
                  <Image
                    source={{ uri: profile?.avatar_url || 'https://via.placeholder.com/150' }}
                    style={styles.profilePic}
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
            {isOwnProfile && (
              <TouchableOpacity style={styles.addStoryIcon} onPress={() => router.push('/story/create')}>
                <Ionicons name="add-circle" size={24} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.statsRow}>
            <ProfileStat label="Posts" count={posts.length} />
            <ProfileStat label="Followers" count={profile?.followers_count || 0} onPress={() => {}} />
            <ProfileStat label="Following" count={profile?.following_count || 0} onPress={() => {}} />
          </View>
        </View>

        {/* 3. PROFILE NAME & BADGES */}
        <View style={styles.infoSection}>
          <Text style={styles.fullName}>{profile?.full_name || profile?.username}</Text>
          <Text style={styles.username}>@{profile?.username}</Text>

          {/* 4. MARB BADGES */}
          <View style={styles.badgesRow}>
            <ProfileBadge icon="lightning-bolt" text={`${profile?.snap_score || '1.2K'} Snap`} />
            <ProfileBadge icon="fire" text={`${profile?.activity_streak || '7'}d streak`} color="#ff8501" />
            <ProfileBadge icon="emoticon-happy-outline" text={profile?.mood || 'Happy'} color="#4fffb0" />
          </View>

          {/* 5. BIO */}
          {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          {/* 6. PROFILE LINK */}
          <TouchableOpacity style={styles.linkContainer} onPress={() => {}}>
            <Ionicons name="link-outline" size={16} color={Colors.primary} />
            <Text style={styles.link}>marb.app/{profile?.username}</Text>
          </TouchableOpacity>

          {/* 7. PROFILE INFO ROW */}
          <View style={styles.metadataRow}>
             {profile?.location && (
               <View style={styles.metaItem}>
                 <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                 <Text style={styles.metaText}>{profile.location}</Text>
               </View>
             )}
             {profile?.language && (
               <View style={styles.metaItem}>
                 <Ionicons name="globe-outline" size={14} color={Colors.textSecondary} />
                 <Text style={styles.metaText}>{profile.language}</Text>
               </View>
             )}
          </View>
        </View>

        {/* 2. PROFILE ACTION BUTTONS */}
        <View style={styles.actionsRow}>
          {isOwnProfile ? (
            <>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/profile/edit')}>
                <Text style={styles.actionBtnText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                <Text style={styles.actionBtnText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/wallet')}>
                <Text style={[styles.actionBtnText, { color: Colors.primary }]}>₹ MARB Money</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/settings')}>
                <Ionicons name="settings-outline" size={20} color={Colors.text} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
              >
                <Text style={[styles.actionBtnText, { color: '#000' }]}>Follow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push(`/messages/chat?userId=${targetUserId}`)}
              >
                <Text style={styles.actionBtnText}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => initCall(targetUserId, 'voice', profile?.full_name, profile?.avatar_url)}
              >
                <Ionicons name="call-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => initCall(targetUserId, 'video', profile?.full_name, profile?.avatar_url)}
              >
                <Ionicons name="videocam-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 8. PROFILE HIGHLIGHTS */}
        <View style={styles.highlightsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.highlightsContent}
          >
            {isOwnProfile && (
              <TouchableOpacity
                style={styles.highlightItem}
                onPress={() => router.push('/story/highlight-create')}
              >
                <View style={[styles.highlightCircle, { borderStyle: 'dashed', borderColor: Colors.textTertiary }]}>
                  <Ionicons name="add" size={32} color={Colors.text} />
                </View>
                <Text style={styles.highlightTitle}>New</Text>
              </TouchableOpacity>
            )}

            {highlights.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.highlightItem}
                onPress={() => {}}
              >
                <View style={styles.highlightCircle}>
                  <Image source={{ uri: item.cover_url || 'https://via.placeholder.com/100' }} style={styles.highlightImage} />
                </View>
                <Text style={styles.highlightTitle} numberOfLines={1}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 10. ADD A PHOTOSTRIP CTA */}
        {isOwnProfile && posts.length > 0 && (
          <TouchableOpacity style={styles.photostripCTA} onPress={() => {}}>
            <View style={styles.ctaIconCircle}>
               <Ionicons name="add" size={24} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.ctaTitle}>Add a photostrip</Text>
              <Text style={styles.ctaSub}>to highlight your best moments</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* 11. PROFILE MANAGEMENT BUTTONS */}
        <View style={styles.managementRow}>
           <TouchableOpacity style={styles.manageBtn} onPress={() => setActiveTab('saved')}>
              <Ionicons name="bookmark-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.manageBtnText}>Saved</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.manageBtn} onPress={() => router.push('/professional-dashboard/skill-profile')}>
              <Ionicons name="briefcase-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.manageBtnText}>Professional</Text>
           </TouchableOpacity>
        </View>

        {/* 12. PROFILE CONTENT TABS */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'posts' && styles.activeTabItem]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons name="grid-outline" size={22} color={activeTab === 'posts' ? Colors.text : Colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>Posts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'reels' && styles.activeTabItem]}
            onPress={() => setActiveTab('reels')}
          >
            <MaterialCommunityIcons
              name="play-box-outline"
              size={24}
              color={activeTab === 'reels' ? Colors.text : Colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'reels' && styles.activeTabText]}>Reels</Text>
          </TouchableOpacity>
          {isOwnProfile && (
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'saved' && styles.activeTabItem]}
              onPress={() => setActiveTab('saved')}
            >
              <Ionicons name="bookmark-outline" size={22} color={activeTab === 'saved' ? Colors.text : Colors.textSecondary} />
              <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>Saved</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'tagged' && styles.activeTabItem]}
            onPress={() => setActiveTab('tagged')}
          >
            <Ionicons name="person-outline" size={22} color={activeTab === 'tagged' ? Colors.text : Colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'tagged' && styles.activeTabText]}>Tagged</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.reorderBtn}>
             <MaterialCommunityIcons name="reorder-horizontal" size={18} color={Colors.textSecondary} />
             <Text style={styles.reorderText}>Reorder</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    const data = activeTab === 'posts' ? posts : (activeTab === 'reels' ? reels : (activeTab === 'saved' ? savedPosts : taggedPosts));

    if (loading && !refreshing) {
       return (
         <View style={styles.gridContainer}>
           {[1,2,3,4,5,6].map(i => (
             <View key={i} style={[styles.gridPost, { width: GRID_SIZE, height: GRID_SIZE }]}>
                <SkeletonBox width="100%" height="100%" borderRadius={0} />
             </View>
           ))}
         </View>
       );
    }

    return (
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.gridPost, { width: GRID_SIZE, height: GRID_SIZE }]}
            onPress={() => router.push(activeTab === 'reels' ? `/(tabs)/reels` : `/post/${item.id}`)}
          >
            <Image
              source={{ uri: activeTab === 'reels' ? (item.thumbnail_url || item.video_url) : item.media_url }}
              style={styles.gridPostImage}
            />
            {item.is_pinned && (
              <View style={styles.pinIcon}>
                <Ionicons name="pin" size={14} color="#fff" />
              </View>
            )}
            {item.is_verified && <TruthBadge />}
            {activeTab === 'reels' && (
              <View style={styles.reelOverlay}>
                <Ionicons name="play" size={14} color="#fff" />
                <Text style={styles.reelViews}>{item.view_count || '0'}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name={activeTab === 'posts' ? "camera-outline" : (activeTab === 'reels' ? "play-circle-outline" : "bookmark-outline")}
              size={48}
              color={Colors.textTertiary}
            />
            <Text style={styles.emptyText}>No {activeTab} yet</Text>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={[{ id: 'content' }]}
        renderItem={() => renderContent()}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerContent: { paddingBottom: 8 },

  // Header Top
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  profilePicContainer: { position: 'relative', marginRight: 25 },
  gradientRing: { width: 96, height: 92, borderRadius: 48, padding: 3, justifyContent: 'center', alignItems: 'center' },
  picInner: { width: 86, height: 86, borderRadius: 43, backgroundColor: Colors.background, padding: 2 },
  profilePic: { width: '100%', height: '100%', borderRadius: 41 },
  addStoryIcon: { position: 'absolute', bottom: -2, right: -2, backgroundColor: Colors.background, borderRadius: 12 },

  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingRight: 10 },
  statItem: { alignItems: 'center' },
  statCount: { fontSize: 18, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  // Info Section
  infoSection: { paddingHorizontal: 20, marginBottom: 15 },
  fullName: { fontSize: 22, fontWeight: '900', color: Colors.text, marginBottom: 2 },
  username: { fontSize: 14, color: Colors.textSecondary, marginBottom: 12 },

  badgesRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: Colors.text },

  bio: { fontSize: 15, color: Colors.text, lineHeight: 20, marginBottom: 8 },
  linkContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  link: { fontSize: 14, color: Colors.primary, fontWeight: '700' },

  metadataRow: { flexDirection: 'row', gap: 15, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },

  // Actions
  actionsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 25 },
  actionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnText: { fontSize: 14, fontWeight: '800', color: Colors.text },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Highlights
  highlightsWrapper: { marginBottom: 20 },
  highlightsContent: { paddingHorizontal: 20, gap: 18 },
  highlightItem: { alignItems: 'center', width: 70 },
  highlightCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: 3,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  highlightImage: { width: '100%', height: '100%', borderRadius: 32 },
  highlightTitle: { fontSize: 12, color: Colors.text, textAlign: 'center', fontWeight: '600' },

  // Photostrip CTA
  photostripCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 16,
    gap: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ctaIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1.5, borderColor: Colors.primary },
  ctaTitle: { color: Colors.text, fontWeight: '800', fontSize: 15 },
  ctaSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },

  // Management
  managementRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 25 },
  manageBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, borderRadius: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  manageBtnText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    paddingTop: 15,
    marginBottom: 10
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 4, paddingBottom: 10 },
  activeTabItem: { borderBottomWidth: 2, borderBottomColor: Colors.text },
  tabText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  activeTabText: { color: Colors.text },

  reorderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginLeft: 10 },
  reorderText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' },

  // Grid
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  gridPost: { padding: 0.5, position: 'relative' },
  gridPostImage: { width: '100%', height: '100%', backgroundColor: '#1a1a1a' },
  pinIcon: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: 2 },

  truthBadge: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2
  },
  truthText: { color: '#000', fontSize: 8, fontWeight: 'bold' },

  reelOverlay: { position: 'absolute', bottom: 5, left: 5, flexDirection: 'row', alignItems: 'center', gap: 2 },
  reelViews: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  emptyState: { flex: 1, alignItems: 'center', paddingVertical: 80, width: width },
  emptyText: { fontSize: 16, color: Colors.textSecondary, marginTop: 12, fontWeight: '600' },
});

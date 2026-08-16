import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUserProfile,
  toggleFollow
} from '../../utils/supabaseHelpers';
import { supabase } from '../../utils/supabaseConfig';
import { useAuthStore } from '../../store/authStore';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- Components ---

const FilterTab = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.filterTab]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    {active ? (
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.activeTabGradient}
      >
        <Text style={styles.activeTabText}>{label}</Text>
      </LinearGradient>
    ) : (
      <View style={styles.inactiveTabPill}>
        <Text style={styles.inactiveTabText}>{label}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const NotificationItem = ({ item, onRead }: { item: any; onRead: (id: string) => void }) => {
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const getIcon = () => {
    switch (item.type) {
      case 'follow': return { name: 'person-add', color: Colors.primary, type: 'Ionicons' };
      case 'like': return { name: 'heart', color: Colors.error, type: 'Ionicons' };
      case 'comment': return { name: 'chatbubble', color: '#4CAF50', type: 'Ionicons' };
      case 'mention': return { name: 'at', color: '#FF9800', type: 'MaterialCommunityIcons' };
      case 'tip': return { name: 'wallet-outline', color: '#00D9FF', type: 'Ionicons' };
      case 'live': return { name: 'radio', color: Colors.error, type: 'Ionicons' };
      case 'system': return { name: 'information-outline', color: '#888', type: 'MaterialCommunityIcons' };
      case 'message': return { name: 'mail', color: Colors.primary, type: 'Ionicons' };
      case 'story_reply': return { name: 'send', color: '#C13584', type: 'Ionicons' };
      case 'shop_order':
      case 'shop_offer':
      case 'shop_delivery':
        return { name: 'cart', color: '#FFD700', type: 'Ionicons' };
      default: return { name: 'notifications', color: Colors.primary, type: 'Ionicons' };
    }
  };

  const icon = getIcon();

  const handlePress = () => {
    onRead(item.id);
    switch (item.type) {
      case 'follow': router.push(`/profile/${item.actor_id}`); break;
      case 'like':
      case 'comment':
      case 'mention':
        if (item.target_id) {
            if (item.target_type === 'post') router.push(`/post/${item.target_id}`);
            else if (item.target_type === 'reel') router.push(`/(tabs)/reels`); // Simplified navigation
        }
        break;
      case 'message': router.push(`/messages/chat?userId=${item.actor_id}`); break;
      case 'live': router.push(`/live/${item.actor_id}`); break; // Mock
      case 'tip': router.push(`/wallet`); break;
      case 'shop_order':
      case 'shop_delivery':
        router.push(`/shop/orders`); break;
      case 'shop_offer':
        router.push(`/shop`); break;
    }
  };

  const handleFollowBack = async (e: any) => {
    e.stopPropagation();
    const { user: me } = useAuthStore.getState();
    if (!me) return;

    setFollowLoading(true);
    try {
      const isFollowing = await toggleFollow(me.user_id, item.actor_id);
      setFollowing(isFollowing);
    } catch (err) {
      console.error('Follow back error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const renderAction = () => {
    if (item.type === 'follow') {
      return (
        <TouchableOpacity
          style={[styles.followBackButton, following && styles.followingButton]}
          onPress={handleFollowBack}
          disabled={followLoading || following}
        >
          {followLoading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={[styles.followBackText, following && styles.followingText]}>
              {following ? 'Following' : 'Follow back'}
            </Text>
          )}
        </TouchableOpacity>
      );
    }
    if (item.type === 'tip') {
      return (
        <Text style={styles.tipAmount}>₹{item.amount}</Text>
      );
    }
    if (item.target_id) {
       return (
         <View style={styles.postMiniThumb}>
            <Ionicons name={item.target_type === 'reel' ? "play-circle-outline" : "image-outline"} size={20} color={Colors.textTertiary} />
         </View>
       );
    }
    return null;
  };

  const formatTime = (date: string) => {
     try {
       const dist = formatDistanceToNow(new Date(date), { addSuffix: false });
       return dist.replace('about ', '').replace('less than a minute', 'now').replace(' minutes', 'm').replace(' minute', 'm').replace(' hours', 'h').replace(' hour', 'h').replace(' days', 'd').replace(' day', 'd');
     } catch (e) { return ''; }
  };

  return (
    <TouchableOpacity
      style={[styles.itemContainer, !item.is_read && styles.unreadItem]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarWrapper}>
        <Image
          source={{ uri: item.actor?.avatar_url || 'https://via.placeholder.com/100' }}
          style={styles.avatar}
        />
        <View style={[styles.iconBadge, { backgroundColor: icon.color }]}>
          {icon.type === 'Ionicons' ? (
            <Ionicons name={icon.name as any} size={10} color="#fff" />
          ) : (
            <MaterialCommunityIcons name={icon.name as any} size={10} color="#fff" />
          )}
        </View>
      </View>

      <View style={styles.itemContent}>
        <Text style={styles.itemText} numberOfLines={3}>
          <Text style={styles.actorName}>{item.actor?.username || 'Someone'}</Text>
          {' '}
          {item.type === 'follow' && 'started following you'}
          {item.type === 'like' && 'liked your post'}
          {item.type === 'comment' && `commented on your post: "${item.text}"`}
          {item.type === 'mention' && 'mentioned you in a post'}
          {item.type === 'tip' && `tipped you ₹${item.amount} on your post`}
          {item.type === 'live' && 'started a live video'}
          {item.type === 'message' && `sent you a message: "${item.text}"`}
          {item.type === 'story_reply' && `replied to your story: "${item.text}"`}
          {item.type === 'story_question' && `answered your story question: "${item.text}"`}
          {item.type === 'shop_order' && `Order #${item.order_id || ''} has been placed successfully!`}
          {item.type === 'shop_delivery' && `Your package for Order #${item.order_id || ''} is out for delivery!`}
          {item.type === 'shop_offer' && `Special Offer: ${item.text || 'Check out today\'s deals!'}`}
          {' '}
          <Text style={styles.itemTime}>{formatTime(item.created_at)}</Text>
        </Text>
      </View>

      {renderAction()}

      {!item.is_read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );
};

// --- Main Screen ---

export default function NotificationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveTab] = useState((params.filter as string) || 'All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const filters = ['All', 'Follows', 'Likes', 'Comments', 'Mentions', 'Tips', 'Live', 'Shop', 'System'];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, count] = await Promise.all([
        getNotifications(100),
        getUnreadNotificationsCount()
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    if (!supabase || !user) return;

    // Real-time listener for new notifications
    const channel = supabase
      .channel(`user-notifications-${user.user_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.user_id}`,
        },
        async (payload) => {
          console.log('New notification received:', payload.new);

          // Fetch actor profile for the new notification
          const actorProfile = await getUserProfile(payload.new.actor_id);
          const newNotif = {
              ...payload.new,
              actor: actorProfile
          };

          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Optional: Vibrate or show local alert if user is not on this screen
          // (But since this is the screen itself, we just add it to list)
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData, user?.user_id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('Mark all read error:', error);
    }
  };

  const handleRead = async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.is_read) {
      await markNotificationAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const filteredData = useMemo(() => {
    if (activeFilter === 'All') return notifications;
    const typeMap: Record<string, string[]> = {
      'Follows': ['follow'],
      'Likes': ['like'],
      'Comments': ['comment'],
      'Mentions': ['mention'],
      'Tips': ['tip'],
      'Live': ['live'],
      'Shop': ['shop_order', 'shop_offer', 'shop_delivery'],
      'System': ['system'],
    };
    const types = typeMap[activeFilter] || [];
    return notifications.filter(n => types.includes(n.type));
  }, [notifications, activeFilter]);

  const groupedData = useMemo(() => {
    const sections: { title: string; data: any[] }[] = [];
    const today: any[] = [];
    const yesterday: any[] = [];
    const earlier: any[] = [];

    filteredData.forEach(item => {
      const date = new Date(item.created_at);
      if (isToday(date)) today.push(item);
      else if (isYesterday(date)) yesterday.push(item);
      else earlier.push(item);
    });

    if (today.length > 0) sections.push({ title: 'TODAY', data: today });
    if (yesterday.length > 0) sections.push({ title: 'YESTERDAY', data: yesterday });
    if (earlier.length > 0) sections.push({ title: 'EARLIER', data: earlier });

    return sections;
  }, [filteredData]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={28} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.titleWrapper}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity onPress={handleMarkAllRead} style={styles.markReadBtn}>
           <Text style={styles.markReadText}>✓✓ Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Filters */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        >
          {filters.map(f => (
            <FilterTab
              key={f}
              label={f}
              active={activeFilter === f}
              onPress={() => setActiveTab(f)}
            />
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={groupedData}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{item.title}</Text>
            </View>
            {item.data.map(notif => (
              <NotificationItem key={notif.id} item={notif} onRead={handleRead} />
            ))}
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.primary} size="large" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
               <Feather name="bell-off" size={64} color={Colors.textTertiary} />
               <Text style={styles.emptyText}>No notifications yet</Text>
               <Text style={styles.emptySubtext}>We'll notify you when something important happens.</Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  titleWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.text },
  badgeContainer: {
    backgroundColor: Colors.error,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  markReadBtn: { padding: 4 },
  markReadText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },

  // Filters
  filtersWrapper: { paddingVertical: 12 },
  filtersList: { paddingHorizontal: 16, gap: 10 },
  filterTab: { height: 38, borderRadius: 19, overflow: 'hidden' },
  activeTabGradient: { flex: 1, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center' },
  activeTabText: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  inactiveTabPill: { flex: 1, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  inactiveTabText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },

  // List
  listContent: { paddingBottom: 50 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },
  sectionTitle: { color: Colors.textSecondary, fontSize: 12, fontWeight: '900', letterSpacing: 1 },

  // Item
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12
  },
  unreadItem: { backgroundColor: 'rgba(0, 217, 255, 0.03)' },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: Colors.surface },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background
  },
  itemContent: { flex: 1 },
  itemText: { color: Colors.text, fontSize: 14, lineHeight: 19 },
  actorName: { fontWeight: 'bold' },
  itemTime: { color: Colors.textTertiary, fontSize: 12 },

  // Actions
  followBackButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 8
  },
  followBackText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  followingButton: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  followingText: { color: Colors.textSecondary },
  tipAmount: { color: '#4CAF50', fontWeight: 'bold', fontSize: 15 },
  postMiniThumb: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center'
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 4
  },

  // State
  loadingContainer: { paddingTop: 40 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, paddingHorizontal: 40 },
  emptyText: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  emptySubtext: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

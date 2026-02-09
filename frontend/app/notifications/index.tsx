import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n => 
        n.notification_id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return { name: 'heart', color: Colors.error };
      case 'comment':
        return { name: 'chatbubble', color: Colors.primary };
      case 'follow':
        return { name: 'person-add', color: Colors.primary };
      case 'message':
        return { name: 'mail', color: Colors.primary };
      default:
        return { name: 'notifications', color: Colors.primary };
    }
  };

  const renderNotification = ({ item }) => {
    const icon = getNotificationIcon(item.type);
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.read && styles.unreadNotification,
        ]}
        activeOpacity={0.7}
        onPress={() => markAsRead(item.notification_id)}
      >
        <View style={styles.notificationLeft}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: item.from_user?.picture || 'https://via.placeholder.com/100' }}
              style={styles.avatar}
            />
            <View style={[styles.notificationIconBadge, { backgroundColor: icon.color }]}>
              <Ionicons name={icon.name} size={14} color={Colors.text} />
            </View>
          </View>
          
          <View style={styles.notificationContent}>
            <Text style={styles.notificationText}>
              <Text style={styles.username}>{item.from_user?.name}</Text>
              {' '}
              <Text style={styles.actionText}>{item.text}</Text>
            </Text>
            <Text style={styles.timestamp}>2h ago</Text>
          </View>
        </View>

        {item.type === 'like' && item.post_id && (
          <View style={styles.postThumbnail}>
            <View style={styles.thumbnailPlaceholder}>
              <Ionicons name="image" size={24} color={Colors.textSecondary} />
            </View>
          </View>
        )}

        {item.type === 'follow' && (
          <TouchableOpacity style={styles.followButton}>
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        )}

        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>New</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.notification_id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
              style={styles.emptyIconGradient}
            >
              <Ionicons name="notifications-outline" size={48} color={Colors.background} />
            </LinearGradient>
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>When someone likes or comments on your posts, you'll see it here</Text>
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
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  unreadNotification: {
    backgroundColor: Colors.cardBackground,
  },
  notificationLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  notificationIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 18,
  },
  username: {
    fontWeight: '600',
    color: Colors.text,
  },
  actionText: {
    color: Colors.textSecondary,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  postThumbnail: {
    marginLeft: 12,
  },
  thumbnailPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.background,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 32,
  },
  emptyIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

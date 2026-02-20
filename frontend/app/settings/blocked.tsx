import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';

export default function BlockedAccountsScreen() {
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      const response = await api.get('/users/me/blocked');
      setBlockedUsers(response.data || []);
    } catch (error) {
      console.error('Error loading blocked users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = (userId, username) => {
    Alert.alert(
      'Unblock ' + username + '?',
      'They will be able to see your posts and stories, and send you messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              await api.post('/users/' + userId + '/unblock');
              setBlockedUsers(blockedUsers.filter(u => u.user_id !== userId));
            } catch (error) {
              console.error('Error unblocking user:', error);
            }
          },
        },
      ]
    );
  };

  const getUserPic = (item) => {
    if (item.picture) {
      if (item.picture.startsWith('http')) return item.picture;
      return 'data:image/jpeg;base64,' + item.picture;
    }
    return 'https://via.placeholder.com/100';
  };

  const renderUser = ({ item }) => (
    <View style={styles.userItem}>
      <Image source={{ uri: getUserPic(item) }} style={styles.userImage} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.username}</Text>
        <Text style={styles.userFullName}>{item.name}</Text>
      </View>
      <TouchableOpacity 
        style={styles.unblockButton}
        onPress={() => handleUnblock(item.user_id, item.username)}
      >
        <Text style={styles.unblockText}>Unblock</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blocked accounts</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={blockedUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.infoText}>
            You can block people anytime from their profiles. They won't be notified when you block them.
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="ban-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No blocked accounts</Text>
            <Text style={styles.emptyText}>
              When you block someone, they won't be able to find your profile, posts, or stories.
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
  listContent: {
    paddingBottom: 100,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    padding: 16,
    lineHeight: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  userFullName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  unblockButton: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unblockText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
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

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

export default function RestrictedAccountsScreen() {
  const router = useRouter();
  const [restrictedUsers, setRestrictedUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRestrictedUsers();
  }, []);

  const loadRestrictedUsers = async () => {
    try {
      const response = await api.get('/users/me/restricted');
      setRestrictedUsers(response.data || []);
    } catch (error) {
      console.error('Error loading restricted users:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRestrictedUsers();
    setRefreshing(false);
  };

  const unrestrictUser = async (userId) => {
    Alert.alert(
      'Unrestrict Account',
      'Are you sure you want to unrestrict this account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unrestrict',
          onPress: async () => {
            try {
              await api.delete('/users/' + userId + '/restrict');
              setRestrictedUsers(restrictedUsers.filter(u => u.user_id !== userId));
            } catch (error) {
              console.error('Error unrestricting user:', error);
            }
          },
        },
      ]
    );
  };

  const getUserPic = (item) => {
    if (item?.picture) {
      if (item.picture.startsWith('http')) return item.picture;
      return 'data:image/jpeg;base64,' + item.picture;
    }
    return 'https://via.placeholder.com/100';
  };

  const renderUser = ({ item }) => (
    <View style={styles.userItem}>
      <TouchableOpacity 
        style={styles.userInfo}
        onPress={() => router.push('/profile?userId=' + item.user_id)}
      >
        <Image source={{ uri: getUserPic(item) }} style={styles.userImage} />
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userUsername}>@{item.username}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.unrestrictButton}
        onPress={() => unrestrictUser(item.user_id)}
      >
        <Text style={styles.unrestrictButtonText}>Unrestrict</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Restricted Accounts</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Ionicons name="shield-checkmark" size={20} color={Colors.textSecondary} />
        <Text style={styles.infoText}>
          Restricted accounts can still see your posts, but their comments will only be visible to them. They won't know when you're online or if you've read their messages.
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={restrictedUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.user_id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="shield-outline" size={48} color={Colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No restricted accounts</Text>
            <Text style={styles.emptyText}>
              When you restrict someone, they won't know. It's a subtle way to protect yourself.
            </Text>
          </View>
        }
        contentContainerStyle={restrictedUsers.length === 0 ? styles.emptyList : null}
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
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  userUsername: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  unrestrictButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unrestrictButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
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
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

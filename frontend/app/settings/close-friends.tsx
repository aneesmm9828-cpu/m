import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';

export default function CloseFriendsScreen() {
  const router = useRouter();
  const [closeFriends, setCloseFriends] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState('list'); // 'list' or 'search'

  useEffect(() => {
    loadCloseFriends();
  }, []);

  const loadCloseFriends = async () => {
    try {
      const response = await api.get('/users/me/close-friends');
      setCloseFriends(response.data || []);
    } catch (error) {
      console.error('Error loading close friends:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCloseFriends();
    setRefreshing(false);
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await api.get('/users/search/' + encodeURIComponent(query));
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.length > 0) {
      setActiveView('search');
      searchUsers(text);
    } else {
      setActiveView('list');
      setSearchResults([]);
    }
  };

  const addToCloseFriends = async (userId) => {
    try {
      await api.post('/users/' + userId + '/close-friends');
      await loadCloseFriends();
      setSearchQuery('');
      setSearchResults([]);
      setActiveView('list');
    } catch (error) {
      console.error('Error adding close friend:', error);
    }
  };

  const removeFromCloseFriends = async (userId) => {
    Alert.alert(
      'Remove Close Friend',
      'Are you sure you want to remove this person from your close friends?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/users/' + userId + '/close-friends');
              setCloseFriends(closeFriends.filter(f => f.user_id !== userId));
            } catch (error) {
              console.error('Error removing close friend:', error);
            }
          },
        },
      ]
    );
  };

  const isCloseFriend = (userId) => {
    return closeFriends.some(f => f.user_id === userId);
  };

  const getUserPic = (item) => {
    if (item?.picture) {
      if (item.picture.startsWith('http')) return item.picture;
      return 'data:image/jpeg;base64,' + item.picture;
    }
    return 'https://via.placeholder.com/100';
  };

  const renderFriend = ({ item }) => (
    <View style={styles.friendItem}>
      <Image source={{ uri: getUserPic(item) }} style={styles.friendImage} />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendUsername}>@{item.username}</Text>
      </View>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeFromCloseFriends(item.user_id)}
      >
        <Ionicons name="close-circle" size={24} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );

  const renderSearchResult = ({ item }) => {
    const isInList = isCloseFriend(item.user_id);
    
    return (
      <View style={styles.friendItem}>
        <Image source={{ uri: getUserPic(item) }} style={styles.friendImage} />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.friendUsername}>@{item.username}</Text>
        </View>
        {isInList ? (
          <View style={styles.addedBadge}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => addToCloseFriends(item.user_id)}
          >
            <Ionicons name="add-circle" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Close Friends</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <View style={styles.infoIcon}>
          <Ionicons name="star" size={20} color="#00d9ff" />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Share stories with close friends</Text>
          <Text style={styles.infoText}>
            Only people you add to your close friends list can see stories you share with them.
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {activeView === 'list' ? (
        <FlatList
          data={closeFriends}
          renderItem={renderFriend}
          keyExtractor={(item) => item.user_id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            closeFriends.length > 0 ? (
              <Text style={styles.sectionTitle}>Your close friends ({closeFriends.length})</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="star-outline" size={48} color={Colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>No close friends yet</Text>
              <Text style={styles.emptyText}>
                Search for people to add to your close friends list
              </Text>
            </View>
          }
          contentContainerStyle={closeFriends.length === 0 ? styles.emptyList : null}
        />
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.user_id}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>Search results</Text>
          }
          ListEmptyComponent={
            searchQuery.length > 0 ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No users found</Text>
              </View>
            ) : null
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00d9ff20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  friendImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  friendUsername: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    padding: 4,
  },
  addedBadge: {
    padding: 4,
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
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});

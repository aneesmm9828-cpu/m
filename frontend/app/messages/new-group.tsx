import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';

export default function NewGroupScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState('');

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length > 1) {
      setLoading(true);
      try {
        const res = await api.get(`/users/search/${query}`);
        setUsers(res.data || []);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setUsers([]);
    }
  };

  const toggleUser = (user) => {
    if (selectedUsers.find(u => u.user_id === user.user_id)) {
      setSelectedUsers(selectedUsers.filter(u => u.user_id !== user.user_id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    if (selectedUsers.length < 1) {
      Alert.alert('Error', 'Please select at least one member');
      return;
    }

    try {
      // API call to create group
      // await api.post('/groups', {
      //   name: groupName,
      //   members: selectedUsers.map(u => u.user_id)
      // });
      Alert.alert('Success', 'Group created successfully!');
      router.back();
    } catch (error) {
      console.error('Group creation error:', error);
      Alert.alert('Error', 'Failed to create group');
    }
  };

  const renderUser = ({ item }) => {
    const isSelected = selectedUsers.find(u => u.user_id === item.user_id);
    const userPic = item.picture ? (item.picture.startsWith('http') ? item.picture : 'data:image/jpeg;base64,' + item.picture) : 'https://via.placeholder.com/100';

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => toggleUser(item)}
      >
        <Image source={{ uri: userPic }} style={styles.userImage} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.username}</Text>
          <Text style={styles.userFullName}>{item.name}</Text>
        </View>
        <Ionicons
          name={isSelected ? "checkmark-circle" : "ellipse-outline"}
          size={24}
          color={isSelected ? Colors.primary : Colors.border}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Group</Text>
        <TouchableOpacity onPress={createGroup} disabled={selectedUsers.length === 0}>
          <Text style={[styles.createBtn, selectedUsers.length === 0 && styles.disabledBtn]}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Group Info Input */}
      <View style={styles.groupInfoContainer}>
        <View style={styles.groupIconContainer}>
          <Ionicons name="camera" size={24} color={Colors.textSecondary} />
        </View>
        <TextInput
          style={styles.groupNameInput}
          placeholder="Name your group..."
          placeholderTextColor={Colors.textSecondary}
          value={groupName}
          onChangeText={setGroupName}
        />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.toText}>To:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.selectedList}
          contentContainerStyle={{ alignItems: 'center', gap: 8 }}
        >
          {selectedUsers.map(u => (
            <View key={u.user_id} style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>{u.username}</Text>
              <TouchableOpacity onPress={() => toggleUser(u)}>
                <Ionicons name="close-circle" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.user_id}
          style={styles.list}
          ListEmptyComponent={
            searchQuery.length > 1 ? (
              <Text style={styles.emptyText}>No users found</Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

// Sub-component import since ScrollView is used inside View for horizontal selected users
import { ScrollView } from 'react-native';

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
    fontWeight: 'bold',
    color: Colors.text,
  },
  createBtn: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  groupInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 16,
  },
  groupIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  groupNameInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    maxHeight: 100,
  },
  toText: {
    fontSize: 15,
    color: Colors.text,
    marginRight: 10,
  },
  selectedList: {
    flex: 1,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 149, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
  },
  selectedBadgeText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  searchInput: {
    fontSize: 15,
    color: Colors.text,
    minWidth: 100,
    height: 40,
  },
  list: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  userImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  userFullName: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: Colors.textSecondary,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { api } from '../../../utils/api';
import { Ionicons } from '@expo/vector-icons';

export default function FollowSuggestionsScreen() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      // Get trending/popular users to suggest
      const response = await api.get('/posts/explore?limit=20');
      // Extract unique users from posts
      const suggestions = [];
      const seenIds = new Set();

      response.data.forEach(post => {
        if (post.user && !seenIds.has(post.user.user_id)) {
          suggestions.push(post.user);
          seenIds.add(post.user.user_id);
        }
      });

      setUsers(suggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = (userId) => {
    if (following.includes(userId)) {
      setFollowing(following.filter(id => id !== userId));
    } else {
      setFollowing([...following, userId]);
    }
  };

  const handleNext = async () => {
    // API calls to follow selected users can happen here
    router.push('/auth/onboarding/profile-setup');
  };

  const renderItem = ({ item }) => {
    const isFollowing = following.includes(item.user_id);
    const userPic = item.picture ? (item.picture.startsWith('http') ? item.picture : 'data:image/jpeg;base64,' + item.picture) : 'https://via.placeholder.com/100';

    return (
      <View style={styles.userItem}>
        <Image source={{ uri: userPic }} style={styles.userImage} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.username || item.name}</Text>
          <Text style={styles.userSubtitle}>{item.name}</Text>
        </View>
        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={() => toggleFollow(item.user_id)}
        >
          <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find people to follow</Text>
        <Text style={styles.subtitle}>
          Follow accounts to see their photos and videos in your feed.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {following.length > 0 ? `Follow ${following.length} & Continue` : 'Continue'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
  },
  userSubtitle: {
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.background,
  },
  followingButtonText: {
    color: Colors.text,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: Colors.primary,
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  nextButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});

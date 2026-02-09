import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { api } from '../../../utils/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function StoryViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [story, setStory] = useState(null);
  const [user, setUser] = useState(null);
  const storyId = params.storyId as string;

  useEffect(() => {
    loadStory();
  }, [storyId]);

  const loadStory = async () => {
    try {
      // Get user stories
      const userId = params.userId as string;
      const storiesRes = await api.get(`/stories/user/${userId}`);
      const userRes = await api.get(`/users/${userId}`);
      
      if (storiesRes.data && storiesRes.data.length > 0) {
        setStory(storiesRes.data[0]);
        setUser(userRes.data);
      }
    } catch (error) {
      console.error('Error loading story:', error);
    }
  };

  if (!story) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Story Image */}
      <Image
        source={{ uri: `data:image/jpeg;base64,${story.image}` }}
        style={styles.storyImage}
        resizeMode="contain"
      />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
        
        <View style={styles.userInfo}>
          <Image
            source={{ uri: user?.picture || 'https://via.placeholder.com/100' }}
            style={styles.userImage}
          />
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.storyTime}>2h ago</Text>
          
          <View style={styles.spacer} />
          
          <TouchableOpacity>
            <Ionicons name="pause" size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="volume-high" size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <View style={styles.replyContainer}>
          <Ionicons name="happy-outline" size={28} color={Colors.text} />
          <Text style={styles.replyText}>Send message</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="paper-plane-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  storyImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: Colors.text,
    borderRadius: 1.5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.text,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  storyTime: {
    fontSize: 13,
    color: Colors.text,
    opacity: 0.7,
  },
  spacer: {
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  replyContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.text,
  },
  replyText: {
    fontSize: 15,
    color: Colors.text,
  },
});

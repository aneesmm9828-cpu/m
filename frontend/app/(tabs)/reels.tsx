import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ReelsScreen() {
  const { user } = useAuthStore();
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      const response = await api.get('/reels');
      setReels(response.data);
    } catch (error) {
      console.error('Error loading reels:', error);
    }
  };

  const handleLike = async (reelId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await api.post(`/reels/${reelId}/unlike`);
      } else {
        await api.post(`/reels/${reelId}/like`);
      }
      // Update local state
      setReels(reels.map(reel => {
        if (reel.reel_id === reelId) {
          const likes = isLiked
            ? reel.likes.filter(id => id !== user?.user_id)
            : [...reel.likes, user?.user_id];
          return { ...reel, likes };
        }
        return reel;
      }));
    } catch (error) {
      console.error('Error liking reel:', error);
    }
  };

  const renderReel = ({ item, index }) => {
    const isLiked = item.likes?.includes(user?.user_id);
    const isActive = index === currentIndex;

    return (
      <View style={styles.reelContainer}>
        {/* Video Player */}
        <Video
          source={{ uri: `data:video/mp4;base64,${item.video}` }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isActive}
          isLooping
          isMuted={false}
        />

        {/* Top Bar */}
        <View style={styles.topBar}>
          <Text style={styles.tabText}>Reels</Text>
          <View style={styles.tabDivider} />
          <Text style={[styles.tabText, styles.tabTextInactive]}>Friends</Text>
        </View>

        {/* Right Side Actions */}
        <View style={styles.rightActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLike(item.reel_id, isLiked)}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={32} 
              color={isLiked ? Colors.error : Colors.text} 
            />
            <Text style={styles.actionText}>{item.likes?.length || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={28} color={Colors.text} />
            <Text style={styles.actionText}>{item.comments?.length || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={28} color={Colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="bookmark-outline" size={28} color={Colors.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="ellipsis-vertical" size={24} color={Colors.text} />
          </TouchableOpacity>

          <Image
            source={{ uri: item.user?.picture || 'https://via.placeholder.com/100' }}
            style={styles.userAvatar}
          />
        </View>

        {/* Bottom Info */}
        <View style={styles.bottomInfo}>
          <View style={styles.userInfo}>
            <Text style={styles.username}>@{item.user?.username || item.user?.name}</Text>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </View>
          {item.caption && (
            <Text style={styles.caption} numberOfLines={2}>
              {item.caption}
            </Text>
          )}
          <View style={styles.musicInfo}>
            <Ionicons name="musical-notes" size={16} color={Colors.text} />
            <Text style={styles.musicText}>Original audio</Text>
          </View>
        </View>
      </View>
    );
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        ref={flatListRef}
        data={reels}
        renderItem={renderReel}
        keyExtractor={(item) => item.reel_id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="play-circle-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No reels yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  reelContainer: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  topBar: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  tabTextInactive: {
    opacity: 0.5,
  },
  tabDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.text,
    opacity: 0.3,
  },
  rightActions: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    alignItems: 'center',
    gap: 24,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 4,
    fontWeight: '600',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.text,
    marginTop: 12,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 80,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 12,
  },
  followButton: {
    borderWidth: 1,
    borderColor: Colors.text,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  caption: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 18,
  },
  musicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  musicText: {
    fontSize: 13,
    color: Colors.text,
  },
  emptyContainer: {
    flex: 1,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
});

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
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { Colors } from '../../constants/colors';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabaseConfig';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ShortsScreen() {
  const router = useRouter();
  const [shorts, setShorts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadShorts();
  }, []);

  const loadShorts = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // Fetching from 'reels' table or 'posts' where type is video
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (id, username, full_name, avatar_url)
        `)
        .eq('media_type', 'video')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setShorts(data.map(short => ({
        ...short,
        video: short.media_url,
        user: {
          user_id: short.profiles.id,
          username: short.profiles.username,
          picture: short.profiles.avatar_url
        }
      })));
    } catch (error) {
      console.error('Error loading shorts:', error);
    } finally {
      setLoading(false);
    }
  };

  const ShortItem = ({ item, index }) => {
    const videoRef = useRef(null);
    const isActive = index === currentIndex;

    return (
      <View style={styles.shortContainer}>
        <Video
          ref={videoRef}
          source={{ uri: item.video }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isActive}
          isLooping
          isMuted={false}
        />

        {/* Bottom Info Overlay */}
        <View style={styles.bottomOverlay}>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: item.user?.picture || 'https://via.placeholder.com/100' }}
              style={styles.avatar}
            />
            <Text style={styles.username}>@{item.user?.username}</Text>
            <TouchableOpacity style={styles.subscribeBtn}>
              <Text style={styles.subscribeText}>Subscribe</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text>

          {/* Sound / Remix Attribution */}
          <View style={styles.soundRow}>
            <Ionicons name="musical-notes" size={16} color="#fff" />
            <Text style={styles.soundText} numberOfLines={1}>
              {item.user?.username}'s original sound
            </Text>
          </View>
        </View>

        {/* Right Action Bar */}
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="thumbs-up" size={32} color="#fff" />
            <Text style={styles.actionLabel}>12K</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="thumbs-down" size={32} color="#fff" />
            <Text style={styles.actionLabel}>Dislike</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="chatbubble-ellipses" size={30} color="#fff" />
            <Text style={styles.actionLabel}>450</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="arrow-redo" size={32} color="#fff" />
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <MaterialCommunityIcons name="sync" size={30} color="#fff" />
            <Text style={styles.actionLabel}>Remix</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.soundDisc}>
             <Image
              source={{ uri: item.user?.picture || 'https://via.placeholder.com/100' }}
              style={styles.discImage}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.topRight}>
          <TouchableOpacity style={styles.topIcon}>
            <Ionicons name="search" size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topIcon}>
            <Ionicons name="camera-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topIcon}>
            <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={shorts}
        renderItem={({ item, index }) => <ShortItem item={item} index={index} />}
        keyExtractor={(item) => item.id.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  shortContainer: { height: SCREEN_HEIGHT, width: SCREEN_WIDTH },
  video: { ...StyleSheet.absoluteFillObject },

  topNav: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  topIcon: { padding: 4 },

  bottomOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 80,
    zIndex: 5,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#fff' },
  username: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  subscribeBtn: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18 },
  subscribeText: { color: '#000', fontSize: 13, fontWeight: 'bold' },
  caption: { color: '#fff', fontSize: 14, marginBottom: 12 },
  soundRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  soundText: { color: '#fff', fontSize: 13 },

  rightActions: {
    position: 'absolute',
    right: 12,
    bottom: 60,
    alignItems: 'center',
    gap: 24,
    zIndex: 5,
  },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionLabel: { color: '#fff', fontSize: 12, fontWeight: '500' },
  soundDisc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  discImage: { width: 24, height: 24, borderRadius: 12 },
});

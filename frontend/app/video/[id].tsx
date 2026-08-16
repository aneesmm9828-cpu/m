import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Colors } from '../../constants/colors';
import { supabase } from '../../utils/supabaseConfig';
import { getFeedPosts } from '../../utils/supabaseHelpers';
import VideoCard from '../../components/VideoCard';

const { width } = Dimensions.get('window');

export default function VideoWatchScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [videoData, setVideoData] = useState<any>(null);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [chapters, setChapters] = useState<any[]>([]);

  const videoRef = useRef<Video>(null);
  const controlsTimeout = useRef<any>(null);

  useEffect(() => {
    loadVideoData();
    loadRelatedVideos();
  }, [id]);

  useEffect(() => {
    if (videoData?.description) {
      parseChapters(videoData.description);
    }
  }, [videoData]);

  const parseChapters = (desc: string) => {
    const regex = /(\d{1,2}:\d{2})\s+(.+)/g;
    let match;
    const foundChapters = [];
    while ((match = regex.exec(desc)) !== null) {
      foundChapters.push({ time: match[1], title: match[2] });
    }
    setChapters(foundChapters);
  };

  const loadVideoData = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (id, username, full_name, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setVideoData({
        ...data,
        user: {
          user_id: data.profiles.id,
          username: data.profiles.username,
          name: data.profiles.full_name,
          picture: data.profiles.avatar_url
        }
      });
    } catch (error) {
      console.error('Error loading video:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedVideos = async () => {
    const posts = await getFeedPosts(10);
    setRelatedVideos(posts.filter(p => p.id !== id));
  };

  const toggleControls = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleDoubleTap = (side: 'left' | 'right') => {
    if (!videoRef.current) return;
    videoRef.current.getStatusAsync().then((status: any) => {
      const newPos = side === 'left' ? status.positionMillis - 10000 : status.positionMillis + 10000;
      videoRef.current?.setPositionAsync(Math.max(0, newPos));
    });
  };

  const renderSpeedMenu = () => (
    <Modal
      visible={showSpeedMenu}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSpeedMenu(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSpeedMenu(false)}
      >
        <View style={styles.menuContent}>
          <Text style={styles.menuHeader}>Playback Speed</Text>
          {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
            <TouchableOpacity
              key={speed}
              style={styles.menuItem}
              onPress={() => {
                setPlaybackSpeed(speed);
                setShowSpeedMenu(false);
              }}
            >
              <Text style={[styles.menuText, playbackSpeed === speed && { color: Colors.primary }]}>
                {speed === 1.0 ? 'Normal' : speed + 'x'}
              </Text>
              {playbackSpeed === speed && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Video Player Section */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={toggleControls}
        style={styles.playerContainer}
      >
        <Video
          ref={videoRef}
          source={{ uri: videoData.media_url }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={isPlaying}
          isMuted={isMuted}
          rate={playbackSpeed}
          shouldCorrectPitch={true}
          onPlaybackStatusUpdate={(status: any) => {
            if (status.didJustFinish) setIsPlaying(false);
          }}
        />

        {showControls && (
          <View style={styles.controlsOverlay}>
            <View style={styles.topControls}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="chevron-down" size={28} color="#fff" />
              </TouchableOpacity>
              <View style={styles.topRightControls}>
                <TouchableOpacity style={styles.controlIcon}>
                  <MaterialCommunityIcons name="cast" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlIcon} onPress={() => setShowSpeedMenu(true)}>
                  <Ionicons name="settings-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.midControls}>
              <TouchableOpacity onPress={() => handleDoubleTap('left')}>
                <Ionicons name="play-back" size={40} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playPauseButton}
                onPress={() => setIsPlaying(!isPlaying)}
              >
                <Ionicons name={isPlaying ? "pause" : "play"} size={50} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleDoubleTap('right')}>
                <Ionicons name="play-forward" size={40} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.bottomControls}>
              <Text style={styles.timeText}>0:00 / 10:05</Text>
              <TouchableOpacity onPress={() => setIsMuted(!isMuted)}>
                <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity>
                <MaterialCommunityIcons name="fullscreen" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Video Details Section */}
      <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.metaData}>
          <Text style={styles.title}>{videoData.caption || 'Untitled Video'}</Text>
          <Text style={styles.views}>12K views • 2 days ago</Text>
        </View>

        {/* Chapters Section */}
        {chapters.length > 0 && (
          <View style={styles.chaptersContainer}>
            <Text style={styles.chaptersHeader}>Chapters</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chaptersList}>
              {chapters.map((chap, idx) => (
                <TouchableOpacity key={idx} style={styles.chapterBtn}>
                  <Text style={styles.chapterTime}>{chap.time}</Text>
                  <Text style={styles.chapterTitle} numberOfLines={1}>{chap.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="thumbs-up-outline" size={24} color={Colors.text} />
            <Text style={styles.actionLabel}>1.2K</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="thumbs-down-outline" size={24} color={Colors.text} />
            <Text style={styles.actionLabel}>Dislike</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="share-social-outline" size={24} color={Colors.text} />
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="download-outline" size={24} color={Colors.text} />
            <Text style={styles.actionLabel}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="add-circle-outline" size={24} color={Colors.text} />
            <Text style={styles.actionLabel}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.channelRow}
          onPress={() => router.push({ pathname: '/channel/[id]', params: { id: videoData.user?.user_id } })}
        >
          <Image source={{ uri: videoData.user?.picture || 'https://via.placeholder.com/100' }} style={styles.avatar} />
          <View style={styles.channelInfo}>
            <Text style={styles.channelName}>{videoData.user?.username}</Text>
            <Text style={styles.subCount}>45K subscribers</Text>
          </View>
          <TouchableOpacity style={styles.subscribeBtn}>
            <Text style={styles.subscribeText}>SUBSCRIBE</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Comments Preview */}
        <TouchableOpacity
          style={styles.commentsPreview}
          onPress={() => router.push({ pathname: '/post/[id]', params: { id: videoData.id } })}
        >
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <Text style={styles.commentsCount}>245</Text>
            <View style={styles.sortContainer}>
              <Text style={styles.sortText}>Top</Text>
              <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
            </View>
          </View>

          <View style={styles.pinnedComment}>
            <View style={styles.pinnedHeader}>
              <Ionicons name="pin" size={12} color={Colors.textSecondary} />
              <Text style={styles.pinnedText}>Pinned by {videoData.user?.username}</Text>
            </View>
            <View style={styles.commentItem}>
              <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.miniAvatar} />
              <View style={styles.commentContent}>
                <Text style={styles.commentText} numberOfLines={2}>
                  <Text style={styles.commentUser}>Amit: </Text>
                  Welcome to the MARB Video Hub! This is a pinned message to show engagement features.
                </Text>
                <View style={styles.engagementRow}>
                  <Ionicons name="heart" size={14} color={Colors.error} />
                  <Text style={styles.heartText}>Liked by creator</Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Related Videos */}
        <View style={styles.relatedContainer}>
          {relatedVideos.map((item) => (
            <VideoCard
              key={item.id}
              item={item}
              onPress={() => router.push({ pathname: '/video/[id]', params: { id: item.id } })}
            />
          ))}
        </View>
      </ScrollView>
      {renderSpeedMenu()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  playerContainer: { width: width, height: width * 0.56, backgroundColor: '#000' },
  video: { width: '100%', height: '100%' },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
    padding: 12,
  },
  topControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topRightControls: { flexDirection: 'row', gap: 20 },
  controlIcon: { padding: 4 },
  midControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40 },
  playPauseButton: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  bottomControls: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 20 },
  timeText: { color: '#fff', fontSize: 12, flex: 1 },

  detailsContainer: { flex: 1 },
  metaData: { padding: 12 },
  title: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  views: { color: Colors.textSecondary, fontSize: 13 },

  chaptersContainer: { padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 12, borderRadius: 12, marginBottom: 12 },
  chaptersHeader: { color: Colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  chaptersList: { gap: 12 },
  chapterBtn: { width: 120, backgroundColor: Colors.surface, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  chapterTime: { color: Colors.primary, fontSize: 12, fontWeight: 'bold' },
  chapterTitle: { color: Colors.text, fontSize: 11, marginTop: 2 },

  actionGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12 },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionLabel: { color: Colors.text, fontSize: 12 },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },

  channelRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  channelInfo: { flex: 1 },
  channelName: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  subCount: { color: Colors.textSecondary, fontSize: 12 },
  subscribeBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  subscribeText: { color: '#000', fontWeight: 'bold', fontSize: 14 },

  commentsPreview: { padding: 12 },
  commentsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  commentsTitle: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  commentsCount: { color: Colors.textSecondary, fontSize: 14 },
  commentItem: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  miniAvatar: { width: 24, height: 24, borderRadius: 12 },
  commentContent: { flex: 1 },
  commentText: { color: Colors.text, fontSize: 13 },
  commentUser: { fontWeight: 'bold' },

  sortContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  sortText: { color: Colors.textSecondary, fontSize: 13 },

  pinnedComment: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 8, marginTop: 4 },
  pinnedHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  pinnedText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' },

  engagementRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  heartText: { color: Colors.textSecondary, fontSize: 11 },

  relatedContainer: { paddingVertical: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  menuContent: { backgroundColor: Colors.cardBackground, width: width * 0.8, borderRadius: 16, padding: 16 },
  menuHeader: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuText: { color: Colors.text, fontSize: 16 },
});

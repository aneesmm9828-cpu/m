import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { supabase } from '../../utils/supabaseConfig';
import VideoCard from '../../components/VideoCard';

const { width } = Dimensions.get('window');

const TABS = ['Home', 'Videos', 'Shorts', 'Live', 'Playlists', 'Community', 'Store', 'Channels', 'About'];

export default function ChannelScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('Home');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<any[]>([]);
  const [subscriptionLevel, setSubscriptionLevel] = useState('Personalized'); // All, Personalized, None

  useEffect(() => {
    loadChannelData();
  }, [id]);

  const loadChannelData = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      setProfile(profileData);

      // Fetch videos for this user
      const { data: videoData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      setVideos(videoData?.map(v => ({
        ...v,
        user: {
          username: profileData?.username,
          picture: profileData?.avatar_url
        }
      })) || []);

    } catch (error) {
      console.error('Error loading channel:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Banner */}
      <Image
        source={{ uri: 'https://via.placeholder.com/1000x300/1a1a1a/ffffff?text=Channel+Banner' }}
        style={styles.banner}
      />

      <View style={styles.profileInfo}>
        <Image source={{ uri: profile?.avatar_url || 'https://via.placeholder.com/100' }} style={styles.avatar} />
        <Text style={styles.channelName}>{profile?.full_name || profile?.username}</Text>
        <Text style={styles.handle}>@{profile?.username} • 45.2K subscribers • 120 videos</Text>
        <Text style={styles.description} numberOfLines={2}>
          Welcome to my official MARB channel! Subscribe for daily videos about tech, life, and India's super app evolution.
        </Text>

        <View style={styles.subscriptionRow}>
          <TouchableOpacity style={styles.subscribeBtn}>
            <Text style={styles.subscribeText}>Subscribed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bellBtn} onPress={() => {
            const levels = ['All', 'Personalized', 'None'];
            const next = levels[(levels.indexOf(subscriptionLevel) + 1) % 3];
            setSubscriptionLevel(next);
          }}>
            <Ionicons
              name={subscriptionLevel === 'All' ? "notifications" : subscriptionLevel === 'None' ? "notifications-off-outline" : "notifications-outline"}
              size={24}
              color={Colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs Scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTabContent = () => {
    switch(activeTab) {
      case 'Videos':
        return (
          <FlatList
            data={videos}
            renderItem={({ item }) => (
              <VideoCard
                item={item}
                onPress={() => router.push({ pathname: '/video/[id]', params: { id: item.id } })}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
          />
        );
      case 'Home':
        return (
          <ScrollView style={styles.homeContent}>
             <Text style={styles.sectionTitle}>For you</Text>
             <VideoCard item={videos[0]} />
             <View style={styles.divider} />
             <Text style={styles.sectionTitle}>Recently uploaded</Text>
             <FlatList
               data={videos.slice(0, 5)}
               horizontal
               showsHorizontalScrollIndicator={false}
               renderItem={({ item }) => (
                 <TouchableOpacity style={styles.horizontalVideo} onPress={() => router.push({ pathname: '/video/[id]', params: { id: item.id } })}>
                   <Image source={{ uri: item.media_url }} style={styles.hzThumbnail} />
                   <Text style={styles.hzTitle} numberOfLines={2}>{item.caption}</Text>
                 </TouchableOpacity>
               )}
               keyExtractor={(item) => 'hz-' + item.id}
             />
          </ScrollView>
        );
      default:
        return (
          <View style={styles.emptyTab}>
            <Text style={styles.emptyTabText}>Content for {activeTab} will appear here.</Text>
          </View>
        );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{profile?.username}</Text>
        <View style={styles.navRight}>
          <TouchableOpacity style={styles.navIcon}><MaterialCommunityIcons name="cast" size={24} color={Colors.text} /></TouchableOpacity>
          <TouchableOpacity style={styles.navIcon}><Ionicons name="search" size={24} color={Colors.text} /></TouchableOpacity>
          <TouchableOpacity style={styles.navIcon}><Ionicons name="ellipsis-vertical" size={24} color={Colors.text} /></TouchableOpacity>
        </View>
      </View>

      {renderHeader()}
      <View style={{ flex: 1 }}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  navHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 16 },
  navTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold', flex: 1 },
  navRight: { flexDirection: 'row', gap: 16 },
  navIcon: { padding: 4 },

  headerContainer: { backgroundColor: Colors.background },
  banner: { width: width, height: 100 },
  profileInfo: { padding: 16, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, marginTop: -40, borderWidth: 3, borderColor: Colors.background },
  channelName: { color: Colors.text, fontSize: 22, fontWeight: 'bold', marginTop: 8 },
  handle: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  description: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },

  subscriptionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  subscribeBtn: { backgroundColor: Colors.surface, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  subscribeText: { color: Colors.text, fontWeight: 'bold' },
  bellBtn: { padding: 8 },

  tabScroll: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTabItem: { borderBottomColor: Colors.text },
  tabText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600', textTransform: 'uppercase' },
  activeTabText: { color: Colors.text },

  listContent: { paddingVertical: 12 },
  homeContent: { flex: 1, padding: 16 },
  sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 20 },

  horizontalVideo: { width: 160, marginRight: 12 },
  hzThumbnail: { width: 160, height: 90, borderRadius: 8, backgroundColor: Colors.surface },
  hzTitle: { color: Colors.text, fontSize: 13, marginTop: 6 },

  emptyTab: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTabText: { color: Colors.textSecondary, textAlign: 'center' },
});

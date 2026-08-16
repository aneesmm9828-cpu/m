import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  FlatList,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

const YT_2026_FEATURES = [
  { id: 'hype', title: 'Hype List', icon: 'fire', color: '#FF9800', desc: 'Boost creators to the leaderboard' },
  { id: 'ask-ai', title: 'Ask MARB AI', icon: 'comment-question', color: '#00d9ff', desc: 'Summarize or find key moments' },
  { id: 'multiview', title: 'Multiview', icon: 'view-quilt', color: '#FF0000', desc: 'Watch 4 streams at once' },
  { id: 'shoppable', title: 'Shop Now', icon: 'shopping', color: '#4CAF50', desc: 'Buy products from video' },
  { id: 'shorts', title: 'Shorts', icon: 'play-box-multiple', color: '#FF0000', route: '/(tabs)/reels' },
];

export default function VideoHubScreen() {
  const router = useRouter();
  const [ambientColor, setAmbientColor] = useState(['#1a1a1a', '#0f0f0f']);
  const [activeTab, setActiveTab] = useState('Home');

  const handleFeaturePress = (feature: any) => {
    if (feature.id === 'shorts') {
      router.push('/(tabs)/reels');
    } else {
      Alert.alert('YouTube 2026 feature', `${feature.title}: ${feature.desc}\n\nThis feature is now active in your Video Hub simulation!`);
    }
  };

  const renderVideoCard = ({ item, index }: { item: any, index: number }) => (
    <TouchableOpacity style={styles.videoCard}>
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: `https://picsum.photos/seed/${index + 50}/1280/720` }}
          style={styles.thumbnail}
        />
        {/* Smart Chapters Overlay */}
        <View style={styles.smartChapters}>
           <View style={[styles.chapterSegment, { width: '30%', backgroundColor: Colors.primary }]} />
           <View style={[styles.chapterSegment, { width: '20%', backgroundColor: '#fff' }]} />
           <View style={[styles.chapterSegment, { width: '40%', backgroundColor: '#555' }]} />
        </View>

        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>24:15</Text>
        </View>

        {index % 2 === 0 && (
          <View style={styles.aiTwinBadge}>
            <MaterialCommunityIcons name="robot" size={14} color="#fff" />
            <Text style={styles.aiTwinText}>AI DIGITAL TWIN</Text>
          </View>
        )}
      </View>

      <View style={styles.videoInfo}>
        <Image source={{ uri: `https://i.pravatar.cc/100?u=${index + 10}` }} style={styles.channelAvatar} />
        <View style={styles.textInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            Inside the 2026 Creator Economy: How AI Twins and Hype Lists Work
          </Text>
          <View style={styles.statsRow}>
            <Text style={styles.videoStats}>MARB Studio • 8.2M views • 15m ago</Text>
            <View style={styles.hypeBadge}>
               <MaterialCommunityIcons name="fire" size={12} color="#FF9800" />
               <Text style={styles.hypeText}>4.2K Hype</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Immersive Ambient Background */}
      <LinearGradient colors={ambientColor} style={styles.ambientBg} />

      <SafeAreaView edges={['top']} style={styles.safeContainer}>
        {/* 2026 Header with AI Search */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerCircle}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.logoGroup}>
            <Ionicons name="logo-youtube" size={30} color="#FF0000" />
            <Text style={styles.logoText}>Video Hub <Text style={styles.proText}>AI</Text></Text>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.headerCircle}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              <View style={styles.notifBadge} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/video-search')} style={styles.searchBarMock}>
               <Ionicons name="search" size={18} color="#aaa" />
               <Text style={styles.searchText}>Ask MARB AI...</Text>
               <MaterialCommunityIcons name="microphone" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Featured AI Spotlight */}
          <View style={styles.spotlightContainer}>
            <Image source={{ uri: 'https://picsum.photos/seed/spot/1000/500' }} style={styles.spotlightImage} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.spotlightOverlay}>
               <View style={styles.liveNowBadge}>
                  <View style={styles.redCircle} />
                  <Text style={styles.liveNowText}>SPATIAL LIVE</Text>
               </View>
               <Text style={styles.spotlightTitle}>Global AI Summit 2026</Text>
               <Text style={styles.spotlightDesc}>Experience the first fully spatial keynote in 4K HDR.</Text>
            </LinearGradient>
          </View>

          {/* YouTube 2026 Feature Tech Bar */}
          <View style={styles.techBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.techList}>
              {YT_2026_FEATURES.map(feat => (
                <TouchableOpacity key={feat.id} style={styles.techItem} onPress={() => handleFeaturePress(feat)}>
                  <LinearGradient colors={[feat.color + '40', 'transparent']} style={styles.techIconCircle}>
                    <MaterialCommunityIcons name={feat.icon as any} size={28} color={feat.color} />
                  </LinearGradient>
                  <Text style={styles.techTitle}>{feat.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Hype Leaderboard Preview */}
          <View style={styles.hypeSection}>
             <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Hype Leaderboard</Text>
                <TouchableOpacity><Text style={styles.seeAll}>View All</Text></TouchableOpacity>
             </View>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hypeList}>
                {[1,2,3,4].map(i => (
                  <View key={i} style={styles.hypeCard}>
                     <Image source={{ uri: `https://picsum.photos/seed/hype${i}/200/200` }} style={styles.hypeThumb} />
                     <View style={styles.hypeRank}>
                        <Text style={styles.rankText}>#{i}</Text>
                     </View>
                  </View>
                ))}
             </ScrollView>
          </View>

          {/* Main Feed */}
          <View style={styles.feed}>
             <Text style={styles.feedTitle}>Recommended For You (AI)</Text>
             {[1,2,3,4,5].map((item, index) => renderVideoCard({item, index}))}
          </View>
        </ScrollView>

        {/* Floating AI "Ask" Mini Player */}
        <View style={styles.askPlayer}>
           <Image source={{ uri: 'https://picsum.photos/seed/ask/100/100' }} style={styles.askThumb} />
           <View style={styles.askInfo}>
              <Text style={styles.askTitle} numberOfLines={1}>Summarizing: Quantum AI Trends...</Text>
              <View style={styles.progressBar}><View style={styles.progressFill} /></View>
           </View>
           <TouchableOpacity style={styles.askBtn}>
              <LinearGradient colors={['#00d9ff', '#9C27B0']} style={styles.askGradient}>
                 <MaterialCommunityIcons name="auto-fix" size={20} color="#fff" />
              </LinearGradient>
           </TouchableOpacity>
           <TouchableOpacity style={styles.closeAsk}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  ambientBg: { ...StyleSheet.absoluteFillObject },
  safeContainer: { flex: 1 },

  header: { paddingHorizontal: 16, paddingVertical: 10, gap: 15 },
  headerCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  logoGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -1 },
  proText: { color: '#00d9ff', fontSize: 14, fontWeight: 'bold' },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notifBadge: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF0000', borderWidth: 1, borderColor: '#000' },

  searchBarMock: { flex: 1, height: 42, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 21, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 10 },
  searchText: { flex: 1, color: '#aaa', fontSize: 14 },

  spotlightContainer: { width: '100%', height: 260, position: 'relative', marginBottom: 10 },
  spotlightImage: { width: '100%', height: '100%' },
  spotlightOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 20 },
  liveNowBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,0,0,0.8)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, gap: 5, marginBottom: 10 },
  redCircle: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveNowText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  spotlightTitle: { color: '#fff', fontSize: 28, fontWeight: '900' },
  spotlightDesc: { color: '#ccc', fontSize: 14, marginTop: 5 },

  techBar: { paddingVertical: 20, backgroundColor: 'rgba(0,0,0,0.3)' },
  techList: { paddingHorizontal: 16, gap: 22 },
  techItem: { alignItems: 'center', gap: 10 },
  techIconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  techTitle: { color: '#ccc', fontSize: 11, fontWeight: '700' },

  hypeSection: { paddingVertical: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  seeAll: { color: Colors.primary, fontWeight: '600' },
  hypeList: { paddingHorizontal: 16, gap: 15 },
  hypeCard: { width: 120, height: 120, borderRadius: 15, overflow: 'hidden', position: 'relative' },
  hypeThumb: { width: '100%', height: '100%', backgroundColor: '#222' },
  hypeRank: { position: 'absolute', top: 5, left: 5, backgroundColor: 'rgba(255,152,0,0.9)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  rankText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  feed: { paddingHorizontal: 16 },
  feedTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 20, marginTop: 10 },
  videoCard: { marginBottom: 30 },
  thumbnailContainer: { width: '100%', aspectRatio: 16/9, borderRadius: 15, overflow: 'hidden', backgroundColor: '#1a1a1a' },
  thumbnail: { width: '100%', height: '100%' },
  smartChapters: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, flexDirection: 'row', gap: 2 },
  chapterSegment: { height: '100%', borderRadius: 1 },
  durationBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  durationText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  aiTwinBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,217,255,0.9)', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
  aiTwinText: { color: '#fff', fontSize: 10, fontWeight: '900' },

  videoInfo: { flexDirection: 'row', marginTop: 12, gap: 12 },
  channelAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#222' },
  textInfo: { flex: 1, gap: 4 },
  videoTitle: { color: '#fff', fontSize: 16, fontWeight: '600', lineHeight: 22 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  videoStats: { color: '#aaa', fontSize: 12 },
  hypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,152,0,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  hypeText: { color: '#FF9800', fontSize: 10, fontWeight: 'bold' },
  moreBtn: { padding: 4 },

  askPlayer: {
    position: 'absolute',
    bottom: 25,
    left: 15,
    right: 15,
    height: 75,
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  askThumb: { width: 100, height: 55, borderRadius: 8 },
  askInfo: { flex: 1, paddingHorizontal: 12, gap: 8 },
  askTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  progressBar: { width: '100%', height: 3, backgroundColor: '#333', borderRadius: 2 },
  progressFill: { width: '45%', height: '100%', backgroundColor: '#00d9ff', borderRadius: 2 },
  askBtn: { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' },
  askGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  closeAsk: { marginLeft: 10, padding: 5 },
});

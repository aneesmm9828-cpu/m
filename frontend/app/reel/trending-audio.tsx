import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

// Mock data for trending audio
const TRENDING_DATA = [
  { id: '1', rank: 1, title: 'Espresso', artist: 'Sabrina Carpenter', usage: '4.2M reels', thumbnail: 'https://via.placeholder.com/150/00D9FF', trend: 'up' },
  { id: '2', rank: 2, title: 'Birds of a Feather', artist: 'Billie Eilish', usage: '3.1M reels', thumbnail: 'https://via.placeholder.com/150/8A2BE2', trend: 'up' },
  { id: '3', rank: 3, title: 'Million Dollar Baby', artist: 'Tommy Richman', usage: '2.8M reels', thumbnail: 'https://via.placeholder.com/150/00D9FF', trend: 'down' },
  { id: '4', rank: 4, title: 'Not Like Us', artist: 'Kendrick Lamar', usage: '2.5M reels', thumbnail: 'https://via.placeholder.com/150/8A2BE2', trend: 'up' },
  { id: '5', rank: 5, title: 'A Bar Song (Tipsy)', artist: 'Shaboozey', usage: '1.9M reels', thumbnail: 'https://via.placeholder.com/150/00D9FF', trend: 'up' },
  { id: '6', rank: 6, title: 'Pink Skies', artist: 'Zach Bryan', usage: '1.4M reels', thumbnail: 'https://via.placeholder.com/150/8A2BE2', trend: 'down' },
  { id: '7', rank: 7, title: 'Stargazing', artist: 'Myles Smith', usage: '1.2M reels', thumbnail: 'https://via.placeholder.com/150/00D9FF', trend: 'up' },
];

export default function TrendingAudioScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('This Week');
  const [currentAudio, setCurrentAudio] = useState(TRENDING_DATA[0]);

  const tabs = ['Today', 'This Week', 'This Month'];

  const renderItem = ({ item }: { item: typeof TRENDING_DATA[0] }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.rankText}>#{item.rank}</Text>
        <View style={styles.thumbnailContainer}>
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
          <View style={styles.playIconOverlay}>
            <Ionicons name="play" size={12} color="#fff" />
          </View>
        </View>
        <View style={styles.audioInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.artistName} numberOfLines={1}>{item.artist}</Text>
          <View style={styles.usageRow}>
            <Ionicons
              name={item.trend === 'up' ? 'trending-up' : 'trending-down'}
              size={14}
              color={item.trend === 'up' ? '#00D9FF' : '#FF3B30'}
            />
            <Text style={styles.usageText}>{item.usage}</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardRight}>
        <TouchableOpacity
          style={styles.useAudioBtn}
          onPress={() => router.push(`/reel/create?audioId=${item.id}`)}
        >
          <LinearGradient
            colors={['#00D9FF', '#8A2BE2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBtn}
          >
            <Text style={styles.useAudioText}>Use</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreIcon} onPress={() => setCurrentAudio(item)}>
          <Ionicons name="play-circle" size={28} color="#8A2BE2" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trending Audio</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Ranked List */}
      <FlatList
        data={TRENDING_DATA}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Mini Player */}
      <View style={styles.miniPlayer}>
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,1)']}
          style={styles.playerInner}
        >
          <Image source={{ uri: currentAudio.thumbnail }} style={styles.playerThumbnail} />
          <View style={styles.playerInfo}>
            <Text style={styles.playerTitle} numberOfLines={1}>{currentAudio.title}</Text>
            <Text style={styles.playerArtist} numberOfLines={1}>{currentAudio.artist}</Text>
          </View>
          <View style={styles.playerControls}>
            <TouchableOpacity style={styles.controlBtn}>
              <Ionicons name="pause" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlBtn}>
              <Ionicons name="close" size={24} color="#777" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  tabContainer: {
    paddingVertical: 16,
  },
  tabScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  activeTab: {
    backgroundColor: '#fff',
    borderColor: '#00D9FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#777',
  },
  activeTabText: {
    color: '#00D9FF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9F9F9',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#AAA',
    width: 30,
  },
  thumbnailContainer: {
    position: 'relative',
    marginRight: 12,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F0F0',
  },
  playIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8A2BE2',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  audioInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  artistName: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  usageText: {
    fontSize: 12,
    color: '#AAA',
    fontWeight: '500',
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  useAudioBtn: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  gradientBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useAudioText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  moreIcon: {
    padding: 2,
  },
  miniPlayer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  playerInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  playerThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  playerArtist: {
    fontSize: 12,
    color: '#777',
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlBtn: {
    padding: 4,
  },
});

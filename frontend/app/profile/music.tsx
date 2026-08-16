import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const MOCK_SONGS = [
  { id: '1', title: 'Espresso', artist: 'Sabrina Carpenter', image: 'https://via.placeholder.com/100/00D9FF', duration: '2:54' },
  { id: '2', title: 'Birds of a Feather', artist: 'Billie Eilish', image: 'https://via.placeholder.com/100/8A2BE2', duration: '3:30' },
  { id: '3', title: 'Starboy', artist: 'The Weeknd', image: 'https://via.placeholder.com/100/00D9FF', duration: '3:50' },
  { id: '4', title: 'Levitating', artist: 'Dua Lipa', image: 'https://via.placeholder.com/100/8A2BE2', duration: '3:23' },
  { id: '5', title: 'Blinding Lights', artist: 'The Weeknd', image: 'https://via.placeholder.com/100/00D9FF', duration: '3:20' },
];

export default function ProfileMusicScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('For You');
  const [selectedSong, setSelectedSong] = useState(MOCK_SONGS[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = ['For You', 'Trending', 'Genres', 'Moods'];

  const renderSongItem = ({ item }: { item: typeof MOCK_SONGS[0] }) => (
    <TouchableOpacity
      style={styles.songRow}
      onPress={() => setSelectedSong(item)}
    >
      <Image source={{ uri: item.image }} style={styles.songThumbnail} />
      <View style={styles.songInfo}>
        <Text style={styles.songName} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.artistName} numberOfLines={1}>{item.artist}</Text>
      </View>
      <Text style={styles.duration}>{item.duration}</Text>
      <TouchableOpacity style={styles.playPreviewBtn}>
        <Ionicons name="play" size={18} color="#000" />
      </TouchableOpacity>
      {selectedSong?.id === item.id && (
        <View style={styles.selectedBadge}>
          <Ionicons name="checkmark" size={12} color="#FFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Music</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.doneBtn}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Current Music Card */}
        <View style={styles.currentCardContainer}>
          <LinearGradient
            colors={['rgba(0, 217, 255, 0.05)', 'rgba(138, 43, 226, 0.05)']}
            style={styles.currentCard}
          >
            <Image source={{ uri: selectedSong.image }} style={styles.currentArt} />
            <View style={styles.currentInfo}>
              <Text style={styles.currentTitle}>{selectedSong.title}</Text>
              <Text style={styles.currentArtist}>{selectedSong.artist}</Text>
              <View style={styles.waveContainer}>
                {[1, 2, 3, 4, 5].map(i => (
                  <View key={i} style={[styles.waveBar, { height: 10 + Math.random() * 15 }]} />
                ))}
              </View>
            </View>
            <TouchableOpacity style={styles.removeBtn}>
              <Ionicons name="close-circle" size={24} color="#BBB" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#777" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search songs, artists..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Song List */}
        <View style={styles.listSection}>
          {MOCK_SONGS.map(item => (
            <React.Fragment key={item.id}>
              {renderSongItem({ item })}
            </React.Fragment>
          ))}
        </View>

        {/* Profile Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.previewHeading}>How it appears on profile</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Image source={{ uri: 'https://via.placeholder.com/50' }} style={styles.previewAvatar} />
              <View>
                <Text style={styles.previewName}>Your Name</Text>
                <Text style={styles.previewBio}>Bio text goes here...</Text>
              </View>
            </View>
            <View style={styles.musicBadge}>
              <Ionicons name="musical-notes" size={14} color="#00D9FF" />
              <Text style={styles.musicBadgeText}>{selectedSong.title} - {selectedSong.artist}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Mini Player Bar */}
      <View style={styles.miniPlayer}>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
        <View style={styles.playerInner}>
          <Image source={{ uri: selectedSong.image }} style={styles.miniArt} />
          <Text style={styles.miniText} numberOfLines={1}>{selectedSong.title} • {selectedSong.artist}</Text>
          <TouchableOpacity style={styles.miniPlayBtn}>
            <Ionicons name="pause" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  doneBtn: { color: '#00D9FF', fontWeight: 'bold', fontSize: 16 },
  currentCardContainer: { padding: 16 },
  currentCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  currentArt: { width: 64, height: 64, borderRadius: 12 },
  currentInfo: { flex: 1, marginLeft: 16 },
  currentTitle: { fontSize: 16, fontWeight: 'bold' },
  currentArtist: { fontSize: 14, color: '#777', marginTop: 2 },
  waveContainer: { flexDirection: 'row', alignItems: 'flex-end', height: 25, marginTop: 8, gap: 3 },
  waveBar: { width: 3, backgroundColor: '#00D9FF', borderRadius: 2 },
  removeBtn: { padding: 4 },
  searchSection: { paddingHorizontal: 16, marginBottom: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 12, height: 44, borderRadius: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#000' },
  tabsContainer: { marginVertical: 12 },
  tabsScroll: { paddingHorizontal: 16, gap: 12 },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5' },
  activeTab: { backgroundColor: '#00D9FF' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#777' },
  activeTabText: { color: '#FFF' },
  listSection: { paddingHorizontal: 16 },
  songRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#EEE' },
  songThumbnail: { width: 48, height: 48, borderRadius: 8 },
  songInfo: { flex: 1, marginLeft: 12 },
  songName: { fontSize: 15, fontWeight: 'bold' },
  artistName: { fontSize: 13, color: '#777', marginTop: 2 },
  duration: { fontSize: 12, color: '#999', marginRight: 12 },
  playPreviewBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  selectedBadge: { position: 'absolute', left: 40, bottom: 10, width: 18, height: 18, borderRadius: 9, backgroundColor: '#00D9FF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  previewSection: { padding: 16, marginTop: 16 },
  previewHeading: { fontSize: 14, fontWeight: '600', color: '#777', marginBottom: 12 },
  previewCard: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#EEE', backgroundColor: '#FAFAFA' },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  previewAvatar: { width: 40, height: 40, borderRadius: 20 },
  previewName: { fontSize: 14, fontWeight: 'bold' },
  previewBio: { fontSize: 12, color: '#777' },
  musicBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', gap: 6 },
  musicBadgeText: { fontSize: 12, fontWeight: '600', color: '#00D9FF' },
  miniPlayer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingBottom: 20 },
  progressTrack: { height: 2, backgroundColor: '#EEE', width: '100%' },
  progressFill: { height: 2, backgroundColor: '#00D9FF', width: '40%' },
  playerInner: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  miniArt: { width: 40, height: 40, borderRadius: 6 },
  miniText: { flex: 1, fontSize: 14, fontWeight: '600' },
  miniPlayBtn: { padding: 4 },
});

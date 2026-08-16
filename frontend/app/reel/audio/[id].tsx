import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { api } from '../../../utils/api';

const { width } = Dimensions.get('window');
const reelWidth = (width - 4) / 3;
const reelHeight = reelWidth * 1.6;

export default function ReelAudioScreen() {
  const router = useRouter();
  const { id: musicName } = useLocalSearchParams();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAudioReels();
  }, [musicName]);

  const loadAudioReels = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reels/audio/' + musicName);
      setReels(response.data || []);
    } catch (error) {
      console.error('Error loading audio reels:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderReel = ({ item }) => (
    <TouchableOpacity
      style={styles.reelItem}
      activeOpacity={0.8}
      onPress={() => router.push('/(tabs)/reels?reelId=' + item.reel_id)}
    >
      <Image
        source={{ uri: 'data:image/jpeg;base64,' + item.video }}
        style={styles.reelThumbnail}
        resizeMode="cover"
      />
      <View style={styles.playCount}>
        <Ionicons name="play" size={14} color="#fff" />
        <Text style={styles.playCountText}>{Math.floor(Math.random() * 100)}K</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.audioHeader}>
      <View style={styles.audioIconBg}>
        <Ionicons name="musical-notes" size={40} color="#fff" />
      </View>
      <View style={styles.audioDetails}>
        <Text style={styles.audioName}>{musicName || 'Original Audio'}</Text>
        <Text style={styles.reelCount}>{reels.length} reels</Text>
        <TouchableOpacity style={styles.useAudioButton}>
          <Ionicons name="play" size={16} color={Colors.background} />
          <Text style={styles.useAudioText}>Use Audio</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.saveAudioIcon}>
        <Ionicons name="bookmark-outline" size={28} color={Colors.text} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Audio</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={reels}
        renderItem={renderReel}
        keyExtractor={(item) => item.reel_id}
        numColumns={3}
        ListHeaderComponent={renderHeader}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="play-circle-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No reels using this audio yet</Text>
            </View>
          )
        }
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  audioHeader: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  audioIconBg: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  audioDetails: {
    flex: 1,
  },
  audioName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  reelCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  useAudioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.text,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 8,
  },
  useAudioText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: 14,
  },
  saveAudioIcon: {
    padding: 8,
  },
  row: {
    gap: 2,
    marginBottom: 2,
  },
  reelItem: {
    width: reelWidth,
    height: reelHeight,
  },
  reelThumbnail: {
    width: '100%',
    height: '100%',
  },
  playCount: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

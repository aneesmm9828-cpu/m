import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

// Mock Data for Map UI
const FRIENDS = [
  { id: '1', name: 'Rahul', avatar: 'https://via.placeholder.com/100', activity: 'In Bhubaneswar', time: '2m ago' },
  { id: '2', name: 'Priya', avatar: 'https://via.placeholder.com/100', activity: 'Working', time: '10m ago' },
];

const PLACES = [
  { name: 'Khandagiri Caves', type: 'Historical', category: 'Sightseeing' },
  { name: 'Nexus Esplanade', type: 'Shopping', category: 'Trending' },
];

export default function FriendMapScreen() {
  const router = useRouter();
  const [ghostMode, setGhostMode] = useState(false);
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('dark');
  const [isLocating, setIsLocating] = useState(false);

  const MAP_IMAGES = {
    dark: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1000',
    light: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000'
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    setTimeout(() => setIsLocating(false), 2000);
  };

  return (
    <View style={styles.container}>
      {/* Background Map Placeholder */}
      <View style={[styles.mapContainer, mapTheme === 'light' && { backgroundColor: '#e0e0e0' }]}>
        <Image
          source={{ uri: MAP_IMAGES[mapTheme] }}
          style={[styles.mapImage, mapTheme === 'light' && { opacity: 1 }]}
          resizeMode="cover"
        />

        {/* Heatmap Overlay Simulation */}
        <View style={[styles.heatmapPulse, { top: height * 0.4, left: width * 0.3 }]} />
        <View style={[styles.heatmapPulse, { top: height * 0.5, left: width * 0.6, transform: [{ scale: 1.5 }] }]} />

        {/* User's own "Live" marker */}
        <TouchableOpacity style={[styles.avatarMarker, { top: height * 0.6, left: width * 0.5 }]}>
            <View style={[styles.avatarCircle, { borderColor: Colors.primary }]}>
                <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.markerImg} />
            </View>
            <View style={styles.liveBadge}><Text style={styles.liveText}>LIVE</Text></View>
            <View style={styles.userPulse} />
        </TouchableOpacity>

        {/* Friend Bitmojis (Avatars on Map) */}
        <TouchableOpacity style={[styles.avatarMarker, { top: height * 0.45, left: width * 0.4 }]}>
          <View style={styles.avatarCircle}>
            <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.markerImg} />
          </View>
          <View style={styles.labelBox}><Text style={styles.labelText}>Rahul</Text></View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.avatarMarker, { top: height * 0.35, left: width * 0.7 }]}>
          <View style={styles.avatarCircle}>
            <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.markerImg} />
          </View>
          <View style={styles.labelBox}><Text style={styles.labelText}>Priya</Text></View>
        </TouchableOpacity>
      </View>

      {/* Floating UI Components */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.roundBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.7)" />
            <Text style={styles.searchText}>Search Friends & Places</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')} style={styles.roundBtn}>
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Sidebar Tools */}
        <View style={styles.sidebar}>
          <TouchableOpacity style={styles.sideBtn} onPress={handleLocateMe}>
            {isLocating ? (
                <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
                <MaterialCommunityIcons name="target" size={24} color="#fff" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sideBtn}
            onPress={() => setMapTheme(mapTheme === 'dark' ? 'light' : 'dark')}
          >
            <Ionicons name={mapTheme === 'dark' ? "moon" : "sunny"} size={24} color={mapTheme === 'dark' ? Colors.primary : "#ffcc00"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sideBtn}>
            <Ionicons name="layers-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sideBtn, ghostMode && { backgroundColor: Colors.primary }]}
            onPress={() => setGhostMode(!ghostMode)}
          >
            <Ionicons name={ghostMode ? "ghost" : "ghost-outline"} size={24} color={ghostMode ? "#000" : "#fff"} />
          </TouchableOpacity>
        </View>

        {/* Bottom Menu Pull-up (Snap Style) */}
        <View style={styles.bottomSheet}>
          <View style={styles.pullBar} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tray}>
            {/* Friends Section */}
            <View style={styles.traySection}>
              <Text style={styles.trayTitle}>Friends</Text>
              <View style={styles.trayRow}>
                {FRIENDS.map(f => (
                  <TouchableOpacity key={f.id} style={styles.friendCard}>
                    <Image source={{ uri: f.avatar }} style={styles.trayAvatar} />
                    <Text style={styles.friendName}>{f.name}</Text>
                    <Text style={styles.friendTime}>{f.time}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Places Section */}
            <View style={styles.traySection}>
              <Text style={styles.trayTitle}>Trending Places</Text>
              <View style={styles.trayRow}>
                {PLACES.map((p, i) => (
                  <TouchableOpacity key={i} style={styles.placeCard}>
                    <View style={styles.placeIcon}><Ionicons name="location" size={20} color={Colors.primary} /></View>
                    <View>
                        <Text style={styles.placeName}>{p.name}</Text>
                        <Text style={styles.placeType}>{p.type}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  mapContainer: { ...StyleSheet.absoluteFillObject },
  mapImage: { width: '100%', height: '100%', opacity: 0.8 },
  heatmapPulse: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255, 69, 0, 0.4)', borderWidth: 1, borderColor: 'rgba(255, 255, 0, 0.3)' },

  overlay: { flex: 1, justifyContent: 'space-between' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 10, gap: 12 },
  roundBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  searchBar: { flex: 1, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  searchText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },

  sidebar: { position: 'absolute', right: 16, top: height * 0.2, gap: 12 },
  sideBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },

  avatarMarker: { position: 'absolute', alignItems: 'center' },
  avatarCircle: { width: 54, height: 54, borderRadius: 27, borderWidth: 3, borderColor: '#fff', overflow: 'hidden', backgroundColor: Colors.surface },
  markerImg: { width: '100%', height: '100%' },
  labelBox: { backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 6 },
  labelText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  liveBadge: { position: 'absolute', top: -10, backgroundColor: Colors.error, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#fff', zIndex: 10 },
  liveText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  userPulse: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary + '30', zIndex: -1 },

  bottomSheet: { backgroundColor: 'rgba(0,0,0,0.9)', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 30 },
  pullBar: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, alignSelf: 'center', marginVertical: 12 },
  tray: { paddingHorizontal: 16 },
  traySection: { marginRight: 24 },
  trayTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  trayRow: { flexDirection: 'row', gap: 16 },
  friendCard: { alignItems: 'center', width: 70 },
  trayAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: Colors.primary },
  friendName: { color: '#fff', fontSize: 12, marginTop: 6, fontWeight: '500' },
  friendTime: { color: Colors.textSecondary, fontSize: 10 },

  placeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', padding: 12, borderRadius: 16, gap: 12, minWidth: 180 },
  placeIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  placeName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  placeType: { color: Colors.textSecondary, fontSize: 11 },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 4 },
});

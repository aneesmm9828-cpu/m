import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function GuestSplitScreen() {
  const router = useRouter();
  const [hostMuted, setHostMuted] = useState(false);
  const [guestMuted, setGuestMuted] = useState(false);

  return (
    <View style={styles.container}>
      {/* Top Split: Host */}
      <View style={[styles.splitHalf, styles.hostSide]}>
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.mockText}>Host Live Feed</Text>
        </View>
        <View style={styles.badgeContainer}>
          <View style={styles.roleBadge}><Text style={styles.roleText}>HOST</Text></View>
        </View>
        <Text style={styles.usernameOverlay}>@sabrina_c</Text>
        <View style={styles.localControls}>
           <TouchableOpacity style={styles.smallControl} onPress={() => setHostMuted(!hostMuted)}>
             <Ionicons name={hostMuted ? "mic-off" : "mic"} size={18} color="#FFF" />
           </TouchableOpacity>
           <TouchableOpacity style={styles.smallControl}>
             <Ionicons name="camera-reverse" size={18} color="#FFF" />
           </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Split: Guest */}
      <View style={[styles.splitHalf, styles.guestSide]}>
        <View style={[styles.cameraPlaceholder, { backgroundColor: '#1f1f1f' }]}>
          <Text style={styles.mockText}>Guest Live Feed</Text>
        </View>
        <View style={styles.badgeContainer}>
          <View style={[styles.roleBadge, { backgroundColor: '#4fffb0' }]}><Text style={[styles.roleText, { color: '#000' }]}>GUEST</Text></View>
        </View>
        <Text style={styles.usernameOverlay}>@music_fan</Text>
        <View style={styles.localControls}>
           <TouchableOpacity style={styles.smallControl} onPress={() => setGuestMuted(!guestMuted)}>
             <Ionicons name={guestMuted ? "mic-off" : "mic"} size={18} color="#FFF" />
           </TouchableOpacity>
           <TouchableOpacity style={styles.smallControl}>
             <Ionicons name="camera-reverse" size={18} color="#FFF" />
           </TouchableOpacity>
        </View>
      </View>

      {/* Shared Overlay */}
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.topHeader}>
          <View style={styles.liveInfo}>
             <View style={styles.liveBadge}><Text style={styles.liveText}>LIVE</Text></View>
             <Text style={styles.viewerCount}>1.5K</Text>
          </View>
          <TouchableOpacity style={styles.endBtn} onPress={() => router.back()}>
            <Text style={styles.endText}>End</Text>
          </TouchableOpacity>
        </View>

        {/* Floating Join Message */}
        <View style={styles.joinToast}>
          <Text style={styles.toastText}>@music_fan joined the live</Text>
        </View>

        {/* Bottom Control Row */}
        <View style={styles.bottomBar}>
           <View style={styles.chatPreview}>
              <Text style={styles.chatMsg}>sunny_day: This is fire! 🔥</Text>
           </View>
           <View style={styles.hostActions}>
             <TouchableOpacity style={styles.actionCircle}><Ionicons name="person-remove" size={20} color="#ff3b5c" /></TouchableOpacity>
             <TouchableOpacity style={styles.actionCircle}><Ionicons name="add" size={20} color="#FFF" /></TouchableOpacity>
             <TouchableOpacity style={[styles.actionCircle, { backgroundColor: '#ff3b5c' }]}><Ionicons name="heart" size={20} color="#FFF" /></TouchableOpacity>
           </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  splitHalf: { flex: 1, position: 'relative', borderBottomWidth: 1, borderBottomColor: '#333' },
  cameraPlaceholder: { flex: 1, backgroundColor: '#141414', justifyContent: 'center', alignItems: 'center' },
  mockText: { color: 'rgba(255,255,255,0.1)', fontSize: 16, fontWeight: 'bold' },
  badgeContainer: { position: 'absolute', top: 16, left: 16 },
  roleBadge: { backgroundColor: '#ff3b5c', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  roleText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  usernameOverlay: { position: 'absolute', bottom: 16, left: 16, color: '#FFF', fontWeight: 'bold', fontSize: 14, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
  localControls: { position: 'absolute', bottom: 16, right: 16, flexDirection: 'row', gap: 12 },
  smallControl: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', width: width, height: height },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10 },
  liveInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 8 },
  liveBadge: { backgroundColor: '#ff3b5c', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  liveText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  viewerCount: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  endBtn: { backgroundColor: 'rgba(255,59,92,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#ff3b5c' },
  endText: { color: '#ff3b5c', fontWeight: 'bold', fontSize: 12 },
  joinToast: { alignSelf: 'center', backgroundColor: 'rgba(0,217,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 20 },
  toastText: { color: '#00d9ff', fontWeight: '600', fontSize: 13 },
  bottomBar: { position: 'absolute', bottom: 40, left: 0, right: 0, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  chatPreview: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 12, marginRight: 20 },
  chatMsg: { color: '#FFF', fontSize: 13 },
  hostActions: { flexDirection: 'row', gap: 12 },
  actionCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
});

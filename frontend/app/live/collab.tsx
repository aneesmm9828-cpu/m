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
const GRID_HEIGHT = 200;

export default function CollabLiveScreen() {
  const router = useRouter();
  const [activeSpeaker, setActiveSpeaker] = useState(1);

  const HOSTS = [
    { id: 1, username: 'sabrina_c', role: 'HOST', muted: false },
    { id: 2, username: 'music_fan', role: 'CO-HOST', muted: false },
    { id: 3, username: 'alex_j', role: 'GUEST', muted: true },
    { id: 4, username: 'sunny_day', role: 'GUEST', muted: false },
  ];

  const renderPanel = (host: typeof HOSTS[0]) => (
    <View style={[styles.panel, activeSpeaker === host.id && styles.speakingPanel]}>
      <View style={styles.cameraMock}>
        <Text style={styles.mockText}>Camera Feed</Text>
      </View>
      <View style={styles.panelHeader}>
         <View style={styles.roleBadge}><Text style={styles.roleText}>{host.role}</Text></View>
         {host.muted && <Ionicons name="mic-off" size={14} color="#FFF" style={styles.muteIcon} />}
      </View>
      <View style={styles.panelFooter}>
         <Text style={styles.panelUsername}>@{host.username}</Text>
         <View style={styles.signalDots}>
            <View style={styles.dotActive} />
            <View style={styles.dotActive} />
            <View style={styles.dot} />
         </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 2x2 Grid Layout */}
      <View style={styles.grid}>
        <View style={styles.row}>
           {renderPanel(HOSTS[0])}
           {renderPanel(HOSTS[1])}
        </View>
        <View style={styles.row}>
           {renderPanel(HOSTS[2])}
           {renderPanel(HOSTS[3])}
        </View>
      </View>

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        {/* Shared Top Metadata */}
        <View style={styles.header}>
           <View style={styles.liveMeta}>
              <View style={styles.liveBadge}><Text style={styles.liveText}>LIVE</Text></View>
              <View style={styles.hostCount}><Text style={styles.hostCountText}>4 HOSTS</Text></View>
           </View>
           <View style={styles.viewerBadge}>
              <Ionicons name="eye" size={14} color="#FFF" />
              <Text style={styles.viewerText}>5.2K</Text>
           </View>
           <TouchableOpacity style={styles.endBtn} onPress={() => router.back()}>
             <Text style={styles.endText}>End</Text>
           </TouchableOpacity>
        </View>

        {/* Bottom Control Bar */}
        <View style={styles.bottomBar}>
           <View style={styles.chatArea}>
              <View style={styles.chatMsg}><Text style={styles.chatUser}>user_99: <Text style={styles.chatText}>Best collab ever!</Text></Text></View>
              <View style={styles.chatMsg}><Text style={styles.chatUser}>fan_x: <Text style={styles.chatText}>LIT 🔥🔥🔥</Text></Text></View>
           </View>
           <View style={styles.managementBtns}>
              <TouchableOpacity style={styles.actionCircle}><Ionicons name="mic-off-outline" size={20} color="#FFF" /></TouchableOpacity>
              <TouchableOpacity style={styles.actionCircle}><Ionicons name="person-remove-outline" size={20} color="#ff3b5c" /></TouchableOpacity>
              <TouchableOpacity style={[styles.actionCircle, { backgroundColor: '#ff3b5c' }]}><Ionicons name="heart" size={20} color="#FFF" /></TouchableOpacity>
           </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  grid: { flex: 1, paddingTop: 60 },
  row: { flexDirection: 'row', flex: 1 },
  panel: { flex: 1, margin: 1, backgroundColor: '#111', position: 'relative', overflow: 'hidden' },
  speakingPanel: { borderWidth: 2, borderColor: '#4fffb0' },
  cameraMock: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mockText: { color: 'rgba(255,255,255,0.05)', fontSize: 12, fontWeight: 'bold' },
  panelHeader: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roleBadge: { backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  roleText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },
  muteIcon: { backgroundColor: 'rgba(255,59,92,0.6)', borderRadius: 10, padding: 2 },
  panelFooter: { position: 'absolute', bottom: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelUsername: { color: '#FFF', fontSize: 11, fontWeight: 'bold', textShadowColor: '#000', textShadowRadius: 4 },
  signalDots: { flexDirection: 'row', gap: 2 },
  dotActive: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4fffb0' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  overlay: { position: 'absolute', width: width, height: height },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, gap: 12 },
  liveMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveBadge: { backgroundColor: '#ff3b5c', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  liveText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  hostCount: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  hostCountText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  viewerBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  viewerText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  endBtn: { backgroundColor: 'rgba(255,59,92,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#ff3b5c' },
  endText: { color: '#ff3b5c', fontWeight: 'bold', fontSize: 11 },
  bottomBar: { position: 'absolute', bottom: 40, left: 0, right: 0, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  chatArea: { flex: 1, gap: 6 },
  chatMsg: { alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  chatUser: { color: '#FFF', fontWeight: 'bold', fontSize: 11 },
  chatText: { fontWeight: 'normal' },
  managementBtns: { gap: 12 },
  actionCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const MOCK_CHAT = [
  { id: '1', username: 'sunny_day', text: 'Hey host! 👋' },
  { id: '2', username: 'tech_guru', text: 'Quality is amazing' },
];

export default function LiveHostScreen() {
  const router = useRouter();
  const [timer, setTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container}>
      {/* Camera POV Mock */}
      <View style={styles.cameraPov}>
        <Text style={styles.mockText}>Host Camera POV</Text>
      </View>
      <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.7)']} style={styles.gradient} />

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.liveMeta}>
            <View style={styles.liveBadge}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text style={styles.timer}>{formatTime(timer)}</Text>
            <View style={styles.viewerBadge}>
              <Ionicons name="eye" size={14} color="#FFF" />
              <Text style={styles.viewerCount}>856</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.endBtn} onPress={() => router.back()}>
            <Text style={styles.endText}>End</Text>
          </TouchableOpacity>
        </View>

        {/* Right Side Control Panel */}
        <View style={styles.controlPanel}>
          <TouchableOpacity style={styles.panelIcon}>
            <Ionicons name="camera-reverse-outline" size={26} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.panelIcon}>
            <Ionicons name="sparkles-outline" size={26} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.panelIcon}>
            <Ionicons name="color-filter-outline" size={26} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.panelIcon}>
            <Ionicons name="help-circle-outline" size={26} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.panelIcon} onPress={() => setIsMuted(!isMuted)}>
            <Ionicons name={isMuted ? "mic-off" : "mic-outline"} size={26} color={isMuted ? "#ff3b5c" : "#FFF"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.panelIcon}>
            <Ionicons name="share-social-outline" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <View style={styles.chatAndActions}>
            {/* Real-time Chat */}
            <View style={styles.chatArea}>
              <FlatList
                data={MOCK_CHAT}
                renderItem={({ item }) => (
                  <View style={styles.chatMsg}>
                    <Text style={styles.chatUser}>{item.username} <Text style={styles.chatText}>{item.text}</Text></Text>
                  </View>
                )}
                keyExtractor={item => item.id}
                inverted
              />
            </View>

            {/* Quick Actions */}
            <View style={styles.actionRow}>
               <TouchableOpacity style={styles.inviteBtn}>
                 <Ionicons name="person-add" size={20} color="#FFF" />
                 <Text style={styles.inviteText}>Invite</Text>
                 <View style={styles.requestBadge}><Text style={styles.badgeNum}>2</Text></View>
               </TouchableOpacity>
               <TouchableOpacity style={styles.muteChatBtn}>
                 <Ionicons name="chatbox-ellipses-outline" size={24} color="#FFF" />
               </TouchableOpacity>
            </View>
          </View>

          {/* Effects Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.effectsBar}>
             {[1,2,3,4,5].map(i => (
               <TouchableOpacity key={i} style={styles.effectItem}>
                 <View style={styles.effectCircle} />
               </TouchableOpacity>
             ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraPov: { flex: 1, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  mockText: { color: 'rgba(255,255,255,0.2)', fontSize: 20, fontWeight: 'bold' },
  gradient: { position: 'absolute', width: width, height: height },
  overlay: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10 },
  liveMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  liveBadge: { backgroundColor: '#ff3b5c', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  liveText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  timer: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  viewerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  viewerCount: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  endBtn: { borderColor: '#ff3b5c', borderWidth: 1, paddingHorizontal: 16, paddingVertical: 4, borderRadius: 6 },
  endText: { color: '#ff3b5c', fontWeight: 'bold' },
  controlPanel: { position: 'absolute', right: 16, top: 100, gap: 24, alignItems: 'center' },
  panelIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  bottomSection: { position: 'absolute', bottom: 20, left: 0, right: 0 },
  chatAndActions: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 20 },
  chatArea: { flex: 1, height: 120 },
  chatMsg: { marginBottom: 8, alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  chatUser: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  chatText: { fontWeight: 'normal' },
  actionRow: { gap: 16 },
  inviteBtn: { backgroundColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 8 },
  inviteText: { color: '#FFF', fontWeight: 'bold' },
  requestBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#ff3b5c', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  badgeNum: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  muteChatBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  effectsBar: { paddingLeft: 16, height: 60 },
  effectItem: { marginRight: 16 },
  effectCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.1)' },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function LiveGamingScreen() {
  const router = useRouter();
  const [hideHostCam, setHideHostCam] = useState(false);

  return (
    <View style={styles.container}>
      {/* Game Capture Mock */}
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=375&h=812&auto=format&fit=crop' }}
        style={styles.gameCapture}
      />

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.gamingBadge}>
            <Ionicons name="game-controller" size={16} color="#8A2BE2" />
            <Text style={styles.badgeText}>LIVE GAMING</Text>
          </View>
          <View style={styles.gameTitleRow}>
             <Text style={styles.playingText}>Playing: <Text style={styles.gameName}>Cyber Legends</Text></Text>
          </View>
          <View style={styles.metaRow}>
             <View style={styles.viewerBadge}><Text style={styles.countText}>12.5K</Text></View>
             <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={30} color="#FFF" /></TouchableOpacity>
          </View>
        </View>

        {/* Right Controls */}
        <View style={styles.rightControls}>
           <TouchableOpacity style={styles.controlBtn}><Ionicons name="mic" size={22} color="#FFF" /></TouchableOpacity>
           <TouchableOpacity style={styles.controlBtn}><Ionicons name="videocam" size={22} color="#FFF" /></TouchableOpacity>
           <TouchableOpacity style={styles.controlBtn}><Ionicons name="sparkles" size={22} color="#FFF" /></TouchableOpacity>
           <TouchableOpacity style={styles.controlBtn}><Ionicons name="share-social" size={22} color="#FFF" /></TouchableOpacity>
        </View>

        {/* Floating Reactions */}
        <View style={styles.reactionsArea}>
           <Text style={styles.ggEmoji}>GG</Text>
           <Text style={styles.wowEmoji}>😲</Text>
           <Text style={styles.fireEmoji}>🔥</Text>
        </View>

        {/* Host PiP Cam */}
        {!hideHostCam && (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.hostCamContainer}
            onLongPress={() => setHideHostCam(true)}
          >
             <Image source={{ uri: 'https://via.placeholder.com/80' }} style={styles.hostCam} />
             <View style={styles.camBorder} />
          </TouchableOpacity>
        )}

        {/* Bottom Chat Overlay */}
        <View style={styles.bottomSection}>
           <View style={styles.chatOverlay}>
              <View style={styles.chatLine}>
                 <Text style={styles.chatUser}>pro_gamer: <Text style={styles.chatText}>Incredible play! 🔥</Text></Text>
              </View>
              <View style={styles.chatLine}>
                 <Text style={styles.chatUser}>noob_master: <Text style={styles.chatText}>HOWWW?? 😲</Text></Text>
              </View>
              <View style={styles.chatLine}>
                 <Text style={styles.chatUser}>fan_1: <Text style={styles.chatText}>GG guys</Text></Text>
              </View>
           </View>
           <TouchableOpacity style={styles.sendGG}>
              <Text style={styles.sendGGText}>SEND GG</Text>
           </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  gameCapture: { position: 'absolute', width: width, height: height, opacity: 0.8 },
  overlay: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, gap: 12 },
  gamingBadge: { backgroundColor: 'rgba(138, 43, 226, 0.2)', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#8A2BE2' },
  badgeText: { color: '#8A2BE2', fontWeight: 'bold', fontSize: 10 },
  gameTitleRow: { flex: 1 },
  playingText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  gameName: { color: '#FFF', fontWeight: 'bold' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  viewerBadge: { backgroundColor: '#FF3B5C', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  countText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  rightControls: { position: 'absolute', right: 16, top: 100, gap: 20 },
  controlBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  reactionsArea: { position: 'absolute', right: 20, bottom: 200, alignItems: 'center' },
  ggEmoji: { color: '#8A2BE2', fontWeight: 'bold', fontSize: 24, textShadowColor: '#000', textShadowRadius: 4 },
  wowEmoji: { fontSize: 28, marginVertical: 10 },
  fireEmoji: { fontSize: 28 },
  hostCamContainer: { position: 'absolute', bottom: 100, left: 16 },
  hostCam: { width: 80, height: 80, borderRadius: 40 },
  camBorder: { position: 'absolute', width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: '#8A2BE2', top: -2, left: -2 },
  bottomSection: { position: 'absolute', bottom: 30, left: 0, right: 0, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  chatOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 16 },
  chatLine: { marginBottom: 4 },
  chatUser: { color: '#8A2BE2', fontWeight: 'bold', fontSize: 12 },
  chatText: { color: '#FFF', fontWeight: 'normal' },
  sendGG: { backgroundColor: '#8A2BE2', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
  sendGGText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
});

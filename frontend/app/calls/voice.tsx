import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallStore } from '../../store/callStore';
import { Colors } from '../../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VoiceCallScreen() {
  const { activeCall, endCall, toggleMute, toggleSpeaker, isMuted, isSpeakerOn } = useCallStore();
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activeCall) return null;

  const otherUserPhoto = activeCall.caller_id === activeCall.id ? activeCall.callee_photo : activeCall.caller_photo;
  const otherUserName = activeCall.caller_id === activeCall.id ? activeCall.callee_name : activeCall.caller_name;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: otherUserPhoto || 'https://via.placeholder.com/150' }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.content}>
        <View style={styles.topSection}>
          <Image
            source={{ uri: otherUserPhoto || 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{otherUserName || 'MARB User'}</Text>
          <Text style={styles.duration}>{formatDuration(duration)}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.activeControl]}
            onPress={toggleMute}
          >
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color="white" />
            <Text style={styles.controlLabel}>Mute</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, styles.endCallBtn]}
            onPress={endCall}
          >
            <Ionicons name="call-outline" size={32} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, isSpeakerOn && styles.activeControl]}
            onPress={toggleSpeaker}
          >
            <Ionicons name={isSpeakerOn ? "volume-high" : "volume-low"} size={28} color="white" />
            <Text style={styles.controlLabel}>Speaker</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: Colors.primary,
    marginBottom: 24,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  duration: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.7)',
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  controlBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeControl: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  endCallBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF3B30',
  },
  controlLabel: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    position: 'absolute',
    bottom: -22,
  }
});

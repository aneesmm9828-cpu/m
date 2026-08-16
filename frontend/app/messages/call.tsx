import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function CallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userId, type = 'video' } = params;

  const [otherUser, setOtherUser] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(type === 'voice');
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    loadUser();
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadUser = async () => {
    try {
      const res = await api.get(`/users/${userId}`);
      setOtherUser(res.data);
    } catch (error) {
      console.error('Error loading user for call:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const endCall = () => {
    router.back();
  };

  const getUserPic = () => {
    if (otherUser?.picture) {
      if (otherUser.picture.startsWith('http')) return otherUser.picture;
      return 'data:image/jpeg;base64,' + otherUser.picture;
    }
    return 'https://via.placeholder.com/200';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background - Blurred Image */}
      <Image
        source={{ uri: getUserPic() }}
        style={StyleSheet.absoluteFillObject}
        blurRadius={20}
      />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />

      <SafeAreaView style={styles.content}>
        {/* Top Info */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.minimizeBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-down" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.encryptionInfo}>
            <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.6)" />
            <Text style={styles.encryptionText}>End-to-end encrypted</Text>
          </View>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Image source={{ uri: getUserPic() }} style={styles.userAvatar} />
          <Text style={styles.userName}>{otherUser?.name || 'User'}</Text>
          <Text style={styles.callStatus}>{formatTime(callDuration)}</Text>
        </View>

        {/* Video Preview (Placeholder for self) */}
        {!isVideoOff && (
          <View style={styles.selfPreview}>
             <View style={styles.selfPreviewInner}>
                <Ionicons name="person" size={40} color="rgba(255,255,255,0.3)" />
             </View>
          </View>
        )}

        {/* Bottom Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlBtn, isVideoOff && styles.activeControlBtn]}
            onPress={() => setIsVideoOff(!isVideoOff)}
          >
            <Ionicons name={isVideoOff ? "videocam-off" : "videocam"} size={28} color="#fff" />
            <Text style={styles.controlLabel}>Video</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.activeControlBtn]}
            onPress={() => setIsMuted(!isMuted)}
          >
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color="#fff" />
            <Text style={styles.controlLabel}>Mute</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn}>
            <Ionicons name="volume-high" size={28} color="#fff" />
            <Text style={styles.controlLabel}>Speaker</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.endCallBtn} onPress={endCall}>
            <MaterialCommunityIcons name="phone-hangup" size={32} color="#fff" />
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  minimizeBtn: {
    padding: 8,
  },
  encryptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  encryptionText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
  userInfo: {
    alignItems: 'center',
    marginTop: height * 0.05,
  },
  userAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  callStatus: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  selfPreview: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  selfPreviewInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  controlBtn: {
    alignItems: 'center',
    width: 70,
  },
  activeControlBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 35,
    paddingVertical: 10,
  },
  controlLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
  },
  endCallBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
});

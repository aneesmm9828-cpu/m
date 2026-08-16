import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useCallStore } from '../../store/callStore';
import { Colors } from '../../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IncomingCallScreen() {
  const { activeCall, acceptCall, declineCall } = useCallStore();

  if (!activeCall) return null;

  return (
    <View style={styles.container}>
      {/* Blurred Background */}
      <Image
        source={{ uri: activeCall.caller_photo || 'https://via.placeholder.com/150' }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.content}>
        <View style={styles.topSection}>
          <Image
            source={{ uri: activeCall.caller_photo || 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{activeCall.caller_name || 'MARB User'}</Text>
          <Text style={styles.status}>
            MARB {activeCall.call_type === 'video' ? 'Video' : 'Voice'} Call...
          </Text>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={declineCall}
            >
              <Ionicons name="close" size={32} color="white" />
              <Text style={styles.buttonLabel}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={acceptCall}
            >
              <Ionicons
                name={activeCall.call_type === 'video' ? "videocam" : "call"}
                size={32}
                color="white"
              />
              <Text style={styles.buttonLabel}>Accept</Text>
            </TouchableOpacity>
          </View>
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
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  status: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
  },
  bottomSection: {
    width: '100%',
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  declineButton: {
    backgroundColor: '#FF3B30',
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  buttonLabel: {
    color: 'white',
    marginTop: 8,
    fontSize: 14,
    position: 'absolute',
    bottom: -25,
  }
});

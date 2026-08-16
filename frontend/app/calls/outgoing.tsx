import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useCallStore } from '../../store/callStore';
import { Colors } from '../../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OutgoingCallScreen() {
  const { activeCall, cancelCall } = useCallStore();

  if (!activeCall) return null;

  return (
    <View style={styles.container}>
      {/* Blurred Background */}
      <Image
        source={{ uri: activeCall.callee_photo || 'https://via.placeholder.com/150' }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.content}>
        <View style={styles.topSection}>
          <Image
            source={{ uri: activeCall.callee_photo || 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{activeCall.callee_name || 'MARB User'}</Text>
          <Text style={styles.status}>Calling...</Text>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={cancelCall}
          >
            <Ionicons name="close" size={32} color="white" />
          </TouchableOpacity>
          <Text style={styles.buttonLabel}>Cancel</Text>
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
    alignItems: 'center',
    marginBottom: 40,
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
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  buttonLabel: {
    color: 'white',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  }
});

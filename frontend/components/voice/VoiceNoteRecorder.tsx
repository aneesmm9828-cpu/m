import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Colors } from '../../constants/colors';

interface VoiceNoteRecorderProps {
  onRecordingComplete: (uri: string, durationMillis: number) => void;
  maxDurationSeconds?: number;
}

export default function VoiceNoteRecorder({
  onRecordingComplete,
  maxDurationSeconds = 60
}: VoiceNoteRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const pulseScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission needed', 'Microphone permission is required to record voice notes');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      pulseScale.value = withRepeat(
        withSequence(withSpring(1.2), withSpring(1)),
        -1,
        true
      );
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    pulseScale.value = withSpring(1);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();

      if (uri && status.durationMillis) {
        onRecordingComplete(uri, status.durationMillis);
      }
      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const gesture = Gesture.Pan()
    .onBegin(() => {
      startRecording();
    })
    .onEnd(() => {
      stopRecording();
    });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <View style={[styles.button, isRecording && styles.recordingButton]}>
          <Ionicons
            name={isRecording ? "mic" : "mic-outline"}
            size={24}
            color={isRecording ? "#fff" : Colors.primary}
          />
        </View>
        {isRecording && (
          <Text style={styles.recordingText}>Release to send</Text>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recordingButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  recordingText: {
    position: 'absolute',
    bottom: 50,
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    width: 100,
    textAlign: 'center',
  },
});

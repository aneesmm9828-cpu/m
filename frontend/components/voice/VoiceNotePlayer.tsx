import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface VoiceNotePlayerProps {
  uri: string;
  durationSeconds: number;
}

export default function VoiceNotePlayer({ uri, durationSeconds }: VoiceNotePlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        sound?.setPositionAsync(0);
        setIsPlaying(false);
      }
    }
  };

  const playPauseSound = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } else {
      setIsLoading(true);
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
      } catch (err) {
        console.error('Failed to play sound', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatDuration = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progress = (position / (durationSeconds * 1000)) * 100;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={playPauseSound} style={styles.playButton} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={24}
            color={Colors.primary}
          />
        )}
      </TouchableOpacity>

      <View style={styles.waveformContainer}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.durationText}>
          {formatDuration(position > 0 ? position : durationSeconds * 1000)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 150,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformContainer: {
    flex: 1,
    marginLeft: 10,
  },
  progressBg: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  durationText: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});

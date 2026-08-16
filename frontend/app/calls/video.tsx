import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder, Animated, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallStore } from '../../store/callStore';
import { Colors } from '../../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

const ZegoTextureView = Platform.OS !== 'web'
  ? require('zego-express-engine-reactnative').ZegoTextureView
  : View;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function VideoCallScreen() {
  const {
    activeCall, endCall, toggleMute, toggleCamera, switchCamera,
    isMuted, isCameraOn, isFrontCamera, remoteStreamID
  } = useCallStore();

  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (remoteStreamID && Platform.OS !== 'web' && activeCall) {
        const ZegoExpressEngine = require('zego-express-engine-reactnative').default;
        ZegoExpressEngine.instance().startPlayingStream(remoteStreamID, {
            view: activeCall.id,
            viewMode: 1
        });
    }
  }, [remoteStreamID, activeCall?.id]);

  // PIP Pan Animation
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - 110, y: 50 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        // Snap to nearest corner logic could go here
        pan.extractOffset();
      },
    })
  ).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
        const ZegoExpressEngine = require('zego-express-engine-reactnative').default;
        ZegoExpressEngine.instance().startPreview({
            view: 0,
            viewMode: 1
        });
    }
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activeCall) return null;

  return (
    <View style={styles.container}>
      {/* Remote Video (Full Screen) */}
      <ZegoTextureView
        renderViewTag={activeCall.id}
        style={StyleSheet.absoluteFill}
      />

      {/* Self Video (PIP) */}
      <Animated.View
        style={[
          styles.pipContainer,
          {
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <ZegoTextureView
          renderViewTag={0} // 0 is usually self preview in Zego
          style={styles.pipVideo}
        />
      </Animated.View>

      <TouchableOpacity
        activeOpacity={1}
        style={StyleSheet.absoluteFill}
        onPress={() => setShowControls(!showControls)}
      >
        <SafeAreaView style={styles.overlay}>
          {/* Top Bar */}
          {showControls && (
            <View style={styles.topBar}>
              <View style={styles.durationPill}>
                <Text style={styles.durationText}>{formatDuration(duration)}</Text>
              </View>
            </View>
          )}

          {/* Bottom Controls */}
          {showControls && (
            <View style={styles.controlsContainer}>
              <View style={styles.controlsPill}>
                <TouchableOpacity style={styles.controlBtn} onPress={switchCamera}>
                  <Ionicons name="camera-reverse" size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlBtn} onPress={toggleCamera}>
                  <Ionicons name={isCameraOn ? "videocam" : "videocam-off"} size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.controlBtn, styles.endCallBtn]} onPress={endCall}>
                  <Ionicons name="call" size={24} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlBtn} onPress={toggleMute}>
                  <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlBtn}>
                  <Ionicons name="volume-high" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  pipContainer: {
    position: 'absolute',
    width: 100,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 10,
    backgroundColor: '#111',
  },
  pipVideo: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  durationPill: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
  },
  durationText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  controlsContainer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  controlsPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 35,
    alignItems: 'center',
    gap: 15,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallBtn: {
    backgroundColor: '#FF3B30',
    width: 52,
    height: 52,
    borderRadius: 26,
  }
});

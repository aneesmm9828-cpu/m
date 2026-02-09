import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  StatusBar,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../utils/api';
import * as MediaLibrary from 'expo-media-library';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CameraScreen() {
  const router = useRouter();
  const cameraRef = useRef(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'POST' | 'STORY' | 'REEL'>('STORY');
  const [flash, setFlash] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        await requestPermission();
      }
    })();
  }, []);

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(!flash);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (mode === 'STORY') {
        // Upload as story
        await api.post('/stories', {
          image: photo.base64,
        });
        Alert.alert('Success', 'Story uploaded!');
      } else {
        // Navigate to post creation with photo
        Alert.alert('Success', 'Photo captured!');
      }

      router.back();
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setIsRecording(true);
      const video = await cameraRef.current.recordAsync({
        maxDuration: mode === 'STORY' ? 15 : 60,
      });

      Alert.alert('Success', 'Video recorded!');
      setIsRecording(false);
      router.back();
    } catch (error) {
      console.error('Error recording video:', error);
      setIsRecording(false);
      Alert.alert('Error', 'Failed to record video');
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash ? 'on' : 'off'}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.topButton}>
            <Ionicons name="close" size={32} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.topRight}>
            <TouchableOpacity onPress={toggleFlash} style={styles.topButton}>
              <Ionicons 
                name={flash ? "flash" : "flash-off"} 
                size={28} 
                color={Colors.text} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.topButton}>
              <Ionicons name="settings-outline" size={28} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Side Tools */}
        <View style={styles.sideTools}>
          <TouchableOpacity style={styles.toolButton}>
            <Ionicons name="text" size={28} color={Colors.text} />
            <Text style={styles.toolText}>Aa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton}>
            <Ionicons name="brush" size={28} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton}>
            <Ionicons name="happy" size={28} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton}>
            <Ionicons name="musical-notes" size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Mode Selector */}
          <View style={styles.modeSelector}>
            {['POST', 'STORY', 'REEL'].map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m as any)}
                style={styles.modeButton}
              >
                <Text
                  style={[
                    styles.modeText,
                    mode === m && styles.modeTextActive,
                  ]}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Shutter Button */}
          <View style={styles.shutterContainer}>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={() => router.back()}
            >
              <Ionicons name="images" size={32} color={Colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={mode === 'REEL' ? startRecording : takePicture}
              onLongPress={mode === 'STORY' ? startRecording : undefined}
              onPressOut={isRecording ? stopRecording : undefined}
              style={styles.shutterButton}
            >
              <View
                style={[
                  styles.shutter,
                  isRecording && styles.shutterRecording,
                  mode === 'REEL' && styles.shutterReel,
                ]}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleCameraFacing}
              style={styles.flipButton}
            >
              <Ionicons name="camera-reverse" size={32} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  camera: {
    flex: 1,
  },
  permissionText: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 200,
  },
  permissionButton: {
    marginTop: 20,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topButton: {
    padding: 8,
  },
  topRight: {
    flexDirection: 'row',
    gap: 8,
  },
  sideTools: {
    position: 'absolute',
    right: 16,
    top: '30%',
    gap: 32,
  },
  toolButton: {
    alignItems: 'center',
  },
  toolText: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 4,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  modeButton: {
    paddingVertical: 8,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modeTextActive: {
    color: Colors.text,
    fontSize: 16,
  },
  shutterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: Colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.text,
  },
  shutterRecording: {
    borderRadius: 8,
    width: 32,
    height: 32,
    backgroundColor: Colors.error,
  },
  shutterReel: {
    backgroundColor: Colors.primary,
  },
  flipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

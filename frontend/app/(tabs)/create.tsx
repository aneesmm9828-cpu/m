import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, CameraView } from 'expo-camera';

const { width, height } = Dimensions.get('window');

export default function CreateScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('story'); // 'post', 'story', 'reel'
  const [activeMode, setActiveMode] = useState('camera'); // 'camera', 'create', 'boomerang', 'layout'
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraFacing, setCameraFacing] = useState('back');
  const [flashMode, setFlashMode] = useState('off');
  const [showPreview, setShowPreview] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setMedia(null);
    setShowPreview(false);
  };

  const switchMode = (mode) => {
    setActiveMode(mode);
  };

  const toggleCameraFacing = () => {
    setCameraFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlashMode(current => (current === 'off' ? 'on' : 'off'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        setMedia(photo.base64);
        setMediaType('image');
        setShowPreview(true);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery permission is required');
      return;
    }

    const isReelOrStory = activeTab === 'reel' || activeTab === 'story';
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: isReelOrStory ? ['images', 'videos'] : ['images'],
      allowsEditing: true,
      aspect: activeTab === 'post' ? [1, 1] : [9, 16],
      quality: 0.8,
      base64: true,
      videoMaxDuration: activeTab === 'reel' ? 90 : 60,
    });

    if (!result.canceled && result.assets[0]) {
      setMedia(result.assets[0].base64);
      setMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
      setShowPreview(true);
    }
  };

  const handlePost = async () => {
    if (!media) {
      Alert.alert('Error', 'Please select or capture media');
      return;
    }

    setLoading(true);
    try {
      let endpoint = '/posts';
      let payload = {
        image: media,
        caption: caption || null,
      };

      if (activeTab === 'reel') {
        endpoint = '/reels';
        payload = {
          video: media,
          caption: caption || null,
        };
      } else if (activeTab === 'story') {
        endpoint = '/stories';
        payload = {
          image: media,
          media_type: mediaType,
        };
      }

      await api.post(endpoint, payload);
      
      const successMessages = {
        post: 'Post shared!',
        reel: 'Reel shared!',
        story: 'Story shared!',
      };
      
      Alert.alert('Success', successMessages[activeTab]);
      setMedia(null);
      setCaption('');
      setShowPreview(false);
      
      if (activeTab === 'reel') {
        router.push('/(tabs)/reels');
      } else {
        router.push('/(tabs)/home');
      }
    } catch (error) {
      console.error('Error creating:', error);
      Alert.alert('Error', 'Failed to share. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const discardMedia = () => {
    setMedia(null);
    setShowPreview(false);
    setCaption('');
  };

  // Preview Screen
  if (showPreview && media) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.previewHeader}>
          <TouchableOpacity onPress={discardMedia}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.previewTitle}>
            {activeTab === 'post' ? 'New Post' : activeTab === 'reel' ? 'New Reel' : 'Your Story'}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.previewContent} showsVerticalScrollIndicator={false}>
          <View style={styles.previewImageContainer}>
            <Image
              source={{ uri: 'data:image/jpeg;base64,' + media }}
              style={[styles.previewImage, activeTab === 'post' && styles.squarePreview]}
              resizeMode="cover"
            />
            {mediaType === 'video' && (
              <View style={styles.videoOverlay}>
                <Ionicons name="play-circle" size={60} color="#fff" />
              </View>
            )}
          </View>

          {activeTab !== 'story' && (
            <View style={styles.captionContainer}>
              <TextInput
                style={styles.captionInput}
                placeholder="Write a caption..."
                placeholderTextColor={Colors.textSecondary}
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={2200}
              />
            </View>
          )}

          <TouchableOpacity style={styles.optionRow}>
            <Ionicons name="person-outline" size={22} color={Colors.text} />
            <Text style={styles.optionText}>Tag people</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow}>
            <Ionicons name="location-outline" size={22} color={Colors.text} />
            <Text style={styles.optionText}>Add location</Text>
          </TouchableOpacity>

          {activeTab === 'reel' && (
            <TouchableOpacity style={styles.optionRow}>
              <Ionicons name="musical-notes-outline" size={22} color={Colors.text} />
              <Text style={styles.optionText}>Add music</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={styles.previewFooter}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handlePost}
            disabled={loading}
          >
            <LinearGradient
              colors={['#00d9ff', '#00ffcc']}
              style={styles.shareButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.shareButtonText}>Share</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Camera Screen
  return (
    <View style={styles.container}>
      {/* Camera View */}
      {hasPermission ? (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraFacing}
          flash={flashMode}
        >
          {/* Top Bar */}
          <SafeAreaView style={styles.topBar} edges={['top']}>
            <TouchableOpacity onPress={() => router.back()} style={styles.topButton}>
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={toggleFlash} style={styles.topButton}>
              <Ionicons 
                name={flashMode === 'off' ? 'flash-off' : 'flash'} 
                size={26} 
                color="#fff" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.topButton}>
              <Ionicons name="settings-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Side Tools */}
          <View style={styles.sideTools}>
            <TouchableOpacity 
              style={[styles.sideTool, activeMode === 'create' && styles.activeModeTool]}
              onPress={() => switchMode('create')}
            >
              <Text style={styles.aaText}>Aa</Text>
              <Text style={styles.sideToolText}>Create</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.sideTool, activeMode === 'boomerang' && styles.activeModeTool]}
              onPress={() => switchMode('boomerang')}
            >
              <MaterialCommunityIcons name="infinity" size={24} color="#fff" />
              <Text style={styles.sideToolText}>Boomerang</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.sideTool, activeMode === 'layout' && styles.activeModeTool]}
              onPress={() => switchMode('layout')}
            >
              <Ionicons name="grid-outline" size={22} color="#fff" />
              <Text style={styles.sideToolText}>Layout</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideTool}>
              <Ionicons name="chevron-down" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {/* Gallery & Capture & Switch Camera */}
            <View style={styles.captureRow}>
              <TouchableOpacity onPress={pickFromGallery} style={styles.galleryButton}>
                <Ionicons name="images" size={26} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
                <View style={styles.captureOuter}>
                  <View style={styles.captureInner} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleCameraFacing} style={styles.switchCameraButton}>
                <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Filter Circles */}
            <View style={styles.filterRow}>
              <View style={styles.filterCircle}>
                <View style={styles.filterInner} />
              </View>
              <LinearGradient
                colors={['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3']}
                style={styles.filterCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Image
                source={{ uri: 'https://via.placeholder.com/50' }}
                style={styles.filterCircle}
              />
            </View>

            {/* Tab Bar */}
            <View style={styles.tabBar}>
              <TouchableOpacity onPress={pickFromGallery} style={styles.tabGalleryIcon}>
                <Ionicons name="images-outline" size={24} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.tabItem} 
                onPress={() => switchTab('post')}
              >
                <Text style={[styles.tabText, activeTab === 'post' && styles.activeTabText]}>
                  POST
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.tabItem} 
                onPress={() => switchTab('story')}
              >
                <Text style={[styles.tabText, activeTab === 'story' && styles.activeTabText]}>
                  STORY
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.tabItem} 
                onPress={() => switchTab('reel')}
              >
                <Text style={[styles.tabText, activeTab === 'reel' && styles.activeTabText]}>
                  REEL
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.tabGalleryIcon}>
                <Ionicons name="sync-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      ) : (
        <View style={styles.noCameraContainer}>
          <Ionicons name="camera-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.noCameraText}>Camera permission required</Text>
          <TouchableOpacity style={styles.grantButton} onPress={pickFromGallery}>
            <Text style={styles.grantButtonText}>Use Gallery Instead</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topButton: {
    padding: 8,
  },
  sideTools: {
    position: 'absolute',
    left: 16,
    top: '35%',
    gap: 24,
  },
  sideTool: {
    alignItems: 'center',
    gap: 4,
  },
  activeModeTool: {
    opacity: 1,
  },
  aaText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  sideToolText: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.9,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 50,
    marginBottom: 20,
  },
  galleryButton: {
    padding: 10,
  },
  captureButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureOuter: {
    width: 75,
    height: 75,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  switchCameraButton: {
    padding: 10,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  filterCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  filterInner: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 3,
    borderRadius: 22,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  tabGalleryIcon: {
    padding: 8,
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
  },
  activeTabText: {
    color: '#fff',
  },
  noCameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  noCameraText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  grantButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  grantButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  // Preview styles
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  previewContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  previewImageContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: height * 0.5,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  squarePreview: {
    aspectRatio: 1,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  captionContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  captionInput: {
    fontSize: 15,
    color: Colors.text,
    minHeight: 60,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 14,
  },
  optionText: {
    fontSize: 15,
    color: Colors.text,
  },
  previewFooter: {
    padding: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  shareButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  shareButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});

import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';

const { width, height } = Dimensions.get('window');

export default function ReelCreateScreen() {
  const router = useRouter();
  const [video, setVideo] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioName, setAudioName] = useState('Original audio');
  const [showEffects, setShowEffects] = useState(false);

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
      base64: true,
      videoMaxDuration: 90,
    });

    if (!result.canceled && result.assets[0]) {
      setVideo(result.assets[0].base64);
      setThumbnail(result.assets[0].uri);
    }
  };

  const recordVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
      base64: true,
      videoMaxDuration: 90,
    });

    if (!result.canceled && result.assets[0]) {
      setVideo(result.assets[0].base64);
      setThumbnail(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!video) {
      Alert.alert('Error', 'Please select a video');
      return;
    }

    setLoading(true);
    try {
      await api.post('/reels', {
        video: video,
        caption: caption || null,
        audio_name: audioName,
      });
      
      Alert.alert('Success', 'Reel posted successfully!');
      router.replace('/(tabs)/reels');
    } catch (error) {
      console.error('Error posting reel:', error);
      Alert.alert('Error', 'Failed to post reel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Reel</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Video Preview */}
        {video ? (
          <View style={styles.videoContainer}>
            <Image
              source={{ uri: thumbnail || 'data:image/jpeg;base64,' + video }}
              style={styles.videoPreview}
              resizeMode="cover"
            />
            <View style={styles.videoOverlay}>
              <Ionicons name="play" size={50} color="#fff" />
            </View>
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => { setVideo(null); setThumbnail(null); }}
            >
              <Ionicons name="close-circle" size={32} color="#fff" />
            </TouchableOpacity>
            
            {/* Video Edit Tools */}
            <View style={styles.editTools}>
              <TouchableOpacity style={styles.editTool}>
                <Ionicons name="musical-notes" size={20} color="#fff" />
                <Text style={styles.editToolText}>Music</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editTool}>
                <Ionicons name="color-wand" size={20} color="#fff" />
                <Text style={styles.editToolText}>Effects</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editTool}>
                <Ionicons name="text" size={20} color="#fff" />
                <Text style={styles.editToolText}>Text</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editTool}>
                <Ionicons name="happy" size={20} color="#fff" />
                <Text style={styles.editToolText}>Stickers</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <View style={styles.uploadOptions}>
              <TouchableOpacity style={styles.uploadOption} onPress={pickVideo}>
                <View style={styles.uploadIconBg}>
                  <Ionicons name="videocam" size={32} color={Colors.primary} />
                </View>
                <Text style={styles.uploadText}>Gallery</Text>
                <Text style={styles.uploadSubtext}>Select video</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.uploadOption} onPress={recordVideo}>
                <View style={styles.uploadIconBg}>
                  <Ionicons name="camera" size={32} color={Colors.primary} />
                </View>
                <Text style={styles.uploadText}>Record</Text>
                <Text style={styles.uploadSubtext}>Up to 90 sec</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.hintText}>Vertical videos work best (9:16)</Text>
          </View>
        )}

        {/* Caption Input */}
        <View style={styles.captionContainer}>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption... Add #hashtags and @mentions"
            placeholderTextColor={Colors.textSecondary}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={2200}
          />
          <Text style={styles.charCount}>{caption.length}/2200</Text>
        </View>

        {/* Audio Section */}
        <TouchableOpacity style={styles.optionItem}>
          <Ionicons name="musical-notes-outline" size={24} color={Colors.text} />
          <View style={styles.optionContent}>
            <Text style={styles.optionText}>Add music</Text>
            <Text style={styles.optionSubtext}>{audioName}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Tag People */}
        <TouchableOpacity style={styles.optionItem}>
          <Ionicons name="person-outline" size={24} color={Colors.text} />
          <View style={styles.optionContent}>
            <Text style={styles.optionText}>Tag people</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Add Location */}
        <TouchableOpacity style={styles.optionItem}>
          <Ionicons name="location-outline" size={24} color={Colors.text} />
          <View style={styles.optionContent}>
            <Text style={styles.optionText}>Add location</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Remix Settings */}
        <TouchableOpacity style={styles.optionItem}>
          <Ionicons name="git-compare-outline" size={24} color={Colors.text} />
          <View style={styles.optionContent}>
            <Text style={styles.optionText}>Remix</Text>
            <Text style={styles.optionSubtext}>Allow others to remix this reel</Text>
          </View>
          <Ionicons name="toggle" size={36} color={Colors.primary} />
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          style={[styles.shareButton, !video && styles.shareButtonDisabled]}
          onPress={handlePost}
          disabled={loading || !video}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={video ? ['#00d9ff', '#00ffcc'] : [Colors.border, Colors.border]}
            style={styles.shareButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Ionicons name="play-circle" size={24} color="#000" />
                <Text style={styles.shareButtonText}>Share Reel</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Also Share To */}
        <View style={styles.alsoShareSection}>
          <Text style={styles.alsoShareTitle}>Also share to</Text>
          <View style={styles.shareToOptions}>
            <TouchableOpacity style={styles.shareToOption}>
              <Ionicons name="logo-facebook" size={20} color={Colors.textSecondary} />
              <Text style={styles.shareToText}>Facebook</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  videoContainer: {
    margin: 16,
    aspectRatio: 9 / 16,
    maxHeight: 400,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.cardBackground,
  },
  videoPreview: {
    width: '100%',
    height: '100%',
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
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  editTools: {
    position: 'absolute',
    right: 12,
    top: '30%',
    gap: 20,
  },
  editTool: {
    alignItems: 'center',
    gap: 4,
  },
  editToolText: {
    fontSize: 10,
    color: '#fff',
  },
  placeholderContainer: {
    margin: 16,
    aspectRatio: 9 / 16,
    maxHeight: 400,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: 48,
    marginBottom: 24,
  },
  uploadOption: {
    alignItems: 'center',
    gap: 8,
  },
  uploadIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  uploadSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  hintText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  captionContainer: {
    marginHorizontal: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  captionInput: {
    fontSize: 15,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 14,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 15,
    color: Colors.text,
  },
  optionSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  shareButton: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  alsoShareSection: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  alsoShareTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  shareToOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareToOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
  },
  shareToText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});

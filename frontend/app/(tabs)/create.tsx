import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function CreateScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('post'); // 'post', 'reel', 'story'
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState('image'); // 'image' or 'video'
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [aiProvider, setAiProvider] = useState('openai');
  const [aiLoading, setAiLoading] = useState(false);

  const getAspectRatio = () => {
    switch (activeTab) {
      case 'post':
        return [1, 1];
      case 'reel':
      case 'story':
        return [9, 16];
      default:
        return [1, 1];
    }
  };

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permission is required');
      return;
    }

    const isReelOrStory = activeTab === 'reel' || activeTab === 'story';
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: isReelOrStory ? ['images', 'videos'] : ['images'],
      allowsEditing: true,
      aspect: getAspectRatio(),
      quality: 0.8,
      base64: true,
      videoMaxDuration: activeTab === 'reel' ? 90 : 60,
    });

    if (!result.canceled && result.assets[0].base64) {
      setMedia(result.assets[0].base64);
      setMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
    }
  };

  const takeMedia = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: getAspectRatio(),
      quality: 0.8,
      base64: true,
      videoMaxDuration: activeTab === 'reel' ? 90 : 60,
    });

    if (!result.canceled && result.assets[0].base64) {
      setMedia(result.assets[0].base64);
      setMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
    }
  };

  const generateAICaption = async () => {
    setAiLoading(true);
    try {
      const response = await api.post('/ai/caption', {
        image_description: caption || 'a beautiful moment',
        provider: aiProvider,
      });
      setCaption(response.data.caption);
      Alert.alert('Success', 'AI caption generated!');
    } catch (error) {
      console.error('Error generating caption:', error);
      Alert.alert('Error', 'Failed to generate caption');
    } finally {
      setAiLoading(false);
    }
  };

  const generateAIImage = async () => {
    setAiLoading(true);
    try {
      const prompt = caption || 'A beautiful landscape with mountains and sunset';
      const response = await api.post('/ai/image', {
        prompt,
        provider: aiProvider,
      });
      setMedia(response.data.image);
      setMediaType('image');
      Alert.alert('Success', 'AI image generated!');
    } catch (error) {
      console.error('Error generating image:', error);
      Alert.alert('Error', 'Failed to generate image');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePost = async () => {
    if (!media) {
      Alert.alert('Error', 'Please select media');
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
          audio_name: 'Original audio',
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
        post: 'Post created successfully!',
        reel: 'Reel posted successfully!',
        story: 'Story uploaded successfully!',
      };
      
      Alert.alert('Success', successMessages[activeTab]);
      setMedia(null);
      setCaption('');
      
      if (activeTab === 'reel') {
        router.push('/(tabs)/reels');
      } else {
        router.push('/(tabs)/home');
      }
    } catch (error) {
      console.error('Error creating:', error);
      Alert.alert('Error', 'Failed to create ' + activeTab);
    } finally {
      setLoading(false);
    }
  };

  const getMediaPreviewStyle = () => {
    if (activeTab === 'post') {
      return styles.squarePreview;
    }
    return styles.verticalPreview;
  };

  const getPlaceholderStyle = () => {
    if (activeTab === 'post') {
      return styles.squarePlaceholder;
    }
    return styles.verticalPlaceholder;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create</Text>
        <TouchableOpacity onPress={() => setShowAIOptions(true)}>
          <LinearGradient
            colors={['#00d9ff', '#00ffcc']}
            style={styles.aiButton}
          >
            <Ionicons name="sparkles" size={18} color="#000" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'post' && styles.activeTab]}
          onPress={() => { setActiveTab('post'); setMedia(null); }}
        >
          <Ionicons name="grid-outline" size={20} color={activeTab === 'post' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'post' && styles.activeTabText]}>Post</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'reel' && styles.activeTab]}
          onPress={() => { setActiveTab('reel'); setMedia(null); }}
        >
          <Ionicons name="play-circle-outline" size={20} color={activeTab === 'reel' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'reel' && styles.activeTabText]}>Reel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'story' && styles.activeTab]}
          onPress={() => { setActiveTab('story'); setMedia(null); }}
        >
          <Ionicons name="add-circle-outline" size={20} color={activeTab === 'story' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'story' && styles.activeTabText]}>Story</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Media Preview */}
        {media ? (
          <View style={[styles.mediaContainer, getMediaPreviewStyle()]}>
            <Image
              source={{ uri: 'data:image/jpeg;base64,' + media }}
              style={styles.mediaPreview}
              resizeMode="cover"
            />
            {mediaType === 'video' && (
              <View style={styles.videoIndicator}>
                <Ionicons name="play" size={40} color="#fff" />
              </View>
            )}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => setMedia(null)}
            >
              <Ionicons name="close-circle" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.placeholderContainer, getPlaceholderStyle()]}>
            <View style={styles.uploadOptions}>
              <TouchableOpacity style={styles.uploadOption} onPress={pickMedia}>
                <View style={styles.uploadIconBg}>
                  <Ionicons name="images" size={28} color={Colors.primary} />
                </View>
                <Text style={styles.uploadText}>Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.uploadOption} onPress={takeMedia}>
                <View style={styles.uploadIconBg}>
                  <Ionicons name="camera" size={28} color={Colors.primary} />
                </View>
                <Text style={styles.uploadText}>Camera</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.hintText}>
              {activeTab === 'post' && 'Square photos work best'}
              {activeTab === 'reel' && 'Vertical videos up to 90 seconds'}
              {activeTab === 'story' && 'Photos or videos up to 60 seconds'}
            </Text>
          </View>
        )}

        {/* Caption Input (not for stories) */}
        {activeTab !== 'story' && (
          <View style={styles.captionContainer}>
            <TextInput
              style={styles.captionInput}
              placeholder={activeTab === 'reel' ? 'Write a caption... Add #hashtags' : 'Write a caption...'}
              placeholderTextColor={Colors.textSecondary}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={2200}
            />
            <Text style={styles.charCount}>{caption.length}/2200</Text>
          </View>
        )}

        {/* Additional Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionItem}>
            <Ionicons name="location-outline" size={22} color={Colors.text} />
            <Text style={styles.optionText}>Add location</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.optionItem}>
            <Ionicons name="person-outline" size={22} color={Colors.text} />
            <Text style={styles.optionText}>Tag people</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          {activeTab === 'reel' && (
            <TouchableOpacity style={styles.optionItem}>
              <Ionicons name="musical-notes-outline" size={22} color={Colors.text} />
              <Text style={styles.optionText}>Add music</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Share Button */}
        <TouchableOpacity
          style={[styles.shareButton, !media && styles.shareButtonDisabled]}
          onPress={handlePost}
          disabled={loading || !media}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={media ? ['#00d9ff', '#00ffcc'] : [Colors.border, Colors.border]}
            style={styles.shareButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.shareButtonText}>
                  {activeTab === 'post' && 'Share Post'}
                  {activeTab === 'reel' && 'Share Reel'}
                  {activeTab === 'story' && 'Share to Story'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#000" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* AI Options Modal */}
      <Modal
        visible={showAIOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAIOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Assistant</Text>
              <TouchableOpacity onPress={() => setShowAIOptions(false)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.providerContainer}>
              <Text style={styles.sectionTitle}>Choose AI Provider</Text>
              <View style={styles.providerButtons}>
                <TouchableOpacity
                  style={[styles.providerButton, aiProvider === 'openai' && styles.providerButtonActive]}
                  onPress={() => setAiProvider('openai')}
                >
                  <Text style={[styles.providerButtonText, aiProvider === 'openai' && styles.providerButtonTextActive]}>
                    OpenAI (GPT + DALL-E)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.providerButton, aiProvider === 'gemini' && styles.providerButtonActive]}
                  onPress={() => setAiProvider('gemini')}
                >
                  <Text style={[styles.providerButtonText, aiProvider === 'gemini' && styles.providerButtonTextActive]}>
                    Google Gemini
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.aiActions}>
              <TouchableOpacity
                style={styles.aiActionButton}
                onPress={generateAICaption}
                disabled={aiLoading}
              >
                <Ionicons name="text" size={24} color={Colors.primary} />
                <View style={styles.aiActionInfo}>
                  <Text style={styles.aiActionText}>Generate Caption</Text>
                  <Text style={styles.aiActionSubtext}>AI will create a caption</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.aiActionButton}
                onPress={generateAIImage}
                disabled={aiLoading}
              >
                <Ionicons name="image" size={24} color={Colors.primary} />
                <View style={styles.aiActionInfo}>
                  <Text style={styles.aiActionText}>Generate Image</Text>
                  <Text style={styles.aiActionSubtext}>AI will create an image from caption</Text>
                </View>
              </TouchableOpacity>
            </View>

            {aiLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>AI is working...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  aiButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  mediaContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  squarePreview: {
    aspectRatio: 1,
  },
  verticalPreview: {
    aspectRatio: 9 / 16,
    maxHeight: 450,
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.border,
  },
  videoIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  placeholderContainer: {
    margin: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  squarePlaceholder: {
    aspectRatio: 1,
  },
  verticalPlaceholder: {
    aspectRatio: 9 / 16,
    maxHeight: 400,
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 16,
  },
  uploadOption: {
    alignItems: 'center',
    gap: 8,
  },
  uploadIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
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
  optionsContainer: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
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
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  providerContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  providerButtons: {
    gap: 10,
  },
  providerButton: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: Colors.cardBackground,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  providerButtonActive: {
    borderColor: Colors.primary,
  },
  providerButtonText: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
  },
  providerButtonTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  aiActions: {
    paddingHorizontal: 16,
    gap: 12,
  },
  aiActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    gap: 12,
  },
  aiActionInfo: {
    flex: 1,
  },
  aiActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  aiActionSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
});

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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

type AIProvider = 'openai' | 'gemini';

export default function CreateScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [aiProvider, setAiProvider] = useState<AIProvider>('openai');
  const [aiLoading, setAiLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(result.assets[0].base64);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(result.assets[0].base64);
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
      setImage(response.data.image);
      Alert.alert('Success', 'AI image generated!');
    } catch (error) {
      console.error('Error generating image:', error);
      Alert.alert('Error', 'Failed to generate image. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePost = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select or generate an image');
      return;
    }

    setLoading(true);
    try {
      await api.post('/posts', {
        image,
        caption: caption || null,
      });
      Alert.alert('Success', 'Post created successfully!');
      setImage(null);
      setCaption('');
      router.push('/(tabs)/home');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity onPress={() => setShowAIOptions(true)}>
            <LinearGradient
              colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
              style={styles.aiButton}
            >
              <Ionicons name="sparkles" size={20} color={Colors.background} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Image Preview */}
        {image ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${image}` }}
              style={styles.image}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setImage(null)}
            >
              <Ionicons name="close-circle" size={32} color={Colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Ionicons name="images-outline" size={32} color={Colors.primary} />
                <Text style={styles.uploadButtonText}>Choose Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={32} color={Colors.primary} />
                <Text style={styles.uploadButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Caption Input */}
        <View style={styles.captionContainer}>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            placeholderTextColor={Colors.textSecondary}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={500}
          />
          <Text style={styles.characterCount}>{caption.length}/500</Text>
        </View>

        {/* Post Button */}
        <TouchableOpacity
          style={[styles.postButton, !image && styles.postButtonDisabled]}
          onPress={handlePost}
          disabled={loading || !image}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={image ? [Colors.primaryGradientStart, Colors.primaryGradientEnd] : [Colors.border, Colors.border]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.postButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.postButtonText}>
                {image ? 'Share Post' : 'Select Image to Post'}
              </Text>
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

            {/* Provider Selection */}
            <View style={styles.providerContainer}>
              <Text style={styles.sectionTitle}>Choose AI Provider</Text>
              <View style={styles.providerButtons}>
                <TouchableOpacity
                  style={[
                    styles.providerButton,
                    aiProvider === 'openai' && styles.providerButtonActive,
                  ]}
                  onPress={() => setAiProvider('openai')}
                >
                  <Text
                    style={[
                      styles.providerButtonText,
                      aiProvider === 'openai' && styles.providerButtonTextActive,
                    ]}
                  >
                    OpenAI GPT-4 + DALL-E
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.providerButton,
                    aiProvider === 'gemini' && styles.providerButtonActive,
                  ]}
                  onPress={() => setAiProvider('gemini')}
                >
                  <Text
                    style={[
                      styles.providerButtonText,
                      aiProvider === 'gemini' && styles.providerButtonTextActive,
                    ]}
                  >
                    Google Gemini + Nano Banana
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* AI Actions */}
            <View style={styles.aiActions}>
              <TouchableOpacity
                style={styles.aiActionButton}
                onPress={generateAICaption}
                disabled={aiLoading}
              >
                <Ionicons name="text" size={24} color={Colors.primary} />
                <Text style={styles.aiActionText}>Generate Caption</Text>
                <Text style={styles.aiActionSubtext}>AI will create a caption</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.aiActionButton}
                onPress={generateAIImage}
                disabled={aiLoading}
              >
                <Ionicons name="image" size={24} color={Colors.primary} />
                <Text style={styles.aiActionText}>Generate Image</Text>
                <Text style={styles.aiActionSubtext}>AI will create an image</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  aiButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  placeholderContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    aspectRatio: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 24,
  },
  uploadButton: {
    alignItems: 'center',
    padding: 20,
  },
  uploadButtonText: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 8,
  },
  captionContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
  },
  captionInput: {
    fontSize: 16,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 8,
  },
  postButton: {
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  postButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  providerContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  providerButtons: {
    gap: 12,
  },
  providerButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  providerButtonActive: {
    borderColor: Colors.primary,
  },
  providerButtonText: {
    fontSize: 15,
    color: Colors.text,
    textAlign: 'center',
  },
  providerButtonTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  aiActions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  aiActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    gap: 12,
  },
  aiActionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  aiActionSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    position: 'absolute',
    left: 56,
    bottom: 12,
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

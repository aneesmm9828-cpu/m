import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { uploadMedia, createStory } from '../../utils/supabaseHelpers';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const STICKER_TYPES = [
  { id: 'mention', icon: 'at', label: 'Mention' },
  { id: 'location', icon: 'location', label: 'Location' },
  { id: 'poll', icon: 'stats-chart', label: 'Poll' },
  { id: 'question', icon: 'help-circle', label: 'Question' },
  { id: 'quiz', icon: 'school', label: 'Quiz' },
  { id: 'countdown', icon: 'time', label: 'Countdown' },
  { id: 'music', icon: 'musical-notes', label: 'Music' },
  { id: 'gif', icon: 'happy', label: 'GIF' },
  { id: 'link', icon: 'link', label: 'Link' },
];

export default function StoryCreateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const { showPopup, hidePopup, updateProgress } = useUIStore();

  const [image, setImage] = useState(params.image || null);
  const [mediaType, setMediaType] = useState(params.mediaType || 'image');
  const [showStickers, setShowStickers] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textOverlay, setTextOverlay] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(24);
  const [isUploading, setIsUploading] = useState(false);

  // Sticker States
  const [showPollModal, setShowPollModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showMentionModal, setShowMentionModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Poll State
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['Yes', 'No']);
  const [activePoll, setActivePoll] = useState(null);

  // Question State
  const [questionText, setQuestionText] = useState('Ask me anything');
  const [activeQuestion, setActiveQuestion] = useState(null);

  // Mention State
  const [mentionUser, setMentionUser] = useState('');
  const [activeMention, setActiveMention] = useState(null);

  // Location State
  const [locationText, setLocationText] = useState('');
  const [activeLocation, setActiveLocation] = useState(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
      base64: true,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].base64);
      setMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
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
      aspect: [9, 16],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].base64);
      setMediaType('image');
    }
  };

  const handleStickerSelect = (stickerId) => {
    setShowStickers(false);

    switch (stickerId) {
      case 'mention':
        setShowMentionModal(true);
        break;
      case 'location':
        setShowLocationModal(true);
        break;
      case 'poll':
        setShowPollModal(true);
        break;
      case 'question':
        setShowQuestionModal(true);
        break;
      case 'quiz':
        Alert.alert('Quiz', 'Quiz sticker coming soon!');
        break;
      case 'countdown':
        Alert.alert('Countdown', 'Countdown sticker coming soon!');
        break;
      case 'music':
        Alert.alert('Music', 'Music sticker coming soon!');
        break;
      case 'gif':
        Alert.alert('GIF', 'GIF sticker coming soon!');
        break;
      case 'link':
        Alert.alert('Link', 'Link sticker coming soon!');
        break;
    }
  };

  const addPoll = () => {
    if (!pollQuestion.trim()) {
      Alert.alert('Error', 'Please enter a poll question');
      return;
    }
    setActivePoll({
      question: pollQuestion,
      options: pollOptions.filter(o => o.trim()),
    });
    setShowPollModal(false);
    setPollQuestion('');
    setPollOptions(['Yes', 'No']);
  };

  const addQuestion = () => {
    setActiveQuestion({
      text: questionText || 'Ask me anything',
    });
    setShowQuestionModal(false);
    setQuestionText('Ask me anything');
  };

  const addMention = () => {
    if (!mentionUser.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }
    setActiveMention({
      username: mentionUser,
    });
    setShowMentionModal(false);
    setMentionUser('');
  };

  const addLocation = () => {
    if (!locationText.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }
    setActiveLocation({
      name: locationText,
    });
    setShowLocationModal(false);
    setLocationText('');
  };

  const uploadStory = async () => {
    if (!image || !user) {
      Alert.alert('Error', 'Please select an image or video');
      return;
    }

    setIsUploading(true);
    showPopup('upload', 'Uploading to Story...', 10);

    try {
      const filename = `stories/${user.user_id}/story_${Date.now()}.jpg`;

      // 1. Upload to Supabase Storage
      const publicUrl = await uploadMedia('media', filename, image);

      if (!publicUrl) {
          throw new Error('STORAGE_UPLOAD_FAILED');
      }

      updateProgress(60);
      showPopup('upload', 'Finalizing story...', 60);

      // 2. Create Database Record
      const storyData = {
        mediaUrl: publicUrl,
        media_type: mediaType,
        text_overlay: textOverlay || null,
        poll: activePoll || null,
        question: activeQuestion || null,
        mention: activeMention || null,
        location: activeLocation || null,
      };

      const result = await createStory(user.user_id, storyData);

      if (!result) throw new Error('DB_INSERT_FAILED');

      updateProgress(100);
      showPopup('success', 'Story shared successfully!');
      router.back();
    } catch (error: any) {
      console.error('Error uploading story:', error);
      if (error.message === 'STORAGE_BUCKET_MISSING') {
          showPopup('error', 'Storage bucket "media" missing');
      } else {
          showPopup('error', 'Failed to upload story');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const TEXT_COLORS = ['#ffffff', '#000000', '#ff3b5c', '#00d9ff', '#4fffb0', '#ffd700', '#ff6b35'];

  if (!image) {
    // Image Selection Screen
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add to Story</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.pickerContainer}>
          <TouchableOpacity style={styles.pickerOption} onPress={takePhoto}>
            <LinearGradient
              colors={['#00d9ff', '#00ffcc']}
              style={styles.pickerIconBg}
            >
              <Ionicons name="camera" size={40} color="#fff" />
            </LinearGradient>
            <Text style={styles.pickerText}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickerOption} onPress={pickImage}>
            <LinearGradient
              colors={['#ff6b35', '#ff3b5c']}
              style={styles.pickerIconBg}
            >
              <Ionicons name="images" size={40} color="#fff" />
            </LinearGradient>
            <Text style={styles.pickerText}>Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Story Editor Screen
  return (
    <View style={styles.container}>
      {/* Story Preview */}
      <Image
        source={{ uri: 'data:image/jpeg;base64,' + image }}
        style={styles.previewImage}
        resizeMode="cover"
      />

      {/* Text Overlay */}
      {textOverlay ? (
        <View style={[styles.textOverlayContainer, { top: textPosition.y + '%', left: textPosition.x + '%' }]}>
          <Text style={[styles.textOverlay, { color: textColor, fontSize: textSize }]}>{textOverlay}</Text>
        </View>
      ) : null}

      {/* Stickers Display */}
      {activePoll && (
        <View style={styles.pollSticker}>
          <Text style={styles.pollQuestion}>{activePoll.question}</Text>
          {activePoll.options.map((opt, idx) => (
            <View key={idx} style={styles.pollOption}>
              <Text style={styles.pollOptionText}>{opt}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.removeSticker} onPress={() => setActivePoll(null)}>
            <Ionicons name="close-circle" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {activeQuestion && (
        <View style={styles.questionSticker}>
          <Text style={styles.questionText}>{activeQuestion.text}</Text>
          <View style={styles.questionInput}>
            <Text style={styles.questionInputText}>Type your answer...</Text>
          </View>
          <TouchableOpacity style={styles.removeSticker} onPress={() => setActiveQuestion(null)}>
            <Ionicons name="close-circle" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {activeMention && (
        <View style={styles.mentionSticker}>
          <Text style={styles.mentionText}>@{activeMention.username}</Text>
          <TouchableOpacity style={styles.removeSticker} onPress={() => setActiveMention(null)}>
            <Ionicons name="close-circle" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {activeLocation && (
        <View style={styles.locationSticker}>
          <Ionicons name="location" size={16} color="#fff" />
          <Text style={styles.locationText}>{activeLocation.name}</Text>
          <TouchableOpacity style={styles.removeSticker} onPress={() => setActiveLocation(null)}>
            <Ionicons name="close-circle" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity onPress={() => setImage(null)}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.topActions}>
          <TouchableOpacity style={styles.topButton} onPress={() => setShowTextInput(true)}>
            <Ionicons name="text" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topButton} onPress={() => setShowStickers(true)}>
            <Ionicons name="happy-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={uploadStory}
          disabled={isUploading}
        >
          <LinearGradient
            colors={['#00d9ff', '#00ffcc']}
            style={styles.uploadButtonGradient}
          >
            <Text style={styles.uploadButtonText}>
              {isUploading ? 'Uploading...' : 'Share to Story'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#000" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Stickers Modal */}
      <Modal
        visible={showStickers}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStickers(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.stickersModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Stickers</Text>
              <TouchableOpacity onPress={() => setShowStickers(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.stickersGrid}>
              {STICKER_TYPES.map((sticker) => (
                <TouchableOpacity
                  key={sticker.id}
                  style={styles.stickerItem}
                  onPress={() => handleStickerSelect(sticker.id)}
                >
                  <View style={styles.stickerIcon}>
                    <Ionicons name={sticker.icon} size={28} color={Colors.primary} />
                  </View>
                  <Text style={styles.stickerLabel}>{sticker.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Text Input Modal */}
      <Modal
        visible={showTextInput}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowTextInput(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.textInputModal}
        >
          <TouchableOpacity style={styles.textInputOverlay} onPress={() => setShowTextInput(false)} />

          <View style={styles.textInputContainer}>
            <TextInput
              style={[styles.textInputField, { color: textColor, fontSize: textSize }]}
              placeholder="Type something..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={textOverlay}
              onChangeText={setTextOverlay}
              multiline
              autoFocus
            />

            <View style={styles.textColorPicker}>
              {TEXT_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    textColor === color && styles.colorOptionActive,
                  ]}
                  onPress={() => setTextColor(color)}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.textDoneButton}
              onPress={() => setShowTextInput(false)}
            >
              <Text style={styles.textDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Poll Modal */}
      <Modal
        visible={showPollModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPollModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.stickerInputModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Poll</Text>
              <TouchableOpacity onPress={() => setShowPollModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.stickerInput}
              placeholder="Ask a question..."
              placeholderTextColor={Colors.textSecondary}
              value={pollQuestion}
              onChangeText={setPollQuestion}
            />

            {pollOptions.map((opt, idx) => (
              <TextInput
                key={idx}
                style={styles.stickerInput}
                placeholder={'Option ' + (idx + 1)}
                placeholderTextColor={Colors.textSecondary}
                value={opt}
                onChangeText={(text) => {
                  const newOpts = [...pollOptions];
                  newOpts[idx] = text;
                  setPollOptions(newOpts);
                }}
              />
            ))}

            {pollOptions.length < 4 && (
              <TouchableOpacity
                style={styles.addOptionButton}
                onPress={() => setPollOptions([...pollOptions, ''])}
              >
                <Ionicons name="add" size={20} color={Colors.primary} />
                <Text style={styles.addOptionText}>Add option</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.stickerSubmitButton} onPress={addPoll}>
              <Text style={styles.stickerSubmitText}>Add Poll</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Question Modal */}
      <Modal
        visible={showQuestionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQuestionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.stickerInputModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Question Sticker</Text>
              <TouchableOpacity onPress={() => setShowQuestionModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.stickerInput}
              placeholder="Ask me anything"
              placeholderTextColor={Colors.textSecondary}
              value={questionText}
              onChangeText={setQuestionText}
            />

            <TouchableOpacity style={styles.stickerSubmitButton} onPress={addQuestion}>
              <Text style={styles.stickerSubmitText}>Add Question</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Mention Modal */}
      <Modal
        visible={showMentionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMentionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.stickerInputModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mention Someone</Text>
              <TouchableOpacity onPress={() => setShowMentionModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.stickerInput}
              placeholder="@username"
              placeholderTextColor={Colors.textSecondary}
              value={mentionUser}
              onChangeText={setMentionUser}
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.stickerSubmitButton} onPress={addMention}>
              <Text style={styles.stickerSubmitText}>Add Mention</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Location Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.stickerInputModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Location</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.stickerInput}
              placeholder="Search location..."
              placeholderTextColor={Colors.textSecondary}
              value={locationText}
              onChangeText={setLocationText}
            />

            <TouchableOpacity style={styles.stickerSubmitButton} onPress={addLocation}>
              <Text style={styles.stickerSubmitText}>Add Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  pickerContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  pickerOption: {
    alignItems: 'center',
    gap: 12,
  },
  pickerIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  previewImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
  },
  textOverlayContainer: {
    position: 'absolute',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
  textOverlay: {
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  topActions: {
    flexDirection: 'row',
    gap: 16,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
  },
  uploadButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  uploadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  stickersModal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  stickersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  stickerItem: {
    width: (SCREEN_WIDTH - 80) / 4,
    alignItems: 'center',
    gap: 8,
  },
  stickerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerLabel: {
    fontSize: 12,
    color: Colors.text,
  },
  textInputModal: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  textInputOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  textInputContainer: {
    padding: 20,
  },
  textInputField: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    minHeight: 100,
  },
  textColorPicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionActive: {
    borderColor: '#fff',
  },
  textDoneButton: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  textDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  stickerInputModal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  stickerInput: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    fontSize: 16,
    color: Colors.text,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
  },
  addOptionText: {
    fontSize: 14,
    color: Colors.primary,
  },
  stickerSubmitButton: {
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    alignItems: 'center',
  },
  stickerSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  // Sticker Display Styles
  pollSticker: {
    position: 'absolute',
    top: '40%',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
  },
  pollQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  pollOption: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  pollOptionText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
  questionSticker: {
    position: 'absolute',
    top: '40%',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  questionInput: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  questionInputText: {
    fontSize: 14,
    color: '#999',
  },
  mentionSticker: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  mentionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  locationSticker: {
    position: 'absolute',
    top: '25%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  removeSticker: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { uploadMedia, createPost } from '../../utils/supabaseHelpers';
import VoiceNoteRecorder from '../../components/voice/VoiceNoteRecorder';
import { supabase } from '../../utils/supabaseConfig';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

export default function CreatePostScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { showPopup, hidePopup, updateProgress } = useUIStore();
  const [media, setMedia] = useState<{base64: string, type: string, uri: string}[]>([]);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    pickImages();
  }, []);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: 20,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const selectedMedia = result.assets.map(asset => ({
        base64: asset.base64 || '',
        type: asset.type === 'video' ? 'video' : 'image',
        uri: asset.uri
      }));
      setMedia(selectedMedia);
    }
  };

  const handlePost = async () => {
    if (media.length === 0 || !user) return;

    setLoading(true);
    showPopup('upload', `Uploading 0/${media.length} items...`, 0);

    try {
      const uploadedMediaItems = [];

      for (let i = 0; i < media.length; i++) {
        const item = media[i];
        const extension = item.type === 'video' ? 'mp4' : 'jpg';
        const filename = `posts/${user.user_id}/post_${Date.now()}_${i}.${extension}`;

        const currentProgress = (i / media.length) * 100;
        updateProgress(currentProgress);
        showPopup('upload', `Uploading ${i + 1}/${media.length} items...`, currentProgress);

        const publicUrl = await uploadMedia('media', filename, item.base64);
        if (publicUrl) {
          uploadedMediaItems.push({
            media_url: publicUrl,
            media_type: item.type,
            position: i
          });
        }
      }

      if (uploadedMediaItems.length === 0) throw new Error('Upload failed');

      updateProgress(90);
      showPopup('upload', 'Finalizing post...', 90);

      await createPost(user.user_id, {
        mediaItems: uploadedMediaItems,
        caption: caption.trim(),
      });

      updateProgress(100);
      showPopup('success', 'Post created successfully!');
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error creating post:', error);
      showPopup('error', 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceCaptionComplete = async (uri: string, durationMillis: number) => {
    if (!supabase || !user) return;
    setLoading(true);
    showPopup('upload', 'Uploading voice caption...', 0);

    try {
      const fileName = `${user.user_id}/caption_${Date.now()}.m4a`;
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-notes')
        .upload(fileName, decode(base64), {
          contentType: 'audio/m4a',
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('voice-notes')
        .getPublicUrl(fileName);

      showPopup('upload', 'Transcribing voice...', 50);

      const { data: voiceNote, error: voiceNoteError } = await supabase
        .from('voice_notes')
        .insert({
          owner_id: user.user_id,
          context_type: 'post_caption',
          audio_url: publicUrl,
          duration_seconds: Math.floor(durationMillis / 1000),
        })
        .select()
        .single();

      if (voiceNoteError) throw voiceNoteError;

      showPopup('success', 'Voice caption added! Transcribing...');

      // We will listen for the transcript update or simply let the user know.
      // For MVP, we can just show that it's added.
      setCaption(`[Voice Note added - transcription pending]`);
    } catch (error) {
      console.error('Error handling voice caption:', error);
      showPopup('error', 'Failed to process voice caption');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity onPress={handlePost} disabled={media.length === 0 || loading}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={[styles.shareText, (media.length === 0 || loading) && styles.disabledText]}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {media.length > 0 ? (
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
              {media.map((item, index) => (
                <Image key={index} source={{ uri: item.type === 'video' ? item.uri : `data:image/jpeg;base64,${item.base64}` }} style={styles.previewImage} />
              ))}
            </ScrollView>
            <Text style={styles.imageCount}>{media.length} items selected</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.pickButton} onPress={pickImages}>
            <Ionicons name="image-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.pickText}>Pick images/videos</Text>
          </TouchableOpacity>
        )}

        <View style={styles.captionContainer}>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            placeholderTextColor={Colors.textSecondary}
            value={caption}
            onChangeText={setCaption}
            multiline
          />
          <View style={styles.voiceBtnContainer}>
            <VoiceNoteRecorder onRecordingComplete={handleVoiceCaptionComplete} />
            <Text style={styles.voiceBtnText}>Voice Caption</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  shareText: { fontSize: 16, fontWeight: '600', color: Colors.primary },
  disabledText: { opacity: 0.5 },
  content: { padding: 16 },
  previewScroll: { marginBottom: 10 },
  previewImage: { width: width - 32, height: 300, borderRadius: 12, backgroundColor: Colors.border, marginRight: 10 },
  imageCount: { color: Colors.textSecondary, textAlign: 'center', marginBottom: 10 },
  pickButton: { width: '100%', height: 300, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  pickText: { marginTop: 12, color: Colors.textSecondary },
  captionInput: { flex: 1, fontSize: 16, color: Colors.text, minHeight: 100, textAlignVertical: 'top' },
  captionContainer: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 16, gap: 12 },
  voiceBtnContainer: { alignItems: 'center', gap: 4 },
  voiceBtnText: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
});

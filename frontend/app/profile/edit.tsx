import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { supabase } from '../../utils/supabaseConfig';
import { uploadMedia } from '../../utils/supabaseHelpers';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { Switch } from 'react-native';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { showPopup, updateProgress } = useUIStore();
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [link, setLink] = useState(user?.link || '');
  const [profilePic, setProfilePic] = useState(user?.picture || '');
  const [isPrivate, setIsPrivate] = useState(user?.is_private || false);
  const [musicTitle, setMusicTitle] = useState(user?.profile_music_name || 'Add music to your profile');
  const [loading, setLoading] = useState(false);

  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera roll permission is required to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setProfilePic(`data:image/jpeg;base64,${asset.base64}`);
        } else if (asset.uri) {
          setProfilePic(asset.uri);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const handleSave = async () => {
    if (!user || !supabase) return;

    setLoading(true);
    showPopup('upload', 'Updating profile...', 10);
    try {
      let finalPicUrl = profilePic;

      if (profilePic.startsWith('data:')) {
        console.log('🔄 Uploading new profile picture...');
        showPopup('upload', 'Uploading profile picture...', 30);
        try {
          finalPicUrl = await uploadMedia('media', `profiles/${user.user_id}/profile_${Date.now()}.jpg`, profilePic);
          if (!finalPicUrl) throw new Error('UPLOAD_FAILED');
        } catch (uploadErr: any) {
          if (uploadErr.message === 'STORAGE_BUCKET_MISSING') {
            showPopup('error', 'Storage bucket "media" is missing');
            Alert.alert(
              'Storage Error',
              'The "media" bucket is missing in your Supabase project. Please create a public bucket named "media" in your Supabase dashboard.',
              [{ text: 'OK' }]
            );
            setLoading(false);
            return;
          }
          throw uploadErr;
        }
      }

      console.log('💾 Updating profile in database with URL:', finalPicUrl);
      updateProgress(70);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          username: username,
          bio: bio,
          avatar_url: finalPicUrl,
          is_private: isPrivate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.user_id);

      if (error) throw error;

      // Update both 'picture' and 'avatar_url' in the store to ensure consistency
      const updatedUser = {
        ...user,
        name,
        username,
        bio,
        picture: finalPicUrl,
        avatar_url: finalPicUrl,
        profilePicUrl: finalPicUrl,
        is_private: isPrivate
      };

      setUser(updatedUser);

      updateProgress(100);
      showPopup('success', 'Profile updated successfully!');
      // Navigate back and force a refresh of the previous screen if possible
      router.back();
    } catch (error: any) {
      console.error('Update error:', error);
      showPopup('error', 'Failed to update profile');
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color={Colors.primary} /> : <Ionicons name="checkmark" size={28} color={Colors.primary} />}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.profilePicSection}>
            <TouchableOpacity onPress={handleSelectImage}>
              <Image
                key={profilePic} // Add key to force image refresh when URL changes
                source={{ uri: profilePic || 'https://via.placeholder.com/150' }}
                style={styles.profilePic}
              />
              <Text style={styles.editPicText}>Edit picture</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={Colors.textSecondary} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="Username" placeholderTextColor={Colors.textSecondary} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Bio</Text>
              <TextInput style={[styles.input, { height: 80 }]} value={bio} onChangeText={setBio} multiline placeholder="Bio" placeholderTextColor={Colors.textSecondary} />
            </View>

            <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/profile/music')}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Profile Music</Text>
                <Text style={styles.settingSub}>{musicTitle}</Text>
              </View>
              <Ionicons name="musical-notes" size={20} color={Colors.primary} />
            </TouchableOpacity>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Private Account</Text>
                <Text style={styles.settingSub}>Only people you approve can see your photos and videos.</Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: '#333', true: Colors.primary }}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  profilePicSection: { alignItems: 'center', paddingVertical: 24 },
  profilePic: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  editPicText: { fontSize: 15, color: Colors.primary, fontWeight: '600', textAlign: 'center' },
  formSection: { paddingHorizontal: 16 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: Colors.cardBackground, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  settingLabel: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  settingSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, paddingRight: 40 },
});

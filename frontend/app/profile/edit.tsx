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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [pronouns, setPronouns] = useState(user?.pronouns || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [link, setLink] = useState(user?.link || '');
  const [profilePic, setProfilePic] = useState(user?.picture || '');
  const [loading, setLoading] = useState(false);

  const handleSelectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setProfilePic(result.assets[0].base64);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.put('/users/profile', {
        name,
        username,
        bio,
        picture: profilePic,
      });

      if (response.data) {
        setUser(response.data);
        Alert.alert('Success', 'Profile updated successfully!');
        router.back();
      }
    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Ionicons name="checkmark" size={28} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Picture */}
          <View style={styles.profilePicSection}>
            <TouchableOpacity onPress={handleSelectImage}>
              <Image
                source={{
                  uri: profilePic
                    ? profilePic.startsWith('data:')
                      ? profilePic
                      : `data:image/jpeg;base64,${profilePic}`
                    : 'https://via.placeholder.com/150',
                }}
                style={styles.profilePic}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSelectImage}>
              <Text style={styles.editPicText}>Edit picture or avatar</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Name"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Pronouns</Text>
              <TextInput
                style={styles.input}
                placeholder="Add pronouns"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Bio"
                placeholderTextColor={Colors.textSecondary}
                multiline
                maxLength={150}
              />
            </View>

            {/* Additional Options */}
            <TouchableOpacity style={styles.optionButton}>
              <Text style={styles.optionText}>Add link</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionButton}>
              <Text style={styles.optionText}>Add banners</Text>
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gender</Text>
              <TextInput
                style={styles.input}
                placeholder="Prefer not to say"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <TouchableOpacity style={styles.musicOption}>
              <Text style={styles.label}>Music</Text>
              <View style={styles.musicRight}>
                <Text style={styles.musicPlaceholder}>Add music to your profile</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>

            {/* Switch Options */}
            <TouchableOpacity style={styles.linkOption}>
              <Text style={styles.linkText}>Switch to professional account</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkOption}>
              <Text style={styles.linkText}>Personal information settings</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
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
  profilePicSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  editPicText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
  },
  formSection: {
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionButton: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
  },
  musicOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  musicRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  musicPlaceholder: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  linkOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  linkText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
});

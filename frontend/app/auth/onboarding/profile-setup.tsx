import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../../constants/colors';
import { api } from '../../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../store/authStore';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [picture, setPicture] = useState(null);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setPicture(result.assets[0].base64);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await api.put('/users/profile', {
        bio,
        picture: picture || undefined,
      });
      router.push('/auth/onboarding/app-tour');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Complete your profile</Text>
        <Text style={styles.subtitle}>
          Add a profile photo and a bio so people know who you are.
        </Text>

        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarButton}>
            {picture ? (
              <Image source={{ uri: 'data:image/jpeg;base64,' + picture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="camera-outline" size={40} color={Colors.textSecondary} />
              </View>
            )}
            <View style={styles.addIcon}>
              <Ionicons name="add" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.changeText}>Add Profile Photo</Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Bio</Text>
          <TextInput
            style={styles.bioInput}
            placeholder="Write something about yourself..."
            placeholderTextColor={Colors.textSecondary}
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={150}
          />
          <Text style={styles.charCount}>{bio.length}/150</Text>
        </View>

        <TouchableOpacity
          style={[styles.finishButton, loading && styles.disabledButton]}
          onPress={handleFinish}
          disabled={loading}
        >
          <Text style={styles.finishButtonText}>
            {loading ? 'Saving...' : 'Finish Setup'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/onboarding/app-tour')}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  changeText: {
    marginTop: 12,
    fontSize: 15,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  inputSection: {
    width: '100%',
    marginBottom: 40,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  bioInput: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    height: 100,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: 4,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  finishButton: {
    backgroundColor: Colors.primary,
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  finishButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';

export default function VideoUploadEntryPoint() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery permission is required to upload videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      // Validation: Duration check (~33s minimum as per requirement)
      if (asset.duration && asset.duration < 33000) {
        Alert.alert('Invalid Duration', 'Video must be at least 33 seconds long for the Video Hub.');
        return;
      }

      // Proceed to details with the video uri
      router.push({
        pathname: '/video/upload/details',
        params: { uri: asset.uri, duration: asset.duration }
      });
    }
  };

  const handleRecordVideo = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to record videos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
       router.push({
        pathname: '/video/upload/details',
        params: { uri: result.assets[0].uri, duration: result.assets[0].duration }
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Video</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="cloud-upload" size={80} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Share your story</Text>
        <Text style={styles.subtitle}>Upload long-form videos to reach a wider audience on the MARB Video Hub.</Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={handlePickVideo}>
          <Text style={styles.primaryBtnText}>SELECT FILES</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={handleRecordVideo}>
          <Ionicons name="camera" size={20} color={Colors.text} />
          <Text style={styles.secondaryBtnText}>RECORD VIDEO</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          By submitting your videos to MARB, you acknowledge that you agree to our Terms of Service and Community Guidelines.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  iconCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  primaryBtn: { backgroundColor: Colors.primary, width: '100%', paddingVertical: 15, borderRadius: 30, alignItems: 'center', marginBottom: 16 },
  primaryBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  secondaryBtnText: { color: Colors.text, fontSize: 16, fontWeight: '500' },
  footerNote: { fontSize: 12, color: Colors.textTertiary, textAlign: 'center', marginTop: 40, lineHeight: 18 },
});

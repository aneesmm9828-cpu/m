import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../constants/colors';

export default function VideoDetailsScreen() {
  const router = useRouter();
  const { uri, duration } = useLocalSearchParams();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isForKids, setIsForKids] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Details, 2: Audience/Visibility

  const handleNext = () => {
    if (step === 1) {
      if (!title.trim()) {
        alert('Please enter a title');
        return;
      }
      setStep(2);
    } else {
      handlePublish();
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    // Logic for Supabase upload and database entry would go here
    setTimeout(() => {
      setLoading(false);
      alert('Video published successfully!');
      router.replace('/video-hub');
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(1)}>
          <Ionicons name={step === 1 ? "close" : "arrow-back"} size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{step === 1 ? 'Details' : 'Visibility'}</Text>
        <TouchableOpacity onPress={handleNext} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.nextText}>{step === 1 ? 'NEXT' : 'PUBLISH'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {step === 1 ? (
          <View>
            <View style={styles.videoPreview}>
              <View style={styles.thumbnailPlaceholder}>
                <Ionicons name="play-circle" size={48} color={Colors.textTertiary} />
                <Text style={styles.previewNote}>Preview Auto-generated</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title (required)</Text>
              <TextInput
                style={styles.input}
                placeholder="Add a title that describes your video"
                placeholderTextColor={Colors.textTertiary}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
              <Text style={styles.counter}>{title.length}/100</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell viewers about your video"
                placeholderTextColor={Colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Playlist</Text>
              <TouchableOpacity style={styles.selector}>
                <Text style={styles.selectorText}>Select</Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Audience</Text>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>Made for kids?</Text>
                  <Text style={styles.rowDesc}>Regardless of your location, you're legally required to comply with Children's Online Privacy Protection Act.</Text>
                </View>
                <Switch
                  value={isForKids}
                  onValueChange={setIsForKids}
                  trackColor={{ false: '#333', true: Colors.primary }}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Visibility</Text>
              {['Public', 'Unlisted', 'Private'].map((opt) => (
                <TouchableOpacity key={opt} style={styles.visibilityOption}>
                  <Ionicons
                    name={opt === 'Public' ? 'globe-outline' : opt === 'Unlisted' ? 'link-outline' : 'lock-closed-outline'}
                    size={24}
                    color={Colors.textSecondary}
                  />
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.optTitle}>{opt}</Text>
                    <Text style={styles.optDesc}>
                      {opt === 'Public' ? 'Everyone can see your video' : opt === 'Unlisted' ? 'Anyone with the link can see' : 'Only you can see your video'}
                    </Text>
                  </View>
                  <View style={[styles.radio, opt === 'Public' && styles.radioActive]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  nextText: { color: Colors.primary, fontWeight: 'bold', fontSize: 16 },
  content: { padding: 16 },
  videoPreview: { width: '100%', height: 200, backgroundColor: Colors.surface, borderRadius: 12, marginBottom: 24, overflow: 'hidden' },
  thumbnailPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  previewNote: { color: Colors.textTertiary, fontSize: 12 },
  inputGroup: { marginBottom: 24 },
  inputLabel: { color: Colors.textSecondary, fontSize: 14, marginBottom: 8, fontWeight: '500' },
  input: { borderBottomWidth: 1, borderBottomColor: Colors.border, color: Colors.text, fontSize: 16, paddingVertical: 10 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  counter: { color: Colors.textTertiary, fontSize: 12, textAlign: 'right', marginTop: 4 },
  selector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  selectorText: { color: Colors.textSecondary, fontSize: 16 },
  section: { marginBottom: 30 },
  sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  rowTitle: { color: Colors.text, fontSize: 16, fontWeight: '500', marginBottom: 4 },
  rowDesc: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  visibilityOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  optTitle: { color: Colors.text, fontSize: 16, fontWeight: '500' },
  optDesc: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border },
  radioActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
});

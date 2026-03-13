import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';

const INTERESTS = [
  { id: 'art', label: 'Art & Design', icon: 'color-palette' },
  { id: 'music', label: 'Music', icon: 'musical-notes' },
  { id: 'travel', label: 'Travel', icon: 'airplane' },
  { id: 'food', label: 'Food', icon: 'restaurant' },
  { id: 'fitness', label: 'Fitness', icon: 'fitness' },
  { id: 'gaming', label: 'Gaming', icon: 'game-controller' },
  { id: 'tech', label: 'Technology', icon: 'laptop' },
  { id: 'fashion', label: 'Fashion', icon: 'shirt' },
  { id: 'movies', label: 'Movies', icon: 'film' },
  { id: 'sports', label: 'Sports', icon: 'basketball' },
  { id: 'nature', label: 'Nature', icon: 'leaf' },
  { id: 'pets', label: 'Pets', icon: 'paw' },
  { id: 'books', label: 'Books', icon: 'book' },
  { id: 'dance', label: 'Dance', icon: 'musical-note' },
  { id: 'comedy', label: 'Comedy', icon: 'happy' },
  { id: 'beauty', label: 'Beauty', icon: 'sparkles' },
  { id: 'cricket', label: 'Cricket', icon: 'trophy' },
  { id: 'bollywood', label: 'Bollywood', icon: 'star' },
  { id: 'yoga', label: 'Yoga', icon: 'body' },
  { id: 'business', label: 'Business', icon: 'briefcase' },
];

export default function InterestsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleNext = async () => {
    try {
      await api.post('/users/onboarding/complete', { interests: selected });
    } catch {}
    router.push('/onboarding/follow');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/onboarding/follow')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.titleBox}>
        <Text style={styles.title}>What interests you?</Text>
        <Text style={styles.subtitle}>Select topics to personalize your MARB experience</Text>
      </View>
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {INTERESTS.map(item => (
          <TouchableOpacity
            key={item.id}
            style={[styles.chip, selected.includes(item.id) && styles.chipSelected]}
            onPress={() => toggle(item.id)}
            data-testid={`interest-${item.id}`}
          >
            {selected.includes(item.id) && (
              <LinearGradient colors={['#f09433', '#bc1888']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFillObject as any} />
            )}
            <Ionicons name={item.icon as any} size={20} color={selected.includes(item.id) ? '#fff' : Colors.textSecondary} />
            <Text style={[styles.chipText, selected.includes(item.id) && styles.chipTextSelected]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, selected.length === 0 && styles.nextBtnDisabled]}
          onPress={handleNext}
          data-testid="interests-next-button"
        >
          <Text style={styles.nextText}>Continue ({selected.length} selected)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8 },
  skipText: { color: Colors.textSecondary, fontSize: 14 },
  titleBox: { paddingHorizontal: 24, paddingVertical: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, paddingBottom: 120 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 30, backgroundColor: Colors.cardBackground, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', position: 'relative' },
  chipSelected: { borderColor: 'transparent' },
  chipText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  chipTextSelected: { color: '#fff' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: Colors.background },
  nextBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  nextBtnDisabled: { backgroundColor: Colors.cardBackground },
  nextText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

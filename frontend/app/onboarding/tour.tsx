import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'home',
    title: 'Your Feed, Your World',
    subtitle: 'See posts, stories, and reels from people you follow — all in one place.',
    gradient: ['#0095f6', '#00d4ff'],
  },
  {
    icon: 'film',
    title: 'Discover Amazing Reels',
    subtitle: 'Watch and create short videos, discover trending content from creators worldwide.',
    gradient: ['#f09433', '#bc1888'],
  },
  {
    icon: 'chatbubbles',
    title: 'Connect with Friends',
    subtitle: 'Send messages, share posts, and react with emojis in Direct Messages.',
    gradient: ['#00d26a', '#0095f6'],
  },
  {
    icon: 'star',
    title: 'MARB Unique Features',
    subtitle: 'Study Rooms, Events, Rewards, Broadcast Channels — only on MARB!',
    gradient: ['#bc1888', '#f09433'],
  },
];

export default function AppTourScreen() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);

  const handleNext = () => {
    if (current < SLIDES.length - 1) {
      setCurrent(current + 1);
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const slide = SLIDES[current];

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={() => router.replace('/(tabs)/home')}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <LinearGradient colors={slide.gradient as any} style={styles.iconBox}>
          <Ionicons name={slide.icon as any} size={72} color="#fff" />
        </LinearGradient>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} data-testid="tour-next-button">
          <Text style={styles.nextText}>{current === SLIDES.length - 1 ? 'Get Started' : 'Next'}</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  skip: { position: 'absolute', top: 50, right: 24, zIndex: 10 },
  skipText: { color: Colors.textSecondary, fontSize: 14 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  iconBox: { width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.text, textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { width: 24, backgroundColor: Colors.primary },
  footer: { padding: 24 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, gap: 8 },
  nextText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

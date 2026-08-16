import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';

const { width } = Dimensions.get('window');

const INTERESTS = [
  { id: '1', label: 'Photography', icon: '📸' },
  { id: '2', label: 'Travel', icon: '✈️' },
  { id: '3', label: 'Food', icon: '🍕' },
  { id: '4', label: 'Fitness', icon: '💪' },
  { id: '5', label: 'Music', icon: '🎵' },
  { id: '6', label: 'Art', icon: '🎨' },
  { id: '7', label: 'Technology', icon: '💻' },
  { id: '8', label: 'Fashion', icon: '👗' },
  { id: '9', label: 'Nature', icon: '🌿' },
  { id: '10', label: 'Sports', icon: '⚽' },
  { id: '11', label: 'Gaming', icon: '🎮' },
  { id: '12', label: 'Movies', icon: '🎬' },
  { id: '13', label: 'Business', icon: '📊' },
  { id: '14', label: 'Animals', icon: '🐶' },
  { id: '15', label: 'Dancing', icon: '💃' },
  { id: '16', label: 'Writing', icon: '✍️' },
];

export default function InterestsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState([]);

  const toggleInterest = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((i) => i !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleNext = () => {
    router.push('/auth/onboarding/follow-suggestions');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>What are you into?</Text>
        <Text style={styles.subtitle}>
          Select at least 3 interests to personalize your experience.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {INTERESTS.map((item) => {
            const isSelected = selected.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.interestItem,
                  isSelected && styles.selectedInterest,
                ]}
                onPress={() => toggleInterest(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.interestIcon}>{item.icon}</Text>
                <Text style={[styles.interestLabel, isSelected && styles.selectedLabel]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, selected.length < 3 && styles.disabledButton]}
          disabled={selected.length < 3}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  interestItem: {
    width: (width - 48) / 2,
    backgroundColor: Colors.cardBackground,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedInterest: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  interestIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  interestLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  selectedLabel: {
    color: Colors.background,
  },
  footer: {
    padding: 24,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: Colors.primary,
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  nextButtonText: {
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

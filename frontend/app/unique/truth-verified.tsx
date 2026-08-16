import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function TruthVerifiedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Truth Verified</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Ionicons name="shield-checkmark-outline" size={80} color={Colors.primary} />
        <Text style={styles.title}>Truth Verified Hub</Text>
        <Text style={styles.description}>
          A community-driven fact-checking platform. Verify news, debunk myths, and earn "Truth Points" for contributing to a more informed MARB community.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginTop: 20 },
  description: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 24 },
});

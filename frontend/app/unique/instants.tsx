import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function InstantsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Instants</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Ionicons name="flash-outline" size={80} color={Colors.primary} />
        <Text style={styles.title}>Real-time Sharing</Text>
        <Text style={styles.description}>
          Instants are real-time, unedited photos shared by you and your friends at the same time every day. No filters, just real moments.
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

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

export default function TopicsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const CATEGORIES = [
    { name: 'Music', count: '5.2M posts', icon: '🎵' },
    { name: 'Photography', count: '8.1M posts', icon: '📸' },
    { name: 'Travel', count: '12M posts', icon: '✈️' },
    { name: 'Fitness', count: '4.3M posts', icon: '💪' },
    { name: 'Fashion', count: '9.5M posts', icon: '👗' },
    { name: 'Tech', count: '2.8M posts', icon: '💻' },
  ];

  const TRENDING = ['Fashion', 'Travel', 'Food', 'Fitness', 'Tech', 'Art', 'Music', 'Comedy'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Topics</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search topics..."
            placeholderTextColor={Colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <Text style={styles.sectionTitle}>Trending Topics</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingScroll}>
           {TRENDING.map(tag => (
             <TouchableOpacity key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>#{tag}</Text>
             </TouchableOpacity>
           ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Browse by Category</Text>
        <View style={styles.categoryGrid}>
           {CATEGORIES.map((cat, i) => (
             <TouchableOpacity key={i} style={styles.categoryCard}>
                <View style={styles.cardBg} />
                <View style={styles.cardOverlay}>
                   <Text style={styles.catIcon}>{cat.icon}</Text>
                   <Text style={styles.catName}>{cat.name}</Text>
                   <Text style={styles.catCount}>{cat.count}</Text>
                </View>
             </TouchableOpacity>
           ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  content: { flex: 1 },
  searchBarContainer: { paddingHorizontal: 16, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 12, height: 40, gap: 8 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginLeft: 16, marginTop: 10, marginBottom: 16 },
  trendingScroll: { paddingHorizontal: 16, gap: 10, marginBottom: 24 },
  tagChip: { backgroundColor: Colors.primary + '15', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.primary + '30' },
  tagText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  categoryCard: { width: (width - 48) / 2, height: 160, margin: 8, borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.surface },
  cardBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  cardOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  catIcon: { fontSize: 32, marginBottom: 12 },
  catName: { fontSize: 18, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  catCount: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, FlatList, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useSkillStore } from '../../store/skillStore';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

export default function SkillMarketplaceScreen() {
  const router = useRouter();
  const { gigs, isLoading, fetchGigs } = useSkillStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const CATEGORIES = ['All', 'Design', 'Video', 'Writing', 'Tech', 'Music', 'Lifestyle'];

  useEffect(() => {
    fetchGigs({
      category: selectedCategory === 'All' ? undefined : selectedCategory,
      query: search || undefined,
    });
  }, [selectedCategory, search]);

  const renderGigItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.gigCard}
      onPress={() => router.push(`/skill-market/gigs/${item.id}`)}
    >
      <View style={styles.gigImagePlaceholder}>
        {item.media?.[0] ? (
          <Image source={{ uri: item.media[0].media_url }} style={styles.gigImage} />
        ) : (
          <Ionicons name="image-outline" size={40} color={Colors.textTertiary} />
        )}
      </View>
      <View style={styles.gigInfo}>
        <Text style={styles.gigTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.gigCategory}>{item.category}</Text>
        <View style={styles.gigFooter}>
          <Text style={styles.gigPrice}>From ₹{item.price_basic}</Text>
          <View style={styles.ratingBox}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>4.9</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search skills..."
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity>
            <Ionicons name="mic" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.catScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catList}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catItem, selectedCategory === cat && styles.catItemActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catItemText, selectedCategory === cat && styles.catItemTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={gigs}
        renderItem={renderGigItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={60} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No gigs found in this category.</Text>
          </View>
        }
        refreshing={isLoading}
        onRefresh={() => fetchGigs({ category: selectedCategory === 'All' ? undefined : selectedCategory, query: search || undefined })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 25, paddingHorizontal: 16, height: 45 },
  searchInput: { flex: 1, color: Colors.text, marginLeft: 8, fontSize: 16 },
  catScrollContainer: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  catList: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  catItem: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface },
  catItemActive: { backgroundColor: Colors.primary },
  catItemText: { color: Colors.textSecondary, fontWeight: '600' },
  catItemTextActive: { color: Colors.background },
  listContent: { padding: 16 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 16 },
  gigCard: { width: COLUMN_WIDTH, backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden' },
  gigImagePlaceholder: { width: '100%', height: 120, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  gigImage: { width: '100%', height: '120%' },
  gigInfo: { padding: 12 },
  gigTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.text, height: 40 },
  gigCategory: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  gigFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  gigPrice: { fontSize: 14, fontWeight: 'bold', color: Colors.primary },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, color: Colors.text, fontWeight: '600' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: Colors.textSecondary, marginTop: 16, fontSize: 16 },
});


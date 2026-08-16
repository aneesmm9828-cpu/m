import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import VideoCard from '../components/VideoCard';

const { width, height } = Dimensions.get('window');

const FILTERS = {
  uploadDate: ['Anytime', 'Today', 'This week', 'This month', 'This year'],
  type: ['All', 'Video', 'Channel', 'Playlist'],
  duration: ['Any', 'Under 4 min', '4-20 min', '20+ min'],
  sort: ['Relevance', 'Upload date', 'View count', 'Rating'],
};

export default function VideoSearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<any[]>([]); // Results would be populated by search logic

  const renderFilterSection = (title: string, options: string[]) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.filterOptions}>
        {options.map(opt => (
          <TouchableOpacity key={opt} style={styles.filterChip}>
            <Text style={styles.filterText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.input}
            placeholder="Search Video Hub"
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={20} color={Colors.text} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
          <Ionicons name="options-outline" size={24} color={showFilters ? Colors.primary : Colors.text} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <ScrollView style={styles.filterDropdown} showsVerticalScrollIndicator={false}>
          {renderFilterSection('Upload Date', FILTERS.uploadDate)}
          {renderFilterSection('Type', FILTERS.type)}
          {renderFilterSection('Duration', FILTERS.duration)}
          {renderFilterSection('Sort By', FILTERS.sort)}
          <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilters(false)}>
            <Text style={styles.applyText}>Apply Filters</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Results or Suggestions */}
      <View style={styles.content}>
        {searchQuery.length === 0 ? (
          <View style={styles.recentSearchContainer}>
            <Text style={styles.recentTitle}>Recent Searches</Text>
            {['Odisha Tech', 'MARB Tutorial', 'React Native Live'].map(item => (
              <TouchableOpacity key={item} style={styles.recentItem} onPress={() => setSearchQuery(item)}>
                <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.recentText}>{item}</Text>
                <Ionicons name="arrow-up-outline" size={18} color={Colors.textSecondary} style={{ transform: [{ rotate: '-45deg' }] }} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <FlatList
            data={results}
            renderItem={({ item }) => <VideoCard item={item} />}
            keyExtractor={item => item.id}
            ListEmptyComponent={
              <View style={styles.emptyResults}>
                <Ionicons name="search-outline" size={64} color={Colors.textSecondary} />
                <Text style={styles.emptyText}>No results found for "{searchQuery}"</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 20, paddingHorizontal: 12, height: 40 },
  input: { flex: 1, color: Colors.text, fontSize: 16, marginLeft: 8 },

  filterDropdown: { backgroundColor: Colors.cardBackground, padding: 16, maxHeight: height * 0.5 },
  filterSection: { marginBottom: 20 },
  filterTitle: { color: Colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
  filterOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, borderWidth: 1, borderColor: Colors.border },
  filterText: { color: Colors.textSecondary, fontSize: 13 },
  applyBtn: { backgroundColor: Colors.primary, padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  applyText: { color: '#000', fontWeight: 'bold' },

  content: { flex: 1 },
  recentSearchContainer: { padding: 16 },
  recentTitle: { color: Colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  recentItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  recentText: { color: Colors.text, fontSize: 15, flex: 1 },

  emptyResults: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
  emptyText: { color: Colors.textSecondary, marginTop: 16, fontSize: 16 },
});

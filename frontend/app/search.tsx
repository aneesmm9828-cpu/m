import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { searchProfiles } from '../utils/supabaseHelpers';
import { debounce } from 'lodash';

const { width } = Dimensions.get('window');

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(
    debounce(async (text: string) => {
      if (!text.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const profiles = await searchProfiles(text);
      setResults(profiles);
      setLoading(false);
    }, 500),
    []
  );

  useEffect(() => {
    handleSearch(query);
  }, [query]);

  const renderUserItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => router.push(`/profile/${item.id}`)}
    >
      <Image
        source={{ uri: item.avatar_url || 'https://via.placeholder.com/100' }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.fullName}>{item.full_name}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Search accounts (ID or name)..."
            placeholderTextColor={Colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            query.length > 0 ? (
              <View style={styles.centered}>
                <Text style={styles.emptyText}>No accounts found for "{query}"</Text>
              </View>
            ) : (
              <View style={styles.centered}>
                <Ionicons name="search-outline" size={80} color={Colors.border} />
                <Text style={styles.emptyText}>Type a username or name to search</Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 10,
  },
  input: { flex: 1, color: Colors.text, fontSize: 16 },
  list: { paddingVertical: 8 },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.surface },
  userInfo: { flex: 1 },
  username: { color: Colors.text, fontSize: 15, fontWeight: 'bold' },
  fullName: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { color: Colors.textSecondary, fontSize: 16, marginTop: 12 },
});

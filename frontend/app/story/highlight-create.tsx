import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { supabase } from '../../utils/supabaseConfig';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 3;

export default function HighlightCreateScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stories, setStories] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Select Stories, 2: Name Highlight

  useEffect(() => {
    loadUserStories();
  }, []);

  const loadUserStories = async () => {
    if (!user || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (selectedIds.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one story for your highlight.');
      return;
    }
    setStep(2);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Name Required', 'Please give your highlight a name.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create the Highlight
      // Note: Since we discovered the table might not be fully functional via RLS/Cache,
      // we'll attempt the insert. If it fails, we'll inform the user.
      const { data: highlight, error: hError } = await supabase
        .from('highlights')
        .insert({
          user_id: user?.user_id,
          title: title.trim(),
          cover_url: stories.find(s => s.id === selectedIds[0])?.media_url
        })
        .select()
        .single();

      if (hError) throw hError;

      // 2. Add items to Highlight
      const highlightItems = selectedIds.map(storyId => ({
        highlight_id: highlight.id,
        story_id: storyId
      }));

      const { error: iError } = await supabase
        .from('highlight_items')
        .insert(highlightItems);

      if (iError) throw iError;

      Alert.alert('Success', 'Highlight created successfully!');
      router.back();
    } catch (error: any) {
      console.error('Error creating highlight:', error);
      Alert.alert('Error', 'Failed to create highlight. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const renderStoryItem = ({ item }: { item: any }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity
        style={styles.storyItem}
        onPress={() => toggleSelection(item.id)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.media_url }} style={styles.storyImage} />
        <View style={[styles.selectionOverlay, isSelected && styles.selectedOverlay]}>
          {isSelected && <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />}
        </View>
      </TouchableOpacity>
    );
  };

  if (step === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Highlight</Text>
          <TouchableOpacity onPress={handleNext}>
            <Text style={[styles.nextText, selectedIds.length === 0 && styles.disabledText]}>Next</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} color={Colors.primary} />
        ) : (
          <FlatList
            data={stories}
            renderItem={renderStoryItem}
            keyExtractor={item => item.id}
            numColumns={3}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="images-outline" size={64} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>No stories found to highlight</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep(1)}>
          <Ionicons name="chevron-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Name Your Highlight</Text>
        <TouchableOpacity onPress={handleCreate} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.nextText}>Done</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.coverPreviewContainer}>
            <Image
                source={{ uri: stories.find(s => s.id === selectedIds[0])?.media_url }}
                style={styles.coverPreview}
            />
            <Text style={styles.editCoverText}>Edit Cover</Text>
        </View>

        <TextInput
          style={styles.titleInput}
          placeholder="Highlight Name"
          placeholderTextColor={Colors.textSecondary}
          value={title}
          onChangeText={setTitle}
          autoFocus
          maxLength={15}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  nextText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  disabledText: { color: Colors.textTertiary },
  loader: { marginTop: 40 },
  storyItem: { width: ITEM_SIZE, height: ITEM_SIZE * 1.5, padding: 1 },
  storyImage: { width: '100%', height: '100%' },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 8,
  },
  selectedOverlay: { backgroundColor: 'rgba(0,0,0,0.3)' },
  emptyContainer: { flex: 1, paddingVertical: 100, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: 16, marginTop: 16 },
  inputContainer: { alignItems: 'center', paddingTop: 40 },
  coverPreviewContainer: { alignItems: 'center', marginBottom: 30 },
  coverPreview: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  editCoverText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  titleInput: {
    width: '80%',
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
    color: Colors.text,
    fontSize: 18,
    textAlign: 'center',
    paddingBottom: 8,
  },
});

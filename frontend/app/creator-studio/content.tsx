import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { supabase } from '../../utils/supabaseConfig';
import { useAuthStore } from '../../store/authStore';

export default function ContentManagementScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyContent();
  }, []);

  const loadMyContent = async () => {
    if (!supabase || !user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.user_id)
        .eq('media_type', 'video')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoreOptions = (item: any) => {
    Alert.alert(
      'Manage Video',
      item.caption,
      [
        { text: 'Edit Details', onPress: () => {} },
        { text: 'Delete Video', style: 'destructive', onPress: () => handleDelete(item.id) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (!error) {
      setVideos(videos.filter(v => v.id !== id));
      Alert.alert('Deleted', 'Video removed from your channel.');
    }
  };

  const renderVideoItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.videoRow} onPress={() => router.push({ pathname: '/video/[id]', params: { id: item.id } })}>
      <Image source={{ uri: item.media_url }} style={styles.thumbnail} />
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>{item.caption || 'No Title'}</Text>
        <Text style={styles.videoMeta}>
          {item.visibility || 'Public'} • {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}><Ionicons name="eye-outline" size={14} color={Colors.textSecondary} /><Text style={styles.statText}>1.2K</Text></View>
          <View style={styles.stat}><Ionicons name="heart-outline" size={14} color={Colors.textSecondary} /><Text style={styles.statText}>245</Text></View>
          <View style={styles.stat}><Ionicons name="chatbubble-outline" size={14} color={Colors.textSecondary} /><Text style={styles.statText}>18</Text></View>
        </View>
      </View>
      <TouchableOpacity style={styles.moreBtn} onPress={() => handleMoreOptions(item)}>
        <Ionicons name="ellipsis-vertical" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Channel Content</Text>
        <TouchableOpacity onPress={loadMyContent}>
          <Ionicons name="refresh" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centered}><Text style={styles.emptyText}>No videos uploaded yet.</Text></View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  list: { paddingVertical: 8 },
  videoRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', gap: 12 },
  thumbnail: { width: 120, height: 68, borderRadius: 4, backgroundColor: Colors.surface },
  videoInfo: { flex: 1, justifyContent: 'center' },
  videoTitle: { color: Colors.text, fontSize: 14, fontWeight: '500', marginBottom: 4 },
  videoMeta: { color: Colors.textSecondary, fontSize: 12, marginBottom: 6 },
  statsRow: { flexDirection: 'row', gap: 12 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: Colors.textSecondary, fontSize: 11 },
  moreBtn: { padding: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: Colors.textSecondary, textAlign: 'center' },
});

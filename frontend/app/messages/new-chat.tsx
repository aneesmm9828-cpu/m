import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../utils/supabaseConfig';

export default function NewChatScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.length > 0) {
      searchUsers();
    } else {
      loadSuggested();
    }
  }, [search]);

  const searchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${search}%`)
      .neq('id', user?.user_id)
      .limit(20);

    if (data) setProfiles(data);
    setLoading(false);
  };

  const loadSuggested = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user?.user_id)
      .limit(20);

    if (data) setProfiles(data);
    setLoading(false);
  };

  const renderProfile = ({ item }) => (
    <TouchableOpacity
      style={styles.profileItem}
      onPress={() => router.push(`/messages/chat?userId=${item.id}`)}
    >
      <Image
        source={{ uri: item.avatar_url || 'https://via.placeholder.com/100' }}
        style={styles.avatar}
      />
      <View>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.fullName}>{item.full_name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New message</Text>
        <TouchableOpacity disabled>
          <Text style={styles.chatBtn}>Chat</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.toLabel}>To:</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor={Colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
      </View>

      <Text style={styles.sectionTitle}>Suggested</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={profiles}
          renderItem={renderProfile}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>No users found</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  chatBtn: { color: Colors.primary, fontSize: 16, fontWeight: 'bold', opacity: 0.5 },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  toLabel: { fontSize: 16, color: Colors.text, marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: Colors.text },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, padding: 16 },
  profileItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  username: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  fullName: { color: Colors.textSecondary, fontSize: 14 },
  emptyText: { textAlign: 'center', marginTop: 40, color: Colors.textSecondary },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../utils/supabaseConfig';

export default function MessageRequestsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, [user]);

  const loadRequests = async () => {
    if (!user?.user_id || !supabase) return;
    setLoading(true);
    try {
      // Fetch messages where status is 'request' or from non-following users (simplified)
      // For this demo, we'll fetch unique senders who sent messages with status 'request'
      const { data, error } = await supabase
        .from('messages')
        .select(`
          sender_id,
          text,
          created_at,
          profiles:sender_id (id, username, full_name, avatar_url)
        `)
        .eq('receiver_id', user.user_id)
        .eq('status', 'request')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter unique senders
      const uniqueRequests = [];
      const seenSenders = new Set();
      data.forEach(item => {
        if (!seenSenders.has(item.sender_id)) {
          seenSenders.add(item.sender_id);
          uniqueRequests.push(item);
        }
      });

      setRequests(uniqueRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderRequest = ({ item }) => (
    <TouchableOpacity
      style={styles.requestItem}
      onPress={() => router.push(`/messages/chat?userId=${item.sender_id}`)}
    >
      <Image
        source={{ uri: item.profiles?.avatar_url || 'https://via.placeholder.com/100' }}
        style={styles.userImage}
      />
      <View style={styles.requestInfo}>
        <Text style={styles.userName}>{item.profiles?.username || 'User'}</Text>
        <Text style={styles.fullName}>{item.profiles?.full_name}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>{item.text}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.acceptBtn}>
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Message Requests</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Hidden Requests</Text>
        <Text style={styles.infoText}>Open these to see messages that may be offensive or spam.</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.sender_id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="mail-unread-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No message requests</Text>
              <Text style={styles.emptySub}>You don't have any new message requests.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  infoBox: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoTitle: { color: Colors.text, fontWeight: '600', marginBottom: 4 },
  infoText: { color: Colors.textSecondary, fontSize: 13 },
  requestItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  userImage: { width: 56, height: 56, borderRadius: 28, marginRight: 12 },
  requestInfo: { flex: 1 },
  userName: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  fullName: { color: Colors.textSecondary, fontSize: 14 },
  lastMessage: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  actions: { paddingLeft: 12 },
  acceptBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  acceptText: { color: Colors.background, fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyText: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySub: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 },
});

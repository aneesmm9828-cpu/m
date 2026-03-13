import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';

export default function FollowSuggestionsScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [followed, setFollowed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/suggested').then(r => { setUsers(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleFollow = async (uid: string) => {
    setFollowed(prev => prev.includes(uid) ? prev.filter(i => i !== uid) : [...prev, uid]);
    try { await api.post(`/users/${uid}/follow`); } catch {}
  };

  const handleDone = () => router.push('/onboarding/tour');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDone}><Text style={styles.skip}>Skip</Text></TouchableOpacity>
      </View>
      <View style={styles.titleBox}>
        <Text style={styles.title}>Suggested for you</Text>
        <Text style={styles.subtitle}>Follow people to see their posts, stories and reels</Text>
      </View>
      {loading ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={users}
          keyExtractor={i => i.user_id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.userRow} data-testid={`suggested-user-${item.user_id}`}>
              <View style={styles.avatar}>
                {item.picture ? (
                  <Image source={{ uri: `data:image/jpeg;base64,${item.picture}` }} style={styles.avatarImg} />
                ) : (
                  <View style={[styles.avatarImg, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>{(item.name || 'U')[0].toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.username}>@{item.username}</Text>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.bio} numberOfLines={1}>{item.bio || ''}</Text>
              </View>
              <TouchableOpacity
                style={[styles.followBtn, followed.includes(item.user_id) && styles.followingBtn]}
                onPress={() => handleFollow(item.user_id)}
                data-testid={`follow-button-${item.user_id}`}
              >
                <Text style={[styles.followText, followed.includes(item.user_id) && styles.followingText]}>
                  {followed.includes(item.user_id) ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.doneBtn} onPress={handleDone} data-testid="follow-done-button">
          <Text style={styles.doneText}>Done ({followed.length} followed)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8 },
  skip: { color: Colors.textSecondary, fontSize: 14 },
  titleBox: { paddingHorizontal: 24, paddingVertical: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary },
  list: { paddingHorizontal: 16, paddingBottom: 120 },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar: { marginRight: 12 },
  avatarImg: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: { backgroundColor: Colors.cardBackground, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  userInfo: { flex: 1 },
  username: { fontSize: 14, fontWeight: '600', color: Colors.text },
  name: { fontSize: 13, color: Colors.textSecondary },
  bio: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  followBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  followingBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border },
  followText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  followingText: { color: Colors.text },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: Colors.background },
  doneBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  doneText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

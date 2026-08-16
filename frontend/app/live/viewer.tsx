import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../utils/supabaseConfig';

const { width, height } = Dimensions.get('window');

export default function LiveViewerScreen() {
  const router = useRouter();
  const { id: streamId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [showPoll, setShowPoll] = useState(true);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!supabase || !streamId) return;

    // Load initial messages
    loadInitialMessages();

    // Subscribe to real-time chat
    const channel = supabase
      .channel(`live_chat:${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  const loadInitialMessages = async () => {
    const { data } = await supabase
      .from('live_chat_messages')
      .select('*')
      .eq('stream_id', streamId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (data) setMessages(data);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !supabase) return;

    const messageObj = {
      stream_id: streamId,
      user_id: user?.user_id,
      user_name: user?.username || 'Guest',
      message: inputText,
      type: 'text'
    };

    // Optimization: Add to local state immediately (Optimistic UI)
    // setMessages([...messages, { ...messageObj, id: Date.now().toString() }]);

    const { error } = await supabase.from('live_chat_messages').insert([messageObj]);

    if (!error) {
      setInputText('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Video (Live Stream) */}
      <Video
        source={{ uri: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' }}
        style={styles.fullVideo}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
      />

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.hostInfo}>
            <Image
              source={{ uri: 'https://via.placeholder.com/100' }}
              style={styles.hostAvatar}
            />
            <View>
              <Text style={styles.hostName}>MARB Creator</Text>
              <Text style={styles.viewCount}>1.2K watching</Text>
            </View>
            <TouchableOpacity style={styles.subscribeBtn}>
              <Text style={styles.subscribeText}>Subscribe</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Live Poll Overlay */}
        {showPoll && (
          <View style={styles.pollContainer}>
            <View style={styles.pollHeader}>
              <Text style={styles.pollTitle}>Who will win the match?</Text>
              <TouchableOpacity onPress={() => setShowPoll(false)}>
                <Ionicons name="close-circle" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.pollOption}>
              <Text style={styles.optionText}>Team A (60%)</Text>
              <View style={[styles.progress, { width: '60%' }]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.pollOption}>
              <Text style={styles.optionText}>Team B (40%)</Text>
              <View style={[styles.progress, { width: '40%' }]} />
            </TouchableOpacity>
          </View>
        )}

        {/* Chat Section */}
        <View style={styles.chatSection}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[
                styles.messageRow,
                item.type === 'super_chat' && { backgroundColor: item.color + '40', borderRadius: 8, padding: 8 },
                item.type === 'membership' && { backgroundColor: item.color + '20', borderRadius: 8, padding: 8 }
              ]}>
                <Text style={styles.messageUser}>{item.user}: </Text>
                <Text style={styles.messageText}>{item.message}</Text>
              </View>
            )}
            style={styles.messageList}
            contentContainerStyle={{ paddingVertical: 10 }}
          />

          {/* Input Bar */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
          >
            <View style={styles.inputContainer}>
              <TouchableOpacity style={styles.inputIcon}>
                <MaterialCommunityIcons name="currency-usd-circle" size={28} color="#ffd700" />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Chat publically..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
                <Ionicons name="send" size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  fullVideo: { ...StyleSheet.absoluteFillObject },
  overlay: { flex: 1, justifyContent: 'space-between' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    borderRadius: 25,
    gap: 10
  },
  hostAvatar: { width: 34, height: 34, borderRadius: 17 },
  hostName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  viewCount: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  subscribeBtn: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  subscribeText: { color: '#000', fontSize: 12, fontWeight: 'bold' },
  closeBtn: { padding: 4 },

  pollContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pollHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  pollTitle: { color: '#fff', fontWeight: 'bold' },
  pollOption: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative'
  },
  optionText: { color: '#fff', zIndex: 1 },
  progress: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,217,255,0.3)' },

  chatSection: { height: height * 0.4, paddingHorizontal: 16 },
  messageList: { flex: 1 },
  messageRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  messageUser: { color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', fontSize: 13 },
  messageText: { color: '#fff', fontSize: 13, flex: 1 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 25,
    marginBottom: 10
  },
  input: { flex: 1, color: '#fff', paddingHorizontal: 12, height: 40 },
  inputIcon: { padding: 4 },
  sendBtn: { padding: 8 },
});

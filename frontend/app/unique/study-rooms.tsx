import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function StudyRoomsScreen() {
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [topic, setTopic] = useState('');

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const res = await api.get('/unique/study-rooms');
      setRooms(res.data || []);
    } catch (err) {
      console.log('Error loading rooms:', err);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim() || !topic.trim()) return;
    try {
      await api.post('/unique/study-rooms', { name: roomName, topic });
      setShowModal(false);
      setRoomName('');
      setTopic('');
      loadRooms();
    } catch (err) {
      Alert.alert('Error', 'Failed to create study room');
    }
  };

  const renderRoom = ({ item }) => (
    <TouchableOpacity
      style={styles.roomCard}
      activeOpacity={0.8}
      onPress={() => Alert.alert('Joining...', `Joining room: ${item.name}`)}
    >
      <LinearGradient
        colors={['#0095f6', '#00d9ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.roomIcon}
      >
         <Ionicons name="book" size={30} color="#fff" />
      </LinearGradient>
      <View style={styles.roomInfo}>
         <Text style={styles.roomName}>{item.name}</Text>
         <Text style={styles.roomTopic}>Topic: {item.topic}</Text>
         <View style={styles.membersRow}>
            <Ionicons name="people" size={14} color={Colors.textSecondary} />
            <Text style={styles.membersText}>{item.members?.length || 0} studying</Text>
            {item.is_live && (
              <View style={styles.liveBadge}>
                 <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
         </View>
      </View>
      <TouchableOpacity style={styles.joinBtn}>
         <Text style={styles.joinBtnText}>Join</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Study Rooms</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Ionicons name="add-circle-outline" size={28} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.banner}>
         <Text style={styles.bannerTitle}>Focus Together</Text>
         <Text style={styles.bannerDesc}>Join live rooms to study with friends and stay productive.</Text>
      </View>

      <FlatList
        data={rooms}
        renderItem={renderRoom}
        keyExtractor={(item) => item.room_id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="library-outline" size={60} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No active study rooms</Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => setShowModal(true)}>
               <Text style={styles.createBtnText}>Create a Room</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start Study Session</Text>
            <TextInput
              style={styles.input}
              placeholder="Room Name (e.g. Finals Prep)"
              placeholderTextColor={Colors.textSecondary}
              value={roomName}
              onChangeText={setRoomName}
            />
            <TextInput
              style={styles.input}
              placeholder="Topic (e.g. Physics)"
              placeholderTextColor={Colors.textSecondary}
              value={topic}
              onChangeText={setTopic}
            />
            <View style={styles.modalBtns}>
               <TouchableOpacity onPress={() => setShowModal(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={handleCreateRoom} style={styles.startBtn}>
                  <Text style={styles.startText}>Go Live</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  banner: {
    padding: 24,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  bannerDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  list: {
    padding: 16,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roomIcon: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  roomTopic: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  membersText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  liveBadge: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 10,
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  joinBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinBtnText: {
    color: Colors.background,
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    color: Colors.textSecondary,
    fontSize: 16,
    marginBottom: 20,
  },
  createBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createBtnText: {
    color: Colors.background,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    width: '85%',
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 15,
    color: Colors.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelBtn: {
    padding: 12,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  startBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
  },
  startText: {
    color: Colors.background,
    fontWeight: 'bold',
  },
});

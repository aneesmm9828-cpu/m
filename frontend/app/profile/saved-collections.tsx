import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
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

const { width } = Dimensions.get('window');
const itemSize = (width - 48) / 2;

export default function SavedCollectionsScreen() {
  const router = useRouter();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/me/collections');
      setCollections(res.data || []);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await api.post('/users/me/collections', { name: newName.trim() });
      setShowModal(false);
      setNewName('');
      loadCollections();
    } catch (error) {
      Alert.alert('Error', 'Failed to create collection');
    }
  };

  const renderCollection = ({ item }) => (
    <TouchableOpacity
      style={styles.collectionItem}
      onPress={() => router.push(`/profile/collection-detail?id=${item.id}&name=${item.name}`)}
    >
      <View style={styles.folderCover}>
         {item.posts?.length > 0 ? (
           <View style={styles.gridPreview}>
              <View style={styles.previewMain} />
              <View style={styles.previewSide}>
                 <View style={styles.previewSmall} />
                 <View style={styles.previewSmall} />
              </View>
           </View>
         ) : (
           <View style={styles.emptyCover}>
              <Ionicons name="folder-outline" size={40} color={Colors.textTertiary} />
           </View>
         )}
      </View>
      <Text style={styles.collectionName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved</Text>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={32} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[{ id: 'all', name: 'All Posts' }, ...collections]}
        renderItem={renderCollection}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>Save posts you like</Text>
          </View>
        }
      />

      <Modal
        visible={showModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Collection</Text>
            <TextInput
              style={styles.input}
              placeholder="Collection name"
              placeholderTextColor={Colors.textSecondary}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} style={styles.modalBtn}>
                <Text style={styles.createBtnText}>Create</Text>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  listContent: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  collectionItem: {
    width: itemSize,
  },
  folderCover: {
    width: itemSize,
    height: itemSize,
    borderRadius: 12,
    backgroundColor: Colors.cardBackground,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyCover: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridPreview: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
  },
  previewMain: {
    flex: 2,
    backgroundColor: Colors.border,
  },
  previewSide: {
    flex: 1,
    gap: 2,
  },
  previewSmall: {
    flex: 1,
    backgroundColor: Colors.border,
  },
  collectionName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    width: '80%',
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
    color: Colors.text,
    fontSize: 16,
    paddingVertical: 8,
    marginBottom: 24,
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
  },
  modalBtn: {
    padding: 8,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  createBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');
const itemSize = (width - 60) / 3;

const STICKERS = [
  { id: 'poll', label: 'Poll', icon: 'list', type: 'Ionicons', color: '#ff8501' },
  { id: 'quiz', label: 'Quiz', icon: 'help-circle', type: 'Ionicons', color: '#4fffb0' },
  { id: 'qa', label: 'Q&A', icon: 'question', type: 'FontAwesome5', color: '#00d9ff' },
  { id: 'countdown', label: 'Countdown', icon: 'timer-outline', type: 'Ionicons', color: '#ff3b5c' },
  { id: 'slider', label: 'Slider', icon: 'hand-holding-heart', type: 'FontAwesome5', color: '#ff9ff3' },
  { id: 'link', label: 'Link', icon: 'link', type: 'Ionicons', color: '#0095f6' },
  { id: 'location', label: 'Location', icon: 'location', type: 'Ionicons', color: '#ed4956' },
  { id: 'mention', label: 'Mention', icon: 'at', type: 'FontAwesome5', color: '#ff8501' },
  { id: 'hashtag', label: 'Hashtag', icon: 'hashtag', type: 'FontAwesome5', color: '#00d9ff' },
];

export default function StickerPickerScreen() {
  const router = useRouter();

  const renderIcon = (item) => {
    if (item.type === 'Ionicons') return <Ionicons name={item.icon} size={32} color={item.color} />;
    if (item.type === 'FontAwesome5') return <FontAwesome5 name={item.icon} size={28} color={item.color} />;
    return <MaterialCommunityIcons name={item.icon} size={32} color={item.color} />;
  };

  const selectSticker = (id) => {
    // Logic to return to story screen with selected sticker
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.handle} />
        <Text style={styles.title}>Stickers</Text>
      </View>

      <FlatList
        data={STICKERS}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.stickerItem}
            onPress={() => selectSticker(item.id)}
          >
            <View style={styles.iconContainer}>
              {renderIcon(item)}
            </View>
            <Text style={styles.stickerLabel}>{item.label}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  listContent: {
    padding: 15,
  },
  stickerItem: {
    width: itemSize,
    alignItems: 'center',
    marginBottom: 25,
    marginHorizontal: 5,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stickerLabel: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
});

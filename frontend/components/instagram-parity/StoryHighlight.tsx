import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface StoryHighlightProps {
  title: string;
  coverUrl?: string;
  isNew?: boolean;
  onPress?: () => void;
}

const StoryHighlight: React.FC<StoryHighlightProps> = ({ title, coverUrl, isNew, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={[styles.circle, isNew && styles.newCircle]}>
        {isNew ? (
          <Ionicons name="add" size={32} color={Colors.text} />
        ) : (
          <Image source={{ uri: coverUrl }} style={styles.image} />
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>{isNew ? 'New' : title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginHorizontal: 8, width: 64 },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    overflow: 'hidden'
  },
  newCircle: { borderStyle: 'dashed', borderWidth: 2 },
  image: { width: '100%', height: '100%' },
  title: { color: Colors.text, fontSize: 11, marginTop: 4 }
});

export default StoryHighlight;

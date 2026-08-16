import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

interface PollStickerProps {
  question: string;
  options: string[];
  onVote: (index: number) => void;
}

export const PollSticker: React.FC<PollStickerProps> = ({ question, options, onVote }) => {
  const [votedIndex, setVotedIndex] = useState<number | null>(null);

  const handleVote = (index: number) => {
    setVotedIndex(index);
    onVote(index);
  };

  return (
    <View style={styles.pollContainer}>
      <Text style={styles.question}>{question}</Text>
      <View style={styles.optionsRow}>
        {options.map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.option, votedIndex === idx && styles.activeOption]}
            onPress={() => handleVote(idx)}
          >
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pollContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    width: width * 0.7,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5
  },
  question: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 16, color: '#000' },
  optionsRow: { flexDirection: 'row', gap: 12 },
  option: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center'
  },
  activeOption: { backgroundColor: Colors.primary + '30', borderColor: Colors.primary, borderWidth: 1 },
  optionText: { fontSize: 16, fontWeight: 'bold', color: '#000' }
});

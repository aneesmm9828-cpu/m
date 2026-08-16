import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Image, Dimensions, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TipModalProps {
  visible: boolean;
  onClose: () => void;
  username: string;
  avatar: string;
}

export default function TipModal({ visible, onClose, username, avatar }: TipModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [note, setNote] = useState('');

  const AMOUNTS = [10, 50, 100, 500, 1000];

  const handleSend = () => {
    const amount = selectedAmount || parseFloat(customAmount);
    if (!amount || amount <= 0) return;
    // Logic for payment goes here
    onClose();
    // Show success alert
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <View>
              <Text style={styles.title}>Tip @{username}</Text>
              <Text style={styles.subtitle}>Support this creator</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={styles.label}>Select amount</Text>
            <View style={styles.amountGrid}>
              {AMOUNTS.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.amtPill, selectedAmount === amt && styles.amtPillActive]}
                  onPress={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                >
                  <Text style={[styles.amtText, selectedAmount === amt && styles.amtTextActive]}>₹{amt}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.amtPill, selectedAmount === null && styles.amtPillActive]}
                onPress={() => setSelectedAmount(null)}
              >
                <Text style={[styles.amtText, selectedAmount === null && styles.amtTextActive]}>Custom</Text>
              </TouchableOpacity>
            </View>

            {selectedAmount === null && (
              <TextInput
                style={styles.customInput}
                placeholder="₹ Enter amount"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                value={customAmount}
                onChangeText={setCustomAmount}
              />
            )}

            <TextInput
              style={styles.noteInput}
              placeholder="Add a note... (optional)"
              placeholderTextColor={Colors.textSecondary}
              maxLength={100}
              value={note}
              onChangeText={setNote}
            />

            <Text style={styles.label}>Payment method</Text>
            <TouchableOpacity style={styles.walletInfo}>
               <Ionicons name="wallet-outline" size={24} color={Colors.primary} />
               <Text style={styles.walletText}>MARB Wallet (₹450 available)</Text>
               <View style={styles.radioActive} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Text style={styles.sendBtnText}>Send ₹{selectedAmount || customAmount || '0'} Tip</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: SCREEN_HEIGHT * 0.8 },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginVertical: 12 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: { position: 'absolute', right: 20, top: 20 },
  content: { padding: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: Colors.text, marginBottom: 12, marginTop: 10 },
  amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  amtPill: { flex: 1, minWidth: '30%', height: 44, borderRadius: 22, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface },
  amtPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  amtText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  amtTextActive: { color: Colors.background },
  customInput: { backgroundColor: Colors.surface, height: 50, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: Colors.text, marginBottom: 16 },
  noteInput: { backgroundColor: Colors.surface, height: 50, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, color: Colors.text, marginBottom: 24 },
  walletInfo: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: Colors.surface, borderRadius: 12, marginBottom: 30 },
  walletText: { flex: 1, marginLeft: 12, fontSize: 14, color: Colors.text },
  radioActive: { width: 20, height: 20, borderRadius: 10, borderWidth: 6, borderColor: Colors.primary },
  sendBtn: { backgroundColor: Colors.primary, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  sendBtnText: { color: Colors.background, fontSize: 18, fontWeight: 'bold' },
});

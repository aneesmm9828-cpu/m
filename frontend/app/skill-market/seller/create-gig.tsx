import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { useSkillStore } from '../../../store/skillStore';

export default function CreateGigScreen() {
  const router = useRouter();
  const { createGig, isLoading } = useSkillStore();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    price_basic: '',
    delivery_days_basic: '1',
    location_name: '',
  });

  const CATEGORIES = ['Design', 'Video', 'Writing', 'Tech', 'Music', 'Lifestyle'];

  const handleCreate = async () => {
    if (!form.title || !form.category || !form.price_basic) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const price = parseFloat(form.price_basic);
      const delivery = parseInt(form.delivery_days_basic);

      if (isNaN(price) || isNaN(delivery)) {
        Alert.alert('Error', 'Price and Delivery must be numbers');
        return;
      }

      await createGig({
        title: form.title,
        description: form.description,
        category: form.category,
        tags: [],
        price_basic: price,
        delivery_days_basic: delivery,
        location_name: form.location_name,
      });
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to create gig');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Gig</Text>
        <TouchableOpacity onPress={handleCreate} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveBtn}>Publish</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Gig Title*</Text>
        <TextInput
          style={styles.input}
          placeholder="I will do something amazing..."
          placeholderTextColor={Colors.textTertiary}
          value={form.title}
          onChangeText={(text) => setForm({ ...form, title: text })}
        />

        <Text style={styles.label}>Category*</Text>
        <View style={styles.catContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catBadge, form.category === cat && styles.catBadgeActive]}
              onPress={() => setForm({ ...form, category: cat })}
            >
              <Text style={[styles.catText, form.category === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={4}
          placeholder="Describe what you offer..."
          placeholderTextColor={Colors.textTertiary}
          value={form.description}
          onChangeText={(text) => setForm({ ...form, description: text })}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>Price (₹)*</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="500"
              placeholderTextColor={Colors.textTertiary}
              value={form.price_basic}
              onChangeText={(text) => setForm({ ...form, price_basic: text })}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.label}>Delivery (Days)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor={Colors.textTertiary}
              value={form.delivery_days_basic}
              onChangeText={(text) => setForm({ ...form, delivery_days_basic: text })}
            />
          </View>
        </View>

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Bhubaneswar, Odisha"
          placeholderTextColor={Colors.textTertiary}
          value={form.location_name}
          onChangeText={(text) => setForm({ ...form, location_name: text })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  saveBtn: { color: Colors.primary, fontWeight: 'bold', fontSize: 16 },
  content: { padding: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: Colors.textSecondary, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, color: Colors.text, fontSize: 16 },
  textArea: { height: 120, textAlignVertical: 'top' },
  catContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  catBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  catBadgeActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { color: Colors.textSecondary },
  catTextActive: { color: Colors.background, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});

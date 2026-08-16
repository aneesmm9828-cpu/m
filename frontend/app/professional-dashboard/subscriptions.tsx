import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 4) / 3;

export default function SubscriptionsScreen() {
  const router = useRouter();

  const MOCK_POSTS = Array(12).fill(null).map((_, i) => ({
    id: i.toString(),
    locked: i !== 0,
    media: 'https://via.placeholder.com/300'
  }));

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.subscriptionCard}>
        <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.creatorAvatar} />
        <Text style={styles.creatorName}>Exclusive Content</Text>
        <Text style={styles.price}>₹99/month</Text>
        <Text style={styles.subscriberCount}>128 subscribers</Text>

        <View style={styles.benefitsList}>
           {[
             'Exclusive photos & videos',
             'Behind the scenes content',
             'Direct message access',
             'Early access to posts'
           ].map((b, i) => (
             <View key={i} style={styles.benefitRow}>
               <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
               <Text style={styles.benefitText}>{b}</Text>
             </View>
           ))}
        </View>

        <TouchableOpacity style={styles.subscribeBtn}>
          <Text style={styles.subscribeBtnText}>Subscribe Now</Text>
        </TouchableOpacity>
        <Text style={styles.cancelNote}>Cancel anytime</Text>
      </View>

      <View style={styles.previewSection}>
         <Text style={styles.sectionTitle}>Content Preview</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Exclusive Content</Text>
        <Ionicons name="lock-closed" size={24} color={Colors.primary} />
      </View>

      <FlatList
        data={MOCK_POSTS}
        numColumns={3}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
             <Image source={{ uri: item.media }} style={styles.gridImage} />
             {item.locked ? (
               <View style={styles.lockOverlay}>
                  <Ionicons name="lock-closed" size={24} color="#fff" />
                  <Text style={styles.lockText}>Subscribe to view</Text>
               </View>
             ) : (
               <View style={styles.freeBadge}><Text style={styles.freeText}>FREE</Text></View>
             )}
          </View>
        )}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  topTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  headerSection: { padding: 16 },
  subscriptionCard: { backgroundColor: Colors.surface, padding: 24, borderRadius: 20, alignItems: 'center' },
  creatorAvatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 16, borderWidth: 2, borderColor: Colors.primary },
  creatorName: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  price: { fontSize: 24, fontWeight: 'bold', color: Colors.primary, marginVertical: 8 },
  subscriberCount: { fontSize: 14, color: Colors.textSecondary },
  benefitsList: { width: '100%', marginVertical: 20, gap: 12 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitText: { fontSize: 14, color: Colors.text },
  subscribeBtn: { backgroundColor: Colors.primary, width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  subscribeBtnText: { color: Colors.background, fontWeight: 'bold', fontSize: 16 },
  cancelNote: { fontSize: 12, color: Colors.textSecondary, marginTop: 12 },
  previewSection: { marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, padding: 1, position: 'relative' },
  gridImage: { width: '100%', height: '100%', backgroundColor: Colors.surface },
  lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 10 },
  lockText: { color: '#fff', fontSize: 10, textAlign: 'center', marginTop: 4, fontWeight: 'bold' },
  freeBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: Colors.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  freeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
});

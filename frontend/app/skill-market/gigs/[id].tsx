import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { supabase } from '../../../utils/supabaseConfig';
import { useAuthStore } from '../../../store/authStore';

export default function GigDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [gig, setGig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGig();
  }, [id]);

  const fetchGig = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('gigs')
      .select('*, seller:profiles(*), media:gig_media(*)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching gig:', error);
      router.back();
    } else {
      setGig(data);
    }
    setIsLoading(false);
  };

  const handleBook = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to book a skill.');
      return;
    }

    if (user.id === gig.seller_id) {
      Alert.alert('Error', 'You cannot book your own gig.');
      return;
    }

    // In a real app, this would redirect to a checkout/payment flow
    Alert.alert(
      'Confirm Booking',
      `Book "${gig.title}" for ₹${gig.price_basic}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const { error } = await supabase!.from('orders').insert({
              gig_id: gig.id,
              buyer_id: user.id,
              seller_id: gig.seller_id,
              amount: gig.price_basic,
              status: 'requested',
            });
            if (error) Alert.alert('Error', 'Failed to place order');
            else {
                Alert.alert('Success', 'Order requested!');
                router.push('/(tabs)/profile'); // Redirect to profile or orders
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gig Details</Text>
        <TouchableOpacity><Ionicons name="share-social-outline" size={24} color={Colors.text} /></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.mediaContainer}>
          {gig.media?.[0] ? (
            <Image source={{ uri: gig.media[0].media_url }} style={styles.mainMedia} />
          ) : (
            <View style={styles.mediaPlaceholder}>
              <Ionicons name="image-outline" size={80} color={Colors.textTertiary} />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{gig.title}</Text>

          <TouchableOpacity style={styles.sellerRow} onPress={() => router.push(`/profile/${gig.seller.id}`)}>
            <Image source={{ uri: gig.seller.avatar_url || 'https://via.placeholder.com/150' }} style={styles.sellerAvatar} />
            <View>
              <Text style={styles.sellerName}>{gig.seller.full_name || gig.seller.username}</Text>
              <Text style={styles.sellerMeta}>Top Rated Seller • 4.9 ⭐</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>About this Gig</Text>
          <Text style={styles.description}>{gig.description || 'No description provided.'}</Text>

          <View style={styles.priceCard}>
            <View style={styles.priceHeader}>
              <Text style={styles.priceLabel}>Standard Package</Text>
              <Text style={styles.priceValue}>₹{gig.price_basic}</Text>
            </View>
            <View style={styles.priceDetailRow}>
              <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.priceDetailText}>{gig.delivery_days_basic} Days Delivery</Text>
            </View>
            <View style={styles.priceDetailRow}>
              <Ionicons name="refresh-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.priceDetailText}>2 Revisions</Text>
            </View>
          </View>

          <View style={styles.locationBox}>
            <Ionicons name="location-outline" size={20} color={Colors.primary} />
            <Text style={styles.locationText}>{gig.location_name || 'Available Worldwide'}</Text>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.chatBtn} onPress={() => Alert.alert('Chat', 'Chat feature coming soon!')}>
          <Ionicons name="chatbubble-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookBtn} onPress={handleBook}>
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  mediaContainer: { width: '100%', height: 250, backgroundColor: Colors.surface },
  mainMedia: { width: '100%', height: '100%' },
  mediaPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: Colors.text, marginBottom: 20 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  sellerAvatar: { width: 50, height: 50, borderRadius: 25 },
  sellerName: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  sellerMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },
  description: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 24 },
  priceCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.primary },
  priceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  priceLabel: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  priceValue: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
  priceDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  priceDetailText: { fontSize: 14, color: Colors.textSecondary },
  locationBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, backgroundColor: Colors.surface, padding: 12, borderRadius: 12 },
  locationText: { color: Colors.textSecondary, fontSize: 14 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: 'row', gap: 12 },
  chatBtn: { width: 56, height: 56, borderRadius: 12, borderWidth: 1, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  bookBtn: { flex: 1, height: 56, backgroundColor: Colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bookBtnText: { color: Colors.background, fontSize: 16, fontWeight: 'bold' },
});

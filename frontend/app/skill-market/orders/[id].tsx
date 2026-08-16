import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { supabase } from '../../../utils/supabaseConfig';
import { useAuthStore } from '../../../store/authStore';
import { useSkillStore } from '../../../store/skillStore';

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { updateOrderStatus } = useSkillStore();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('orders')
      .select('*, gig:gigs(*), buyer:profiles!orders_buyer_id_fkey(*), seller:profiles!orders_seller_id_fkey(*)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      router.back();
    } else {
      setOrder(data);
    }
    setIsLoading(false);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await updateOrderStatus(id as string, newStatus as any);
      await fetchOrder();
      Alert.alert('Success', `Order marked as ${newStatus}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const isBuyer = user?.id === order.buyer_id;
  const isSeller = user?.id === order.seller_id;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusSection}>
          <Text style={styles.statusLabel}>Current Status</Text>
          <Text style={[styles.statusValue, { color: getStatusColor(order.status) }]}>
            {order.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>

        <View style={styles.gigBox}>
          <Text style={styles.gigTitle}>{order.gig?.title}</Text>
          <Text style={styles.orderMeta}>Order ID: {order.id.substring(0, 8)}</Text>
          <Text style={styles.orderAmount}>₹{order.amount}</Text>
        </View>

        <View style={styles.participantBox}>
          <Text style={styles.sectionTitle}>{isBuyer ? 'Seller' : 'Buyer'}</Text>
          <View style={styles.userRow}>
            <View style={styles.avatarPlaceholder} />
            <View>
              <Text style={styles.userName}>
                {isBuyer ? (order.seller.full_name || order.seller.username) : (order.buyer.full_name || order.buyer.username)}
              </Text>
              <TouchableOpacity onPress={() => Alert.alert('Chat', 'Chat coming soon!')}>
                <Text style={styles.chatLink}>Message {isBuyer ? 'Seller' : 'Buyer'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.actionsSection}>
          {isSeller && order.status === 'requested' && (
            <View style={styles.row}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.success }]} onPress={() => handleStatusUpdate('accepted')}>
                <Text style={styles.actionBtnText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.error }]} onPress={() => handleStatusUpdate('rejected')}>
                <Text style={styles.actionBtnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}

          {isSeller && order.status === 'accepted' && (
            <TouchableOpacity style={styles.fullWidthBtn} onPress={() => handleStatusUpdate('in_progress')}>
              <Text style={styles.actionBtnText}>Start Working</Text>
            </TouchableOpacity>
          )}

          {isSeller && order.status === 'in_progress' && (
            <TouchableOpacity style={styles.fullWidthBtn} onPress={() => handleStatusUpdate('delivered')}>
              <Text style={styles.actionBtnText}>Deliver Work</Text>
            </TouchableOpacity>
          )}

          {isBuyer && order.status === 'delivered' && (
            <TouchableOpacity style={[styles.fullWidthBtn, { backgroundColor: Colors.success }]} onPress={() => handleStatusUpdate('completed')}>
              <Text style={styles.actionBtnText}>Confirm Delivery & Release Funds</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'requested': return Colors.warning;
    case 'accepted':
    case 'in_progress': return Colors.primary;
    case 'delivered': return Colors.success;
    case 'completed': return Colors.success;
    case 'rejected':
    case 'cancelled': return Colors.error;
    default: return Colors.textSecondary;
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  content: { padding: 20 },
  statusSection: { alignItems: 'center', marginBottom: 30, backgroundColor: Colors.surface, padding: 20, borderRadius: 16 },
  statusLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 4 },
  statusValue: { fontSize: 24, fontWeight: 'bold' },
  gigBox: { backgroundColor: Colors.surface, padding: 20, borderRadius: 16, marginBottom: 20 },
  gigTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
  orderMeta: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },
  orderAmount: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
  participantBox: { backgroundColor: Colors.surface, padding: 20, borderRadius: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.textSecondary, marginBottom: 16 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.border },
  userName: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  chatLink: { color: Colors.primary, fontSize: 14, marginTop: 4 },
  actionsSection: { marginTop: 20 },
  row: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  fullWidthBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: Colors.background, fontSize: 16, fontWeight: 'bold' },
});

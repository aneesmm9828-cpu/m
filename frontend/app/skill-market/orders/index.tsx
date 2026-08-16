import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { useSkillStore } from '../../../store/skillStore';

export default function OrdersScreen() {
  const router = useRouter();
  const { activeOrders, isLoading, fetchOrders } = useSkillStore();
  const [tab, setTab] = useState<'buying' | 'selling'>('buying');

  useEffect(() => {
    fetchOrders(tab === 'buying' ? 'buyer' : 'seller');
  }, [tab]);

  const renderOrderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => router.push(`/skill-market/orders/${item.id}`)}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderGigTitle}>{item.gig?.title || 'Gig Deleted'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.orderFooter}>
        <Text style={styles.orderAmount}>₹{item.amount}</Text>
        <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'buying' && styles.tabActive]}
          onPress={() => setTab('buying')}
        >
          <Text style={[styles.tabText, tab === 'buying' && styles.tabTextActive]}>Buying</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'selling' && styles.tabActive]}
          onPress={() => setTab('selling')}
        >
          <Text style={[styles.tabText, tab === 'selling' && styles.tabTextActive]}>Selling</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activeOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No orders found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  tabContainer: { flexDirection: 'row', backgroundColor: Colors.surface, margin: 16, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: Colors.borderLight },
  tabText: { color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },
  listContent: { paddingHorizontal: 16 },
  orderCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderGigTitle: { flex: 1, fontSize: 16, fontWeight: 'bold', color: Colors.text, marginRight: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderAmount: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
  orderDate: { fontSize: 12, color: Colors.textSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: Colors.textSecondary, marginTop: 16, fontSize: 16 },
});

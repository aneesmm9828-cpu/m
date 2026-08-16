import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

type MarketplaceTab = 'new' | 'active' | 'completed' | 'rate-card';

export default function MarketplaceScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MarketplaceTab>('new');

  const DEALS = [
    { brand: 'Nike', category: 'Sports', type: 'Sponsored Reel', amount: '₹15,000', deadline: 'June 20', new: true },
    { brand: 'Starbucks', category: 'Food & Drink', type: '3 Stories', amount: '₹5,000', deadline: 'June 25', new: true },
  ];

  const renderNewOffers = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.tabContent}>
      <View style={styles.offerBadge}><Text style={styles.offerBadgeText}>2 new brand offers</Text></View>
      {DEALS.map((deal, i) => (
        <View key={i} style={styles.dealCard}>
           <View style={styles.dealTop}>
              <View style={styles.brandLogo} />
              <View style={styles.brandInfo}>
                 <Text style={styles.brandName}>{deal.brand} {deal.new && <Text style={styles.newTag}>NEW</Text>}</Text>
                 <Text style={styles.dealType}>{deal.type} • {deal.category}</Text>
              </View>
              <Text style={styles.dealAmount}>{deal.amount}</Text>
           </View>
           <Text style={styles.dealDeadline}>Apply by {deal.deadline}</Text>
           <View style={styles.actionRow}>
              <TouchableOpacity style={styles.applyBtn}><Text style={styles.applyText}>Apply</Text></TouchableOpacity>
              <TouchableOpacity style={styles.declineBtn}><Text style={styles.declineText}>Decline</Text></TouchableOpacity>
           </View>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Marketplace</Text>
        <TouchableOpacity><Ionicons name="options-outline" size={24} color={Colors.text} /></TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {[
          { id: 'new', label: 'New Offers' },
          { id: 'active', label: 'Active' },
          { id: 'rate-card', label: 'Rate Card' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'new' && renderNewOffers()}
      {activeTab !== 'new' && <View style={styles.centered}><Text style={styles.emptyText}>No data available</Text></View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  activeTabText: { color: Colors.text },
  tabContent: { flex: 1, padding: 16 },
  offerBadge: { backgroundColor: Colors.error + '20', padding: 8, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 16 },
  offerBadgeText: { color: Colors.error, fontSize: 12, fontWeight: 'bold' },
  dealCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 16 },
  dealTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  brandLogo: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.border },
  brandInfo: { flex: 1, marginLeft: 12 },
  brandName: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  newTag: { color: Colors.error, fontSize: 10 },
  dealType: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  dealAmount: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
  dealDeadline: { fontSize: 12, color: Colors.textSecondary, marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 12 },
  applyBtn: { flex: 1, backgroundColor: Colors.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  applyText: { color: Colors.background, fontWeight: 'bold' },
  declineBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  declineText: { color: Colors.textSecondary, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Colors.textSecondary },
});

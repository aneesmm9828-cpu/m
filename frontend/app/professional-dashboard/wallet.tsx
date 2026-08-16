import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

export default function WalletScreen() {
  const router = useRouter();

  const TRANSACTIONS = [
    { type: 'tip', from: '@priya', amount: '+₹100', date: 'Today, 2:40 PM', status: 'Completed' },
    { type: 'subscription', from: '@rahul', amount: '+₹99', date: 'Yesterday', status: 'Completed' },
    { type: 'withdrawal', from: 'Bank Transfer', amount: '-₹5,000', date: 'July 12', status: 'Completed' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MARB Wallet</Text>
        <TouchableOpacity><Ionicons name="help-circle-outline" size={26} color={Colors.text} /></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Wallet Balance Card */}
        <LinearGradient colors={['#00d9ff', '#4fffb0']} style={styles.balanceCard}>
           <Text style={styles.balLabel}>Total Earnings</Text>
           <Text style={styles.balValue}>₹12,450.00</Text>
           <View style={styles.balRow}>
              <View>
                 <Text style={styles.subBalLabel}>Available</Text>
                 <Text style={styles.subBalValue}>₹10,200</Text>
              </View>
              <View>
                 <Text style={styles.subBalLabel}>Pending</Text>
                 <Text style={[styles.subBalValue, { color: '#ff9800' }]}>₹2,250</Text>
              </View>
           </View>
           <TouchableOpacity style={styles.withdrawBtn}>
              <Text style={styles.withdrawText}>Withdraw to Bank</Text>
           </TouchableOpacity>
        </LinearGradient>

        {/* Breakdown */}
        <View style={styles.breakdownRow}>
           {[
             { label: 'Tips', val: '₹3.2K' },
             { label: 'Badges', val: '₹1.8K' },
             { label: 'Subs', val: '₹4.5K' },
             { label: 'Deals', val: '₹2.9K' },
           ].map((item, i) => (
             <View key={i} style={styles.breakCard}>
                <Text style={styles.breakVal}>{item.val}</Text>
                <Text style={styles.breakLab}>{item.label}</Text>
             </View>
           ))}
        </View>

        <Text style={styles.sectionTitle}>TRANSACTION HISTORY</Text>
        {TRANSACTIONS.map((tx, i) => (
          <View key={i} style={styles.txItem}>
             <View style={[styles.txIcon, { backgroundColor: tx.amount.startsWith('+') ? Colors.success + '20' : Colors.error + '20' }]}>
                <Ionicons
                  name={tx.type === 'withdrawal' ? "arrow-up" : "arrow-down"}
                  size={20}
                  color={tx.amount.startsWith('+') ? Colors.success : Colors.error}
                />
             </View>
             <View style={styles.txInfo}>
                <Text style={styles.txDesc}>{tx.type === 'tip' ? `Tip from ${tx.from}` : tx.from}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
             </View>
             <View style={{alignItems: 'flex-end'}}>
                <Text style={[styles.txAmount, { color: tx.amount.startsWith('+') ? Colors.success : Colors.text }]}>{tx.amount}</Text>
                <Text style={styles.txStatus}>{tx.status}</Text>
             </View>
          </View>
        ))}

        <TouchableOpacity style={styles.loadMore}>
           <Text style={styles.loadMoreText}>View All Transactions</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  content: { flex: 1 },
  balanceCard: { margin: 16, padding: 24, borderRadius: 24 },
  balLabel: { fontSize: 13, color: 'rgba(0,0,0,0.6)', fontWeight: '600' },
  balValue: { fontSize: 32, fontWeight: 'bold', color: '#000', marginVertical: 8 },
  balRow: { flexDirection: 'row', gap: 40, marginTop: 12 },
  subBalLabel: { fontSize: 11, color: 'rgba(0,0,0,0.5)' },
  subBalValue: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  withdrawBtn: { backgroundColor: '#000', marginTop: 24, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  withdrawText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  breakdownRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 24 },
  breakCard: { flex: 1, backgroundColor: Colors.surface, padding: 12, borderRadius: 12, alignItems: 'center' },
  breakVal: { fontSize: 14, fontWeight: 'bold', color: Colors.text },
  breakLab: { fontSize: 10, color: Colors.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: Colors.textSecondary, marginLeft: 16, marginBottom: 16, letterSpacing: 1 },
  txItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  txIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1, marginLeft: 12 },
  txDesc: { fontSize: 15, fontWeight: '600', color: Colors.text },
  txDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: 'bold' },
  txStatus: { fontSize: 11, color: Colors.success, marginTop: 2 },
  loadMore: { padding: 20, alignItems: 'center' },
  loadMoreText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
});

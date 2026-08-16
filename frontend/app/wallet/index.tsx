import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { GlassCard } from '../../components/GlassCard';
import { MARBButton } from '../../components/MARBButton';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function WalletScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [balance, setBalance] = useState(user?.wallet_balance || 0.0);
  const [transactions, setTransactions] = useState([
    { id: '1', type: 'received', title: 'Tip from @rohit_99', amount: '+ ₹150', date: '2 hours ago' },
    { id: '2', type: 'sent', title: 'Tip to @ananya_art', amount: '- ₹50', date: 'Yesterday' },
    { id: '3', type: 'withdrawal', title: 'Bank Withdrawal', amount: '- ₹1,200', date: '3 days ago' },
    { id: '4', type: 'received', title: 'Ad Revenue Share', amount: '+ ₹840', date: '1 week ago' },
  ]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MARB Money</Text>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Main Card */}
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainCard}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Available Balance</Text>
              <MaterialCommunityIcons name="integrated-circuit-chip" size={40} color="#000" />
            </View>
            <Text style={styles.balanceText}>₹{balance.toLocaleString('en-IN')}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardUser}>{user?.name || 'MARB USER'}</Text>
              <View style={styles.cardTypeContainer}>
                 <Text style={styles.cardTypeText}>PREMIUM</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons name="add" size={26} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>Add Money</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons name="scan" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>UPI Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons name="paper-plane" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>Transfer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons name="stats-chart" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>Insights</Text>
            </TouchableOpacity>
          </View>

          {/* Transactions Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <GlassCard style={styles.transactionsCard}>
            {transactions.map((tx, index) => (
              <View key={tx.id} style={[styles.txItem, index === transactions.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.txIconContainer, { backgroundColor: tx.type === 'received' ? 'rgba(79, 255, 176, 0.1)' : 'rgba(255, 59, 92, 0.1)' }]}>
                  <Ionicons
                    name={tx.type === 'received' ? "arrow-down" : "arrow-up"}
                    size={20}
                    color={tx.type === 'received' ? '#4fffb0' : '#ff3b5c'}
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txTitle}>{tx.title}</Text>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === 'received' ? '#4fffb0' : '#fff' }]}>
                  {tx.amount}
                </Text>
              </View>
            ))}
          </GlassCard>

          <MARBButton
            title="Cash Out to Bank"
            onPress={() => {}}
            style={styles.cashOutBtn}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  mainCard: {
    width: '100%',
    height: 200,
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLabel: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  balanceText: {
    color: '#000',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardUser: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardTypeContainer: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardTypeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 20,
  },
  actionItem: {
    alignItems: 'center',
    gap: 10,
  },
  actionIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  txIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  txInfo: {
    flex: 1,
    gap: 4,
  },
  txTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  txDate: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  cashOutBtn: {
    marginTop: 30,
  },
});

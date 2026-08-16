import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ProfessionalDashboard() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [anaRes, walletRes, transRes] = await Promise.all([
        api.get('/creator/analytics'),
        api.get('/creator/wallet'),
        api.get('/creator/transactions').catch(() => ({ data: [] })),
      ]);
      setAnalytics(anaRes.data);
      setWallet(walletRes.data);
      setTransactions(transRes.data || []);
    } catch (err) {
      console.log('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={styles.statCard}>
       <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
       </View>
       <Text style={styles.statValue}>{value}</Text>
       <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Professional Dashboard</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
           <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <LinearGradient
            colors={['#00d9ff', '#00ffcc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.walletCard}
          >
             <View>
                <Text style={styles.walletLabel}>MARB Money Balance</Text>
                <Text style={styles.walletValue}>{wallet.balance.toFixed(2)} MARB</Text>
             </View>
             <TouchableOpacity style={styles.walletBtn}>
                <Text style={styles.walletBtnText}>Cash Out</Text>
             </TouchableOpacity>
          </LinearGradient>

          <Text style={styles.sectionTitle}>Account Insights</Text>
          <View style={styles.statsGrid}>
             <StatCard
               title="Reach"
               value={analytics?.reach?.toLocaleString() || '0'}
               icon="people-outline"
               color="#0095f6"
             />
             <StatCard
               title="Engagement"
               value={analytics?.engagement?.toLocaleString() || '0'}
               icon="heart-outline"
               color="#ff3b5c"
             />
             <StatCard
               title="Growth"
               value={`+${analytics?.followers_growth || '0'}`}
               icon="trending-up-outline"
               color="#4fffb0"
             />
          </View>

          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <View style={styles.toolsList}>
             {transactions.length > 0 ? transactions.map((tx: any) => (
                <View key={tx.transaction_id} style={styles.toolItem}>
                   <View style={styles.toolIcon}>
                      <Ionicons
                        name={tx.type === 'tip' ? "arrow-down-circle" : "arrow-up-circle"}
                        size={22}
                        color={tx.type === 'tip' ? "#4fffb0" : "#ff3b5c"}
                      />
                   </View>
                   <View style={{ flex: 1 }}>
                      <Text style={styles.toolText}>{tx.type === 'tip' ? 'Received Tip' : 'Payout'}</Text>
                      <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                   </View>
                   <Text style={[styles.toolText, { fontWeight: 'bold', color: tx.type === 'tip' ? "#4fffb0" : "#ff3b5c" }]}>
                      {tx.type === 'tip' ? '+' : '-'}₹{tx.net_amount.toFixed(2)}
                   </Text>
                </View>
             )) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                   <Text style={{ color: Colors.textSecondary }}>No transactions yet</Text>
                </View>
             )}
          </View>

          <Text style={styles.sectionTitle}>Tools</Text>
          <View style={styles.toolsList}>
             <TouchableOpacity style={styles.toolItem}>
                <View style={styles.toolIcon}>
                   <Ionicons name="cash-outline" size={22} color={Colors.text} />
                </View>
                <Text style={styles.toolText}>Monetization</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
             </TouchableOpacity>
             <TouchableOpacity style={styles.toolItem}>
                <View style={styles.toolIcon}>
                   <Ionicons name="briefcase-outline" size={22} color={Colors.text} />
                </View>
                <Text style={styles.toolText}>Ad Tools</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
             </TouchableOpacity>
             <TouchableOpacity style={styles.toolItem}>
                <View style={styles.toolIcon}>
                   <MaterialCommunityIcons name="handshake-outline" size={22} color={Colors.text} />
                </View>
                <Text style={styles.toolText}>Branded Content</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
             </TouchableOpacity>
             <TouchableOpacity style={styles.toolItem}>
                <View style={styles.toolIcon}>
                   <Ionicons name="star-outline" size={22} color={Colors.text} />
                </View>
                <Text style={styles.toolText}>Subscriptions</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
             </TouchableOpacity>
          </View>

          <View style={styles.tipsSection}>
             <Text style={styles.tipsTitle}>Tips & Resources</Text>
             <Text style={styles.tipsDesc}>Learn how to grow your audience and earn more with MARB creator tools.</Text>
             <TouchableOpacity style={styles.tipsLink}>
                <Text style={styles.tipsLinkText}>Explore Creator Academy</Text>
             </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.background,
  },
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18, fontWeight: 'bold', color: Colors.text,
  },
  scrollContent: {
    padding: 16, paddingBottom: 40,
  },
  walletCard: {
    borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25,
  },
  walletLabel: {
    color: '#000', fontSize: 13, fontWeight: '600', opacity: 0.8,
  },
  walletValue: {
    color: '#000', fontSize: 22, fontWeight: 'bold', marginTop: 4,
  },
  walletBtn: {
    backgroundColor: 'rgba(0,0,0,0.1)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20,
  },
  walletBtnText: {
    color: '#000', fontWeight: 'bold', fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 15, marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25,
  },
  statCard: {
    width: (width - 48) / 3, backgroundColor: Colors.cardBackground, borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  statIconContainer: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  statValue: {
    fontSize: 16, fontWeight: 'bold', color: Colors.text,
  },
  statTitle: {
    fontSize: 12, color: Colors.textSecondary, marginTop: 2,
  },
  toolsList: {
    backgroundColor: Colors.cardBackground, borderRadius: 12, marginBottom: 25, borderWidth: 1, borderColor: Colors.border,
  },
  toolItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  toolIcon: {
    marginRight: 15,
  },
  toolText: {
    flex: 1, color: Colors.text, fontSize: 15, fontWeight: '500',
  },
  tipsSection: {
    backgroundColor: Colors.cardBackground, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: Colors.border,
  },
  tipsTitle: {
    fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 8,
  },
  tipsDesc: {
    fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 15,
  },
  tipsLink: {
    marginTop: 5,
  },
  tipsLinkText: {
    color: Colors.primary, fontWeight: 'bold',
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

export default function MonetizationScreen() {
  const router = useRouter();
  const [features, setFeatures] = useState({
    badges: true,
    subscriptions: false,
    tips: true,
    brandDeals: true
  });

  const toggleFeature = (key: keyof typeof features) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Monetization</Text>
        <TouchableOpacity>
          <Ionicons name="help-circle-outline" size={26} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Earnings Card */}
        <LinearGradient colors={['#00d9ff', '#0099ff']} style={styles.earningsCard}>
          <View style={styles.earningsInfo}>
             <Text style={styles.earningsLabel}>Total Earnings</Text>
             <Text style={styles.earningsValue}>₹12,450.00</Text>
             <Text style={styles.earningsComparison}>+15% from last month</Text>
          </View>
          <TouchableOpacity style={styles.withdrawBtn} onPress={() => router.push('/professional-dashboard/wallet')}>
             <Text style={styles.withdrawText}>Withdraw</Text>
          </TouchableOpacity>
        </LinearGradient>

        <Text style={styles.sectionTitle}>MONETIZATION FEATURES</Text>

        {/* Creator Badges */}
        <View style={styles.featureItem}>
          <View style={styles.featureIconContainer}>
             <Ionicons name="star" size={24} color="#ffd700" />
          </View>
          <View style={styles.featureText}>
             <Text style={styles.featureTitle}>Creator Badges</Text>
             <Text style={styles.featureSubtitle}>Let fans send you badges during Live</Text>
             <Text style={styles.featureStats}>128 earned this month</Text>
          </View>
          <Switch
            value={features.badges}
            onValueChange={() => toggleFeature('badges')}
            trackColor={{ false: Colors.border, true: Colors.primary }}
          />
        </View>

        {/* Subscription Posts */}
        <TouchableOpacity style={styles.featureItem} onPress={() => router.push('/professional-dashboard/subscriptions')}>
          <View style={styles.featureIconContainer}>
             <Ionicons name="lock-closed" size={24} color={Colors.primary} />
          </View>
          <View style={styles.featureText}>
             <Text style={styles.featureTitle}>Subscription Posts</Text>
             <Text style={styles.featureSubtitle}>Charge fans for exclusive content</Text>
             <Text style={styles.priceTag}>Set at ₹99/month</Text>
          </View>
          <Switch
            value={features.subscriptions}
            onValueChange={() => toggleFeature('subscriptions')}
            trackColor={{ false: Colors.border, true: Colors.primary }}
          />
        </TouchableOpacity>

        {/* Tips on Posts */}
        <View style={styles.featureItem}>
          <View style={styles.featureIconContainer}>
             <Ionicons name="cash" size={24} color="#4caf50" />
          </View>
          <View style={styles.featureText}>
             <Text style={styles.featureTitle}>Tips on Posts</Text>
             <Text style={styles.featureSubtitle}>Receive direct support on your posts</Text>
          </View>
          <Switch
            value={features.tips}
            onValueChange={() => toggleFeature('tips')}
            trackColor={{ false: Colors.border, true: Colors.primary }}
          />
        </View>

        <Text style={styles.sectionTitle}>PAYMENT & PAYOUTS</Text>

        <TouchableOpacity style={styles.paymentMethod}>
           <View style={styles.pmInfo}>
              <Ionicons name="business" size={24} color={Colors.text} />
              <View style={{marginLeft: 16}}>
                 <Text style={styles.pmTitle}>Bank Account</Text>
                 <Text style={styles.pmSubtitle}>HDFC Bank **** 5678</Text>
              </View>
           </View>
           <Text style={styles.changeLink}>Change</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
           <Ionicons name="information-circle" size={20} color={Colors.textSecondary} />
           <Text style={styles.infoText}>Earnings are paid every Monday. Minimum withdrawal: ₹500.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  content: { flex: 1 },
  earningsCard: { margin: 16, padding: 24, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  earningsInfo: { flex: 1 },
  earningsLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  earningsValue: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginVertical: 4 },
  earningsComparison: { fontSize: 11, color: '#fff' },
  withdrawBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  withdrawText: { color: Colors.primary, fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: Colors.textSecondary, marginLeft: 16, marginTop: 24, marginBottom: 8, letterSpacing: 1 },
  featureItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: Colors.surface, marginHorizontal: 16, borderRadius: 16, marginBottom: 12 },
  featureIconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  featureText: { flex: 1, marginLeft: 16 },
  featureTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  featureSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  featureStats: { fontSize: 11, color: Colors.primary, marginTop: 4, fontWeight: '600' },
  priceTag: { fontSize: 11, color: Colors.success, marginTop: 4, fontWeight: 'bold' },
  paymentMethod: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: Colors.surface, marginHorizontal: 16, borderRadius: 16 },
  pmInfo: { flexDirection: 'row', alignItems: 'center' },
  pmTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  pmSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  changeLink: { color: Colors.primary, fontWeight: 'bold', fontSize: 14 },
  infoBox: { flexDirection: 'row', margin: 16, gap: 10, padding: 12 },
  infoText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
});

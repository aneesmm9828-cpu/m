import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfessionalDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();

  const MENU_ITEMS = [
    {
      id: 'analytics',
      title: 'Analytics',
      subtitle: 'See your reach & insights',
      icon: 'bar-chart',
      iconSet: Ionicons,
      route: '/professional-dashboard/analytics'
    },
    {
      id: 'monetization',
      title: 'Monetization',
      subtitle: 'Earnings & subscriptions',
      icon: 'cash-outline',
      iconSet: Ionicons,
      route: '/professional-dashboard/monetization'
    },
    {
      id: 'scheduled',
      title: 'Scheduled Posts',
      subtitle: '3 posts planned',
      icon: 'calendar-clock-outline',
      iconSet: MaterialCommunityIcons,
      route: '/professional-dashboard/scheduled'
    },
    {
      id: 'brand-deals',
      title: 'Brand Marketplace',
      subtitle: '2 new brand offers',
      icon: 'handshake',
      iconSet: FontAwesome5,
      route: '/professional-dashboard/marketplace'
    },
    {
      id: 'skill-marketplace',
      title: 'Skill Marketplace',
      subtitle: 'Hire your talent',
      icon: 'briefcase-outline',
      iconSet: Ionicons,
      route: '/professional-dashboard/skill-profile'
    },
    {
      id: 'wallet',
      title: 'MARB Wallet',
      subtitle: '₹2,450 available',
      icon: 'wallet-outline',
      iconSet: Ionicons,
      route: '/professional-dashboard/wallet'
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Professional Dashboard</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="settings-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Creator Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={{ uri: user?.avatar_url || 'https://via.placeholder.com/100' }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user?.full_name || user?.username}</Text>
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary} style={{marginLeft: 4}} />
            </View>
            <Text style={styles.category}>Digital Creator • Rising Star</Text>
            <Text style={styles.followerCount}><Text style={styles.bold}>12.4K</Text> Followers</Text>
          </View>
        </View>

        {/* Quick Stats Row */}
        <View style={styles.quickStatsRow}>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatLabel}>Reach</Text>
            <Text style={styles.quickStatValue}>24.5K</Text>
            <Text style={styles.growthText}>+12.4%</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatLabel}>Earnings</Text>
            <Text style={styles.quickStatValue}>₹12.4K</Text>
            <Text style={styles.growthText}>+5.2%</Text>
          </View>
        </View>

        {/* Dashboard Menu Grid */}
        <View style={styles.menuGrid}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuCard}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuIconContainer}>
                <item.iconSet name={item.icon as any} size={28} color={Colors.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Tips & Resources */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Tips & Resources</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tipsScroll}>
            <View style={styles.tipCard}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7' }} style={styles.tipImage} />
              <Text style={styles.tipTitle}>How to grow your audience faster</Text>
            </View>
            <View style={styles.tipCard}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1557804506-669a67965ba0' }} style={styles.tipImage} />
              <Text style={styles.tipTitle}>Monetization 101: A Beginners Guide</Text>
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  headerRight: { flexDirection: 'row', gap: 10 },
  headerBtn: { padding: 4 },
  content: { flex: 1 },
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: Colors.surface, margin: 16, borderRadius: 16 },
  avatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: Colors.primary },
  profileInfo: { marginLeft: 16, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  category: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  followerCount: { fontSize: 14, color: Colors.text, marginTop: 4 },
  bold: { fontWeight: 'bold' },
  quickStatsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  quickStatCard: { flex: 1, backgroundColor: Colors.surface, padding: 16, borderRadius: 12 },
  quickStatLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  quickStatValue: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  growthText: { fontSize: 12, color: Colors.success, marginTop: 4 },
  menuGrid: { paddingHorizontal: 16, gap: 12 },
  menuCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 12, gap: 16 },
  menuIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  menuSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  tipsSection: { marginTop: 24, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, paddingHorizontal: 16, marginBottom: 12 },
  tipsScroll: { paddingHorizontal: 16, gap: 16 },
  tipCard: { width: 220, backgroundColor: Colors.surface, borderRadius: 12, overflow: 'hidden' },
  tipImage: { width: '100%', height: 120, backgroundColor: Colors.border },
  tipTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, padding: 12 },
});

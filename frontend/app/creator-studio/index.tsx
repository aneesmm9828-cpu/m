import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

export default function CreatorStudioScreen() {
  const router = useRouter();

  const renderStatCard = (title: string, value: string, subValue: string, icon: string, color: string) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        <MaterialCommunityIcons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statSubValue, { color: subValue.startsWith('+') ? Colors.success : Colors.error }]}>
        {subValue} in last 28 days
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Studio</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Channel Overview */}
        <View style={styles.channelInfo}>
          <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.avatar} />
          <View>
            <Text style={styles.channelName}>Your Channel Name</Text>
            <Text style={styles.subCount}>12,450 subscribers</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Channel Analytics</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Views', '45.2K', '+12%', 'eye-outline', Colors.primary)}
            {renderStatCard('Watch Time', '1.2K hrs', '+5%', 'clock-outline', '#ffcc00')}
            {renderStatCard('Subscribers', '850', '+24%', 'account-group-outline', '#4fffb0')}
            {renderStatCard('Revenue', '₹12,400', '+18%', 'currency-inr', '#ff8501')}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { label: 'Upload', icon: 'upload', route: '/post/create' },
              { label: 'Live', icon: 'broadcast', route: '/live/host' },
              { label: 'Content', icon: 'video-library', route: '/creator-studio/content' },
              { label: 'Monetize', icon: 'currency-inr', route: '/creator-studio/earn' },
            ].map(item => (
              <TouchableOpacity key={item.label} style={styles.actionBtn}>
                <View style={styles.actionIconContainer}>
                  <MaterialCommunityIcons name={item.icon as any} size={28} color={Colors.text} />
                </View>
                <Text style={styles.actionLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Comments */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionHeader}>Recent Comments</Text>
            <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
          </View>
          {[1, 2].map(i => (
            <View key={i} style={styles.commentItem}>
              <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.miniAvatar} />
              <View style={styles.commentContent}>
                <Text style={styles.commentUser}>User_{i} • 2h ago</Text>
                <Text style={styles.commentText} numberOfLines={2}>
                  Great video! Can you make more content about the new MARB features?
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { color: Colors.text, fontSize: 20, fontWeight: 'bold' },

  content: { flex: 1 },
  channelInfo: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  channelName: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  subCount: { color: Colors.textSecondary, fontSize: 14 },

  section: { padding: 16 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeader: { color: Colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  viewAll: { color: Colors.primary, fontSize: 14 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: (width - 44) / 2, backgroundColor: Colors.cardBackground, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statTitle: { color: Colors.textSecondary, fontSize: 12 },
  statValue: { color: Colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  statSubValue: { fontSize: 11 },

  actionsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  actionBtn: { alignItems: 'center', gap: 8 },
  actionIconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  actionLabel: { color: Colors.textSecondary, fontSize: 12 },

  commentItem: { flexDirection: 'row', gap: 12, padding: 12, backgroundColor: Colors.cardBackground, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  miniAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentContent: { flex: 1 },
  commentUser: { color: Colors.textSecondary, fontSize: 12, marginBottom: 4 },
  commentText: { color: Colors.text, fontSize: 13 },
});

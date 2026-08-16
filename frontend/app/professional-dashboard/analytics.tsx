import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type AnalyticsTab = 'overview' | 'audience' | 'content';

export default function AnalyticsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');

  const renderOverview = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.tabContent}>
      {/* Summary Cards */}
      <View style={styles.statsGrid}>
        {[
          { label: 'Reach', value: '24.5K', change: '+12.4%', up: true },
          { label: 'Impressions', value: '89.2K', change: '+8.1%', up: true },
          { label: 'Profile Visits', value: '3.4K', change: '-2.5%', up: false },
          { label: 'Followers', value: '+248', change: '+18%', up: true },
        ].map((stat, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <View style={[styles.changeBadge, { backgroundColor: stat.up ? Colors.success + '20' : Colors.error + '20' }]}>
              <Ionicons name={stat.up ? "arrow-up" : "arrow-down"} size={12} color={stat.up ? Colors.success : Colors.error} />
              <Text style={[styles.changeText, { color: stat.up ? Colors.success : Colors.error }]}>{stat.change}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Main Chart Placeholder */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Follower Growth</Text>
        <View style={styles.chartPlaceholder}>
          <View style={styles.chartLine} />
          <Text style={styles.bestDayLabel}>Best Day: Friday</Text>
        </View>
        <View style={styles.chartXAxis}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <Text key={i} style={styles.xAxisText}>{d}</Text>)}
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStatsRow}>
        <View style={styles.quickStat}>
          <Text style={styles.qsValue}>1.4K</Text>
          <Text style={styles.qsLabel}>Avg. Daily Reach</Text>
        </View>
        <View style={styles.quickStat}>
          <Text style={styles.qsValue}>12</Text>
          <Text style={styles.qsLabel}>Posts This Week</Text>
        </View>
        <View style={styles.quickStat}>
          <Text style={styles.qsValue}>5.2%</Text>
          <Text style={styles.qsLabel}>Engagement</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderAudience = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.tabContent}>
      {/* Age Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Age Distribution</Text>
        {[
          { label: '13-17', val: 0.12 },
          { label: '18-24', val: 0.35, active: true },
          { label: '25-34', val: 0.28 },
          { label: '35-44', val: 0.15 },
          { label: '45-54', val: 0.07 },
          { label: '55+', val: 0.03 },
        ].map((item, i) => (
          <View key={i} style={styles.barRow}>
            <Text style={styles.barLabel}>{item.label}</Text>
            <View style={styles.barContainer}>
              <View style={[styles.barFill, { width: (item.val * 100) + '%', backgroundColor: item.active ? Colors.primary : Colors.primary + '40' }]} />
            </View>
            <Text style={styles.barValue}>{(item.val * 100).toFixed(0)}%</Text>
          </View>
        ))}
      </View>

      {/* Gender Split */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gender</Text>
        <View style={styles.donutContainer}>
           <View style={styles.donutPlaceholder} />
           <View style={styles.legend}>
              <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#3498db'}]} /><Text style={styles.legendText}>Male 45%</Text></View>
              <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#e91e63'}]} /><Text style={styles.legendText}>Female 52%</Text></View>
              <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#95a5a6'}]} /><Text style={styles.legendText}>Other 3%</Text></View>
           </View>
        </View>
      </View>

      {/* Top Cities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Cities</Text>
        {[
          { city: 'Mumbai', pct: '32%' },
          { city: 'Delhi', pct: '18%' },
          { city: 'Bangalore', pct: '14%' },
          { city: 'Odisha', pct: '12%' },
        ].map((item, i) => (
          <View key={i} style={styles.cityRow}>
            <Text style={styles.cityText}>{i+1}. {item.city}</Text>
            <Text style={styles.cityPct}>{item.pct}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderContent = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.tabContent}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Best Posts</Text>
           <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.postsScroll}>
           {[1, 2, 3, 4].map(i => (
             <View key={i} style={styles.postStatCard}>
                <View style={styles.postThumb} />
                <Text style={styles.psValue}>4.2K reach</Text>
                <View style={styles.psBadge}><Text style={styles.psBadgeText}>8.1%</Text></View>
             </View>
           ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reel Performance</Text>
        <View style={styles.metricsRow}>
           <View style={styles.metricItem}>
             <Text style={styles.mVal}>120h</Text>
             <Text style={styles.mLab}>Watch Time</Text>
           </View>
           <View style={styles.metricItem}>
             <Text style={styles.mVal}>15s</Text>
             <Text style={styles.mLab}>Avg. View</Text>
           </View>
           <View style={styles.metricItem}>
             <Text style={styles.mVal}>65%</Text>
             <Text style={styles.mLab}>Completion</Text>
           </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.dateSelector}>
        <Text style={styles.dateText}>Last 7 days</Text>
        <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
      </View>

      <View style={styles.tabBar}>
        {(['overview', 'audience', 'content'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'audience' && renderAudience()}
      {activeTab === 'content' && renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  dateSelector: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8, gap: 4 },
  dateText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '600' },
  activeTabText: { color: Colors.text },
  tabContent: { flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  statCard: { width: (SCREEN_WIDTH - 48) / 2, backgroundColor: Colors.surface, margin: 8, padding: 16, borderRadius: 16 },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
  changeBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, gap: 2 },
  changeText: { fontSize: 11, fontWeight: 'bold' },
  chartContainer: { padding: 16, margin: 16, backgroundColor: Colors.surface, borderRadius: 16 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 20 },
  chartPlaceholder: { height: 150, justifyContent: 'flex-end', borderBottomWidth: 1, borderBottomColor: Colors.border },
  chartLine: { height: 4, backgroundColor: Colors.primary, width: '100%', borderRadius: 2, position: 'absolute', bottom: 40 },
  bestDayLabel: { position: 'absolute', top: 0, right: 0, fontSize: 10, color: Colors.primary, fontWeight: 'bold' },
  chartXAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  xAxisText: { fontSize: 12, color: Colors.textSecondary },
  quickStatsRow: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  quickStat: { flex: 1, alignItems: 'center' },
  qsValue: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  qsLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  section: { padding: 16, borderBottomWidth: 8, borderBottomColor: Colors.surface },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  seeAll: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  barLabel: { width: 50, fontSize: 13, color: Colors.textSecondary },
  barContainer: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%' },
  barValue: { width: 40, fontSize: 13, color: Colors.text, textAlign: 'right' },
  donutContainer: { height: 200, flexDirection: 'row', alignItems: 'center', gap: 20 },
  donutPlaceholder: { width: 140, height: 140, borderRadius: 70, borderWidth: 20, borderColor: Colors.primary },
  legend: { flex: 1, gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 13, color: Colors.text },
  cityRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cityText: { fontSize: 14, color: Colors.text },
  cityPct: { fontSize: 14, color: Colors.textSecondary, fontWeight: 'bold' },
  postsScroll: { gap: 12 },
  postStatCard: { width: 120, marginRight: 12 },
  postThumb: { width: 120, height: 120, backgroundColor: Colors.surface, borderRadius: 8 },
  psValue: { fontSize: 12, fontWeight: '600', color: Colors.text, marginTop: 8 },
  psBadge: { backgroundColor: Colors.primary + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
  psBadgeText: { fontSize: 10, color: Colors.primary, fontWeight: 'bold' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metricItem: { flex: 1, alignItems: 'center' },
  mVal: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  mLab: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
});

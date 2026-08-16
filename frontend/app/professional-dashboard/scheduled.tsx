import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function ScheduledPostsScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const SCHEDULED = [
    { id: '1', time: '7:00 PM', type: 'Reel', caption: 'Exploring the mountains...', date: 'June 15' },
    { id: '2', time: '10:30 AM', type: 'Post', caption: 'New setup tour!', date: 'June 16' },
  ];

  const renderCalendar = () => (
    <View style={styles.calendarContainer}>
       {/* Mock Calendar Grid */}
       <View style={styles.calHeader}>
          {['S','M','T','W','T','F','S'].map(d => <Text key={d} style={styles.calDayHead}>{d}</Text>)}
       </View>
       <View style={styles.calGrid}>
          {Array(31).fill(0).map((_, i) => (
            <View key={i} style={[styles.calCell, (i + 1 === 15 || i + 1 === 16) && styles.calCellActive]}>
               <Text style={[styles.calDate, (i + 1 === 15 || i + 1 === 16) && styles.calDateActive]}>{i + 1}</Text>
               {(i + 1 === 15 || i + 1 === 16) && <View style={styles.calDot} />}
            </View>
          ))}
       </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scheduled Posts</Text>
        <View style={styles.headerRight}>
           <TouchableOpacity onPress={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}>
              <Ionicons name={viewMode === 'calendar' ? "list-outline" : "calendar-outline"} size={24} color={Colors.text} />
           </TouchableOpacity>
           <TouchableOpacity style={{marginLeft: 16}}><Ionicons name="add" size={28} color={Colors.primary} /></TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {viewMode === 'calendar' && renderCalendar()}

        <View style={styles.dayHeader}>
           <Text style={styles.dayTitle}>Posts for June 15</Text>
        </View>

        {SCHEDULED.map((item, i) => (
          <View key={i} style={styles.postCard}>
             <View style={styles.postThumb} />
             <View style={styles.postInfo}>
                <View style={styles.typeRow}>
                   <View style={styles.typeBadge}><Text style={styles.typeText}>{item.type}</Text></View>
                   <Text style={styles.postTime}>{item.time}</Text>
                </View>
                <Text style={styles.postCaption} numberOfLines={1}>{item.caption}</Text>
             </View>
             <View style={styles.postActions}>
                <TouchableOpacity style={styles.pAction}><Ionicons name="pencil" size={18} color={Colors.primary} /></TouchableOpacity>
                <TouchableOpacity style={styles.pAction}><Ionicons name="trash-outline" size={18} color={Colors.error} /></TouchableOpacity>
             </View>
          </View>
        ))}

        <TouchableOpacity style={styles.emptyState}>
           <Ionicons name="calendar-outline" size={48} color={Colors.textSecondary} />
           <Text style={styles.emptyTitle}>No more posts scheduled</Text>
           <Text style={styles.emptyLink}>Schedule your first post</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  content: { flex: 1 },
  calendarContainer: { padding: 16, borderBottomWidth: 8, borderBottomColor: Colors.surface },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  calDayHead: { width: 40, textAlign: 'center', color: Colors.textSecondary, fontSize: 12, fontWeight: 'bold' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  calCell: { width: (Dimensions.get('window').width - 80) / 7, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  calCellActive: { backgroundColor: Colors.primary + '20' },
  calDate: { fontSize: 14, color: Colors.text },
  calDateActive: { color: Colors.primary, fontWeight: 'bold' },
  calDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary, position: 'absolute', bottom: 4 },
  dayHeader: { padding: 16, backgroundColor: Colors.surface },
  dayTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.text },
  postCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  postThumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: Colors.surface },
  postInfo: { flex: 1, marginLeft: 16 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  typeBadge: { backgroundColor: Colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 10, fontWeight: 'bold', color: Colors.background },
  postTime: { fontSize: 12, color: Colors.textSecondary },
  postCaption: { fontSize: 13, color: Colors.text },
  postActions: { flexDirection: 'row', gap: 12 },
  pAction: { padding: 8 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 16, color: Colors.textSecondary, marginTop: 16 },
  emptyLink: { color: Colors.primary, fontWeight: 'bold', marginTop: 8 },
});

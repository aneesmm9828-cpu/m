import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { GlassCard } from '../../components/GlassCard';
import { MARBButton } from '../../components/MARBButton';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function StudyRoomScreen() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      Alert.alert("Session Done!", "Time for a break.");
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Study Room</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard style={styles.timerCard}>
          <Text style={styles.timerLabel}>Pomodoro Timer</Text>
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          <MARBButton
            title={isActive ? "Pause Session" : "Start Focus"}
            onPress={() => setIsActive(!isActive)}
            variant={isActive ? 'secondary' : 'primary'}
            style={styles.timerBtn}
          />
        </GlassCard>

        <View style={styles.statsRow}>
           <View style={styles.statBox}>
              <Text style={styles.statNum}>12</Text>
              <Text style={styles.statLabel}>People Live</Text>
           </View>
           <View style={styles.statBox}>
              <Text style={styles.statNum}>45m</Text>
              <Text style={styles.statLabel}>My Focus</Text>
           </View>
        </View>

        <Text style={styles.sectionTitle}>Active Members</Text>
        <View style={styles.grid}>
           {[1,2,3,4].map(i => (
             <View key={i} style={styles.cameraPlaceholder}>
               <Ionicons name="person" size={40} color={Colors.textTertiary} />
               <View style={styles.nameBadge}>
                 <Text style={styles.nameText}>User {i}</Text>
               </View>
             </View>
           ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  content: {
    padding: 20,
  },
  timerCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  timerText: {
    color: Colors.primary,
    fontSize: 64,
    fontWeight: '800',
    marginVertical: 10,
  },
  timerBtn: {
    width: '80%',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNum: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cameraPlaceholder: {
    width: (width - 50) / 2,
    height: 150,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  nameBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nameText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

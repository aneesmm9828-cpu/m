import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

const FEATURES = [
  { id: 'study-rooms', title: 'Study Rooms', icon: 'book-reader', color: '#00d9ff', desc: 'Focus together' },
  { id: 'skill-marketplace', title: 'Skill Market', icon: 'rocket', color: '#4fffb0', desc: 'Learn & Earn' },
  { id: 'truth-verified', title: 'Truth Verified', icon: 'shield-check', color: '#ffcc00', desc: 'Fact checking' },
  { id: 'mood-feed', title: 'Mood Feed', icon: 'smile-beam', color: '#ff8501', desc: 'Feed by mood' },
  { id: 'friend-map', title: 'Friend Map', icon: 'map-marked-alt', color: '#1877F2', desc: 'Real-time social' },
  { id: 'events', title: 'Events', icon: 'calendar-alt', color: '#ff3b5c', desc: 'Local meetups' },
  { id: 'broadcast', title: 'Broadcast', icon: 'broadcast-tower', color: '#9d50bb', desc: 'Creator channels' },
  { id: 'notes', title: 'Notes', icon: 'sticky-note', color: '#6e8efb', desc: 'Quick thoughts' },
  { id: 'memories', title: 'Memories', icon: 'history', color: '#fbc2eb', desc: 'Relive moments' },
  { id: 'streaks', title: 'Streaks', icon: 'fire', color: '#ff5f6d', desc: 'Daily activity' },
  { id: 'solar-system', title: 'Solar System', icon: 'atom', color: '#8e2de2', desc: 'Outer circle' },
  { id: 'snap-score', title: 'Snap Score', icon: 'bolt', color: '#ff9966', desc: 'Social rank' },
  { id: 'avatar-creator', title: 'AI Avatar', icon: 'user-astronaut', color: '#2af598', desc: 'Digital you' },
  { id: 'map-stories', title: 'Map Stories', icon: 'globe-asia', color: '#00c6ff', desc: 'Explore world' },
  { id: 'regional-feed', title: 'Regional Feed', icon: 'map-pin', color: '#f093fb', desc: 'Near you' },
  { id: 'got-talent', title: 'MARB Talent', icon: 'star', color: '#f5af19', desc: 'Showcase skill' },
  { id: 'video-hub', title: 'Video Hub', icon: 'video', color: '#ee0979', desc: 'Long form' },
  { id: 'wallet', title: 'MARB Money', icon: 'wallet', color: '#4facfe', desc: 'Earnings' },
  { id: 'shop', title: 'Shop', icon: 'shopping-bag', color: '#43e97b', desc: 'Marketplace' },
  { id: 'creator', title: 'Creator Studio', icon: 'chart-line', color: '#fa709a', desc: 'Analytics' },
  { id: 'live', title: 'Live Now', icon: 'stream', color: '#ff0844', desc: 'Interact live' },
  { id: 'help', title: 'Help Center', icon: 'question-circle', color: '#accbee', desc: 'Get support' },
];

export default function UniqueHubScreen() {
  const router = useRouter();

  const handlePress = (id: string) => {
    switch(id) {
      case 'study-rooms':
        router.push('/unique/study-rooms');
        break;
      case 'friend-map':
        router.push('/friend-map');
        break;
      case 'wallet':
        router.push('/wallet');
        break;
      case 'shop':
        router.push('/shop');
        break;
      case 'creator':
        router.push('/creator/dashboard');
        break;
      case 'video-hub':
        router.push('/video-hub');
        break;
      case 'live':
        router.push('/(tabs)/home'); // Placeholder
        break;
      default:
        router.push(`/unique/${id}` as any);
        break;
    }
  };

  const renderItem = ({ item }: { item: typeof FEATURES[0] }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => handlePress(item.id)}
    >
      <LinearGradient
        colors={[item.color + '40', 'transparent']}
        style={styles.cardGradient}
      />
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <FontAwesome5 name={item.icon} size={24} color={item.color} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc}>{item.desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} style={styles.chevron} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MARB Hub</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={FEATURES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <View style={styles.intro}>
            <Text style={styles.introTitle}>Discover India's Super App</Text>
            <Text style={styles.introSubtitle}>
              Explore unique features designed to connect, learn, and earn.
            </Text>
          </View>
        }
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  searchButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  intro: {
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: cardWidth,
    backgroundColor: Colors.cardBackground,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chevron: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
});

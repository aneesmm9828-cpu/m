import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

export default function CreateMenuScreen() {
  const router = useRouter();

  const MENU_OPTIONS = [
    { label: 'Post', icon: 'image-outline', type: 'ion', route: '/post/create', desc: 'Photo, Video, Carousel' },
    { label: 'Story', icon: 'camera-outline', type: 'ion', route: '/story/create', desc: 'Temporary 24h content' },
    { label: 'Reel', icon: 'play-box-outline', type: 'mc', route: '/reel/create', desc: 'Short-form vertical video' },
    { label: 'Live', icon: 'broadcast', type: 'mc', route: '/live/host', desc: 'Real-time video streaming' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={32} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.menuContainer}>
        {MENU_OPTIONS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
          >
            <View style={styles.iconContainer}>
              {item.type === 'ion' ? (
                <Ionicons name={item.icon as any} size={32} color={Colors.primary} />
              ) : (
                <MaterialCommunityIcons name={item.icon as any} size={32} color={Colors.primary} />
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.description}>{item.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  menuContainer: { padding: 16, gap: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: { flex: 1 },
  label: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  description: { fontSize: 14, color: Colors.textSecondary },
});

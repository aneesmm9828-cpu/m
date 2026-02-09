import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [privateAccount, setPrivateAccount] = useState(false);

  const settingsSections = [
    {
      title: 'Your account',
      items: [
        { icon: 'person-outline', label: 'Account Center', badge: true },
      ],
    },
    {
      title: 'Who can see your content',
      items: [
        { icon: 'lock-closed-outline', label: 'Account privacy', hasSwitch: true },
        { icon: 'people-outline', label: 'Close friends' },
        { icon: 'share-outline', label: 'Crossposting' },
        { icon: 'ban-outline', label: 'Blocked' },
        { icon: 'location-outline', label: 'Story and location' },
        { icon: 'heart-outline', label: 'Activity in Friends tab' },
      ],
    },
    {
      title: 'How others can interact with you',
      items: [
        { icon: 'chatbubble-outline', label: 'Messages and story replies' },
        { icon: 'at-outline', label: 'Tags and mentions' },
        { icon: 'chatbox-outline', label: 'Comments' },
        { icon: 'arrow-redo-outline', label: 'Sharing' },
        { icon: 'remove-circle-outline', label: 'Restricted' },
        { icon: 'time-outline', label: 'Limit interactions' },
        { icon: 'eye-off-outline', label: 'Hidden words' },
        { icon: 'person-add-outline', label: 'Follow and invite friends' },
      ],
    },
    {
      title: 'What you see',
      items: [
        { icon: 'star-outline', label: 'Favorites' },
        { icon: 'volume-mute-outline', label: 'Muted accounts' },
        { icon: 'grid-outline', label: 'Content preferences' },
        { icon: 'thumbs-up-outline', label: 'Like and share counts' },
      ],
    },
    {
      title: 'Your app and media',
      items: [
        { icon: 'phone-portrait-outline', label: 'Device permissions' },
        { icon: 'archive-outline', label: 'Archiving and downloading' },
        { icon: 'accessibility-outline', label: 'Accessibility' },
        { icon: 'language-outline', label: 'Language and translations' },
        { icon: 'cellular-outline', label: 'Data usage and media quality' },
        { icon: 'globe-outline', label: 'App website permissions' },
      ],
    },
    {
      title: 'Family',
      items: [
        { icon: 'shield-checkmark-outline', label: 'Family Center', subtitle: 'Supervision for teen accounts' },
      ],
    },
    {
      title: 'For professionals',
      items: [
        { icon: 'briefcase-outline', label: 'Account type and tools' },
        { icon: 'checkmark-circle-outline', label: 'Verification' },
      ],
    },
    {
      title: 'Orders & support',
      items: [
        { icon: 'card-outline', label: 'Orders and payments' },
        { icon: 'help-circle-outline', label: 'Help' },
        { icon: 'shield-outline', label: 'Privacy Center' },
        { icon: 'alert-circle-outline', label: 'Account Status' },
        { icon: 'information-circle-outline', label: 'About' },
      ],
    },
  ];

  const renderSettingItem = (item, index) => (
    <TouchableOpacity
      key={index}
      style={styles.settingItem}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={item.icon} size={24} color={Colors.text} />
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingLabel}>{item.label}</Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      {item.hasSwitch ? (
        <Switch
          value={privateAccount}
          onValueChange={setPrivateAccount}
          trackColor={{ false: Colors.border, true: Colors.primary }}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      )}
      {item.badge && (
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings and activity</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userSection}>
          <Image
            source={{ uri: user?.picture || 'https://via.placeholder.com/100' }}
            style={styles.userImage}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userUsername}>@{user?.username}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) =>
              renderSettingItem(item, itemIndex)
            )}
          </View>
        ))}

        {/* Logout Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Login</Text>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="person-add-outline" size={24} color={Colors.primary} />
              <Text style={[styles.settingLabel, { color: Colors.primary }]}>Add account</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => {
              logout();
              router.replace('/auth/login');
            }}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="log-out-outline" size={24} color={Colors.error} />
              <Text style={[styles.settingLabel, { color: Colors.error }]}>Log out</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>MARB from Emergent AI</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  userUsername: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    color: Colors.text,
  },
  settingSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: 14,
    left: 32,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

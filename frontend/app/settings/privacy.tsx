import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  
  const [privateAccount, setPrivateAccount] = useState(user?.is_private || false);
  const [activityStatus, setActivityStatus] = useState(user?.show_activity_status !== false);
  const [storySharing, setStorySharing] = useState(true);
  const [mentionsEveryone, setMentionsEveryone] = useState(true);
  const [tagsManually, setTagsManually] = useState(false);
  const [likeCounts, setLikeCounts] = useState(true);

  const handlePrivateToggle = async (value) => {
    setPrivateAccount(value);
    try {
      await api.put('/users/me/privacy', { is_private: value });
      setUser({ ...user, is_private: value });
    } catch (error) {
      console.error('Error updating privacy:', error);
      setPrivateAccount(!value);
    }
  };

  const handleActivityStatusToggle = async (value) => {
    setActivityStatus(value);
    try {
      await api.put('/users/me/privacy', { show_activity_status: value });
      setUser({ ...user, show_activity_status: value });
    } catch (error) {
      console.error('Error updating activity status:', error);
      setActivityStatus(!value);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Account Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account privacy</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Private account</Text>
              <Text style={styles.settingDescription}>
                When your account is private, only people you approve can see your photos and videos.
              </Text>
            </View>
            <Switch
              value={privateAccount}
              onValueChange={handlePrivateToggle}
              trackColor={{ false: Colors.border, true: Colors.primary }}
            />
          </View>
        </View>

        {/* Activity Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity status</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show activity status</Text>
              <Text style={styles.settingDescription}>
                Allow accounts you follow and anyone you message to see when you were last active.
              </Text>
            </View>
            <Switch
              value={activityStatus}
              onValueChange={handleActivityStatusToggle}
              trackColor={{ false: Colors.border, true: Colors.primary }}
            />
          </View>
        </View>

        {/* Story */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Story</Text>
          
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navLabel}>Hide story from</Text>
            <View style={styles.navRight}>
              <Text style={styles.navValue}>0 people</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navLabel}>Close friends</Text>
            <View style={styles.navRight}>
              <Text style={styles.navValue}>0 people</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Allow sharing to stories</Text>
              <Text style={styles.settingDescription}>
                Let people share your posts and reels to their stories.
              </Text>
            </View>
            <Switch
              value={storySharing}
              onValueChange={setStorySharing}
              trackColor={{ false: Colors.border, true: Colors.primary }}
            />
          </View>
        </View>

        {/* Interactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interactions</Text>
          
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/settings/blocked')}>
            <Text style={styles.navLabel}>Blocked accounts</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/settings/muted')}>
            <Text style={styles.navLabel}>Muted accounts</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/settings/restricted')}>
            <Text style={styles.navLabel}>Restricted accounts</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Tags and Mentions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags and mentions</Text>
          
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navLabel}>Allow tags from</Text>
            <View style={styles.navRight}>
              <Text style={styles.navValue}>Everyone</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navLabel}>Allow mentions from</Text>
            <View style={styles.navRight}>
              <Text style={styles.navValue}>Everyone</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Manually approve tags</Text>
              <Text style={styles.settingDescription}>
                Photos and videos where you're tagged won't appear on your profile until you approve them.
              </Text>
            </View>
            <Switch
              value={tagsManually}
              onValueChange={setTagsManually}
              trackColor={{ false: Colors.border, true: Colors.primary }}
            />
          </View>
        </View>

        {/* Posts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posts</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Hide like and view counts</Text>
              <Text style={styles.settingDescription}>
                The number of likes on posts from other accounts will be hidden.
              </Text>
            </View>
            <Switch
              value={!likeCounts}
              onValueChange={(v) => setLikeCounts(!v)}
              trackColor={{ false: Colors.border, true: Colors.primary }}
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
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
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navLabel: {
    fontSize: 15,
    color: Colors.text,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navValue: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

export default function SecurityScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginActivity, setLoginActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const [securityRes, activityRes] = await Promise.all([
        api.get('/users/me/security').catch(() => ({ data: {} })),
        api.get('/users/me/login-activity').catch(() => ({ data: [] })),
      ]);
      setTwoFactorEnabled(securityRes.data?.two_factor_enabled || false);
      setLoginActivity(activityRes.data || []);
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = () => {
    if (twoFactorEnabled) {
      Alert.alert(
        'Disable Two-Factor Authentication',
        'Are you sure you want to disable 2FA? This will make your account less secure.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              try {
                await api.post('/users/me/security/2fa/disable');
                setTwoFactorEnabled(false);
              } catch (error) {
                console.error('Error disabling 2FA:', error);
              }
            },
          },
        ]
      );
    } else {
      router.push('/settings/2fa-setup');
    }
  };

  const handleLogoutDevice = (sessionId) => {
    Alert.alert(
      'Log Out Device',
      'Are you sure you want to log out this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/users/me/logout-device/' + sessionId);
              setLoginActivity(loginActivity.filter(a => a.session_id !== sessionId));
            } catch (error) {
              console.error('Error logging out device:', error);
            }
          },
        },
      ]
    );
  };

  const renderLoginItem = ({ item }) => (
    <View style={styles.loginItem}>
      <View style={styles.loginIcon}>
        <Ionicons 
          name={item.device_type === 'mobile' ? 'phone-portrait-outline' : 'laptop-outline'} 
          size={24} 
          color={Colors.text} 
        />
      </View>
      <View style={styles.loginInfo}>
        <Text style={styles.loginDevice}>{item.device_name || 'Unknown Device'}</Text>
        <Text style={styles.loginLocation}>{item.location || 'Unknown Location'}</Text>
        <Text style={styles.loginTime}>
          {item.is_current ? 'This device' : item.last_active || 'Active recently'}
        </Text>
      </View>
      {item.is_current ? (
        <View style={styles.currentBadge}>
          <Text style={styles.currentText}>Current</Text>
        </View>
      ) : (
        <TouchableOpacity onPress={() => handleLogoutDevice(item.session_id)}>
          <Ionicons name="log-out-outline" size={24} color={Colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Password */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Login security</Text>
          
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => router.push('/settings/change-password')}
          >
            <Ionicons name="key-outline" size={24} color={Colors.text} />
            <Text style={styles.navLabel}>Password</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Two-Factor Authentication */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Two-factor authentication</Text>
          
          <View style={styles.twoFactorCard}>
            <View style={styles.twoFactorHeader}>
              <Ionicons 
                name={twoFactorEnabled ? 'shield-checkmark' : 'shield-outline'} 
                size={32} 
                color={twoFactorEnabled ? Colors.success : Colors.textSecondary} 
              />
              <View style={styles.twoFactorInfo}>
                <Text style={styles.twoFactorTitle}>Two-factor authentication</Text>
                <Text style={styles.twoFactorStatus}>
                  {twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                </Text>
              </View>
            </View>
            <Text style={styles.twoFactorDesc}>
              Add an extra layer of security to your account. You'll need to enter a code from your phone in addition to your password when you log in.
            </Text>
            <TouchableOpacity 
              style={[styles.twoFactorButton, twoFactorEnabled && styles.twoFactorButtonDisable]}
              onPress={handleToggle2FA}
            >
              <Text style={[styles.twoFactorButtonText, twoFactorEnabled && styles.twoFactorButtonTextDisable]}>
                {twoFactorEnabled ? 'Turn Off' : 'Turn On'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navLabel}>Authentication app</Text>
            <View style={styles.navRight}>
              <Text style={styles.navValue}>{twoFactorEnabled ? 'Set up' : 'Not set up'}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navLabel}>Text message</Text>
            <View style={styles.navRight}>
              <Text style={styles.navValue}>Not set up</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Login Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Login activity</Text>
          <Text style={styles.sectionDesc}>
            Check the devices where you're logged in
          </Text>
          
          {loginActivity.length > 0 ? (
            loginActivity.map((item, index) => renderLoginItem({ item, index }))
          ) : (
            <View style={styles.emptyActivity}>
              <Ionicons name="laptop-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No other devices logged in</Text>
            </View>
          )}
          
          <TouchableOpacity style={styles.logoutAllButton}>
            <Text style={styles.logoutAllText}>Log out of all devices</Text>
          </TouchableOpacity>
        </View>

        {/* Saved Login */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved login info</Text>
          
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navLabel}>Saved login info</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Data and History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data and history</Text>
          
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navLabel}>Access data</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navLabel}>Download your data</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navLabel}>Apps and websites</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
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
  sectionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    marginBottom: 12,
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
    gap: 12,
  },
  navLabel: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
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
  twoFactorCard: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  twoFactorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  twoFactorInfo: {
    flex: 1,
  },
  twoFactorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  twoFactorStatus: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  twoFactorDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  twoFactorButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  twoFactorButtonDisable: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  twoFactorButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.background,
  },
  twoFactorButtonTextDisable: {
    color: Colors.error,
  },
  loginItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  loginIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginInfo: {
    flex: 1,
  },
  loginDevice: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  loginLocation: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  loginTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: Colors.cardBackground,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  logoutAllButton: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  logoutAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.error,
  },
});

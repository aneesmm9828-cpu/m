import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../../constants/colors';
import { useAuthStore } from '../../../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';

export default function QRCodeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const qrRef = useRef(null);

  const profileUrl = `marb://profile/${user?.username}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Follow me on MARB: @${user?.username}\n${profileUrl}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#1a237e', '#0d47a1', '#01579b']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={32} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.colorButton}>
            <Text style={styles.colorButtonText}>COLOR</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="qr-code" size={32} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Friends can scan this to follow you.</Text>
          <Ionicons name="arrow-down" size={32} color={Colors.text} style={styles.arrow} />

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <QRCode
              value={profileUrl}
              size={250}
              backgroundColor="white"
              color="#2196F3"
              logo={require('../../../assets/images/marb-logo.jpg')}
              logoSize={60}
              logoBackgroundColor="white"
              logoMargin={4}
              logoBorderRadius={10}
            />
            <Text style={styles.username}>@{user?.username}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-social" size={24} color={Colors.text} />
              <Text style={styles.actionText}>Share profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="link" size={24} color={Colors.text} />
              <Text style={styles.actionText}>Copy link</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="download" size={24} color={Colors.text} />
              <Text style={styles.actionText}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a237e',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  colorButton: {
    borderWidth: 2,
    borderColor: Colors.text,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  colorButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  arrow: {
    marginBottom: 32,
  },
  qrContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 48,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 16,
  },
  actions: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    padding: 16,
    gap: 32,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 12,
    color: Colors.text,
  },
});

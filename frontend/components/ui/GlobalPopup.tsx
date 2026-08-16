import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '../../store/uiStore';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

export const GlobalPopup = () => {
  const { isVisible, type, message, progress, hidePopup } = useUIStore();
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.spring(translateY, {
        toValue: 20,
        useNativeDriver: true,
        friction: 5,
      }).start();

      if (type === 'success' || type === 'error') {
        const timer = setTimeout(() => {
          hidePopup();
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else {
      Animated.timing(translateY, {
        toValue: -120,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, type]);

  const getIcon = () => {
    switch (type) {
      case 'upload': return 'cloud-upload-outline';
      case 'download': return 'cloud-download-outline';
      case 'success': return 'checkmark-circle-outline';
      case 'error': return 'alert-circle-outline';
      default: return 'information-circle-outline';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success': return Colors.success;
      case 'error': return Colors.error;
      case 'upload':
      case 'download': return Colors.primary;
      default: return Colors.text;
    }
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.content}>
        <View style={styles.row}>
          {(type === 'upload' || type === 'download') && progress < 100 ? (
            <ActivityIndicator size="small" color={getIconColor()} style={styles.icon} />
          ) : (
            <Ionicons name={getIcon()} size={24} color={getIconColor()} style={styles.icon} />
          )}
          <View style={styles.textContainer}>
            <Text style={styles.message}>{message}</Text>
            {(type === 'upload' || type === 'download') && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  content: {
    backgroundColor: 'rgba(25, 25, 25, 0.95)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 8,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    position: 'absolute',
    right: 0,
    top: -18,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

import { Alert } from 'react-native';

/**
 * Validates video properties based on 2026 standards
 * Target: 1080x1920, 9:16 aspect ratio
 * Returns true if valid, false if user should be warned/blocked
 */
export const validateReelDimensions = (width: number, height: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const targetRatio = 9 / 16;
    const currentRatio = width / height;
    const tolerance = 0.05;

    // 1. Check for Horizontal Video (Major Violation)
    if (width > height) {
      Alert.alert(
        'Horizontal Video!',
        'This video is horizontal. Instagram (and MARB) will show black bars on top and bottom. Do you want to continue?',
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Continue Anyway', onPress: () => resolve(true) }
        ]
      );
      return;
    }

    // 2. Check for Aspect Ratio Deviation
    if (Math.abs(currentRatio - targetRatio) > tolerance) {
      Alert.alert(
        'Not 9:16 Ratio',
        'Your video is vertical but not the standard 9:16. It might be cropped in the feed. Continue?',
        [
          { text: 'Adjust Video', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Use Current', onPress: () => resolve(true) }
        ]
      );
      return;
    }

    // 3. Check for low resolution
    if (width < 1080 || height < 1920) {
      console.warn(`Low resolution: ${width}x${height}. Ideal is 1080x1920.`);
      // We allow low res but maybe log it for analytics
    }

    resolve(true);
  });
};

/**
 * Formats file size to human readable string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Mobile-Optimized Dimensions & Touch Targets
import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Minimum touch target size (iOS HIG & Material Design)
export const TouchTarget = {
  minSize: 44, // iOS minimum
  androidMinSize: 48, // Android minimum
  comfortable: 56, // Comfortable size
};

export const Layout = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  isSmallDevice: SCREEN_WIDTH < 375,
  isMediumDevice: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  isLargeDevice: SCREEN_WIDTH >= 414,
  headerHeight: Platform.OS === 'ios' ? 64 : 56,
  tabBarHeight: Platform.OS === 'ios' ? 60 : 56,
};

// Safe padding for content
export const SafePadding = {
  horizontal: Spacing.lg,
  vertical: Spacing.md,
};

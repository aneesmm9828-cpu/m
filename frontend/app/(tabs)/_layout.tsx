import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { TouchTarget } from '../../constants/layout';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  
  // Android-specific bottom padding to avoid system navigation
  const tabBarHeight = Platform.OS === 'ios' ? 60 : 65;
  const bottomPadding = Platform.OS === 'android' 
    ? Math.max(insets.bottom, 8) + 8  // Extra 8px safety margin for Android
    : insets.bottom || 8;
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.cardBackground,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: tabBarHeight + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          paddingHorizontal: 4,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          minHeight: TouchTarget.minSize,
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={32} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="play-circle" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

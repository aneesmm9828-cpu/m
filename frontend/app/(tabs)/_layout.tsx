import React, { useCallback } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { TouchTarget } from '../../constants/layout';

// Tab icons defined outside component to avoid re-renders
const HomeIcon = ({ color }) => <Ionicons name="home" size={26} color={color} />;
const ExploreIcon = ({ color }) => <Ionicons name="search" size={26} color={color} />;
const CreateIcon = ({ color }) => <Ionicons name="add-circle" size={32} color={color} />;
const ReelsIcon = ({ color }) => <Ionicons name="play-circle" size={26} color={color} />;
const ProfileIcon = ({ color }) => <Ionicons name="person" size={26} color={color} />;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  
  const tabBarHeight = Platform.OS === 'ios' ? 60 : 65;
  const bottomPadding = Platform.OS === 'android' 
    ? Math.max(insets.bottom, 8) + 8
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
      <Tabs.Screen name="home" options={{ tabBarIcon: HomeIcon }} />
      <Tabs.Screen name="explore" options={{ tabBarIcon: ExploreIcon }} />
      <Tabs.Screen name="create" options={{ tabBarIcon: CreateIcon }} />
      <Tabs.Screen name="reels" options={{ tabBarIcon: ReelsIcon }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ProfileIcon }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
    </Tabs>
  );
}

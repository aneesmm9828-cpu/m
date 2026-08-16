import 'expo-standard-web-crypto';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { checkSupabaseConnection } from '../utils/checkSupabase';
import { CallManager } from '../components/CallManager';
import { GlobalPopup } from '../components/ui/GlobalPopup';

export default function RootLayout() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    // Small delay to ensure navigator is definitely ready
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);

    initialize();

    checkSupabaseConnection().then(result => {
      if (result.success) {
        console.log('✅ Supabase data sync is active and working.');
      } else {
        console.warn('❌ Supabase sync issue:', result.error);
      }
    });

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log('Auth Transition Check - Auth:', isAuthenticated, 'Loading:', isLoading, 'Path:', segments);

    if (isLoading || !isMounted) return;

    const inAuthGroup = segments[0] === 'auth';

    if (isAuthenticated) {
      if (inAuthGroup || segments.length === 0 || segments[0] === 'index') {
        console.log('User is Authenticated -> Moving to Home');
        router.replace('/(tabs)/home');
      }
    } else {
      if (!inAuthGroup) {
        console.log('User is NOT Authenticated -> Moving to Login');
        router.replace('/auth/login');
      }
    }
  }, [isAuthenticated, isLoading, segments, isMounted]);

  return (
    <>
      <CallManager />
      <GlobalPopup />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

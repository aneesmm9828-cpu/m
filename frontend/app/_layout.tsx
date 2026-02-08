import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { api } from '../utils/api';

export default function RootLayout() {
  const { isAuthenticated, isLoading, setUser, setIsAuthenticated, setIsLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data) {
        setUser(response.data);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log('Not authenticated');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Don't navigate until loading is done
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

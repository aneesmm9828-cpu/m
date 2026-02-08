import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../utils/api';
import { Colors } from '../../constants/colors';

export default function AuthCallback() {
  const router = useRouter();
  const { setUser, setIsAuthenticated } = useAuthStore();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    processAuth();
  }, []);

  const processAuth = async () => {
    try {
      // Get session_id from URL fragment
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const sessionId = params.get('session_id');

      if (!sessionId) {
        throw new Error('No session_id found');
      }

      // Send to backend
      const response = await api.post('/auth/session', { session_id: sessionId });
      
      if (response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        
        // Clear the hash and redirect
        window.history.replaceState(null, '', window.location.pathname);
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      router.replace('/auth/login');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

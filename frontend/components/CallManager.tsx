import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useCallStore } from '../store/callStore';
import { useAuthStore } from '../store/authStore';

export const CallManager = () => {
  const { activeCall, setupSignaling, cleanupSignaling, isJoined } = useCallStore();
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      setupSignaling();
    } else {
      cleanupSignaling();
    }
    return () => cleanupSignaling();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!activeCall) {
      // If we were in a call screen, we should probably go back or to home
      // But we should be careful not to redirect if we are already on a safe screen
      return;
    }

    const { status, call_type, caller_id, id } = activeCall;
    const isCaller = user?.id === caller_id;

    console.log(`[CallManager] Call ${id} status: ${status}, Type: ${call_type}, Role: ${isCaller ? 'Caller' : 'Callee'}`);

    if (status === 'ringing') {
      if (isCaller) {
        router.push('/calls/outgoing');
      } else {
        router.push('/calls/incoming');
      }
    } else if (status === 'accepted') {
      if (call_type === 'video') {
        router.push('/calls/video');
      } else {
        router.push('/calls/voice');
      }
    } else if (['ended', 'declined', 'cancelled', 'missed'].includes(status)) {
      router.dismissAll(); // Close call screens
    }
  }, [activeCall?.status, activeCall?.id]);

  return null;
};

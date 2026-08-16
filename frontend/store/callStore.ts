import { create } from 'zustand';
import { supabase } from '../utils/supabaseConfig';
import { Alert, Platform } from 'react-native';
import { RealtimeChannel } from '@supabase/supabase-js';

// Dynamically import Zego only on native platforms
const ZegoExpressEngine = Platform.OS !== 'web'
  ? require('zego-express-engine-reactnative').default
  : null;

export type CallStatus = 'ringing' | 'accepted' | 'declined' | 'missed' | 'ended' | 'cancelled';
export type CallType = 'voice' | 'video';

interface CallData {
  id: string;
  caller_id: string;
  callee_id: string;
  room_id: string;
  call_type: CallType;
  status: CallStatus;
  caller_name?: string;
  caller_photo?: string;
  callee_name?: string;
  callee_photo?: string;
}

interface CallState {
  activeCall: CallData | null;
  isEngineInitialized: boolean;
  isJoined: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  isCameraOn: boolean;
  isFrontCamera: boolean;
  signalingChannel: RealtimeChannel | null;
  remoteStreamID: string | null;

  // Actions
  setupSignaling: () => Promise<void>;
  cleanupSignaling: () => void;
  initCall: (targetId: string, type: CallType, targetName?: string, targetPhoto?: string) => Promise<void>;
  receiveCall: (call: CallData) => void;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  cancelCall: () => Promise<void>;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  toggleCamera: () => void;
  switchCamera: () => void;
  reset: () => void;
}

const ZEGO_APP_ID = Number(process.env.EXPO_PUBLIC_ZEGO_APP_ID);

export const useCallStore = create<CallState>((set, get) => ({
  activeCall: null,
  isEngineInitialized: false,
  isJoined: false,
  isMuted: false,
  isSpeakerOn: true,
  isCameraOn: true,
  isFrontCamera: true,
  signalingChannel: null,
  remoteStreamID: null,

  setupSignaling: async () => {
    if (get().signalingChannel) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    console.log('[CallStore] Setting up signaling for user:', user.id);

    const channel = supabase
      .channel(`calls-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `callee_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('[CallStore] Incoming call payload:', payload);
          if (payload.new.status === 'ringing') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', payload.new.caller_id)
              .single();

            get().receiveCall({
              ...payload.new as CallData,
              caller_name: profile?.full_name,
              caller_photo: profile?.avatar_url
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
        },
        async (payload) => {
          const activeCall = get().activeCall;
          if (activeCall && payload.new.id === activeCall.id) {
            console.log('[CallStore] Call status updated:', payload.new.status);

            const oldStatus = activeCall.status;
            const newStatus = payload.new.status as CallStatus;

            set({ activeCall: { ...activeCall, status: newStatus } });

            // If caller sees call accepted, start publishing
            if (oldStatus === 'ringing' && newStatus === 'accepted') {
                const isCaller = user.id === activeCall.caller_id;
                if (isCaller) {
                    console.log('[CallStore] Call accepted by remote! Starting publishing...');
                    if (ZegoExpressEngine) {
                        ZegoExpressEngine.instance().startPublishingStream(activeCall.id);
                        set({ isJoined: true });
                    }
                }
            }

            if (['declined', 'cancelled', 'ended', 'missed'].includes(newStatus)) {
               console.log('[CallStore] Call ended/aborted. Resetting...');
               get().reset();
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[CallStore] Signaling channel status:', status);
      });

    set({ signalingChannel: channel });
  },

  cleanupSignaling: () => {
    const channel = get().signalingChannel;
    if (channel) {
      console.log('[CallStore] Cleaning up signaling...');
      channel.unsubscribe();
      set({ signalingChannel: null });
    }
  },

  initCall: async (targetId, type, targetName, targetPhoto) => {
    console.log(`[CallStore] Initializing ${type} call to ${targetId}`);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[CallStore] No authenticated user found');
        return;
      }

      const room_id = `room_${Math.random().toString(36).substring(7)}`;

      const { data, error } = await supabase
        .from('calls')
        .insert({
          caller_id: user.id,
          callee_id: targetId,
          room_id,
          call_type: type,
          status: 'ringing'
        })
        .select()
        .single();

      if (error) {
        console.error('[CallStore] DB Insert Error:', error.message);
        Alert.alert('Error', 'Could not initiate call record');
        return;
      }

      set({
        activeCall: {
          ...data,
          callee_name: targetName,
          callee_photo: targetPhoto
        }
      });

      // Get Token
      const session = await supabase.auth.getSession();
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-zego-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`
        },
        body: JSON.stringify({ userId: user.id, roomId: room_id })
      });

      if (!response.ok) throw new Error('Token generation failed');
      const { token } = await response.json();

      if (ZegoExpressEngine) {
        console.log('[CallStore] Starting Zego Engine for Caller...');
        await ZegoExpressEngine.createEngineWithProfile({
          appID: ZEGO_APP_ID,
          scenario: 0
        });

        // Register event listeners
        const engine = ZegoExpressEngine.instance();
        engine.on('roomStreamUpdate', (roomID, updateType, streamList) => {
            console.log('[Zego] Room Stream Update:', updateType, streamList);
            if (updateType === 0) { // Add
                set({ remoteStreamID: streamList[0].streamID });
                // We will call startPlayingStream in the component or here
            } else { // Delete
                set({ remoteStreamID: null });
            }
        });

        await engine.loginRoom(room_id, { userID: user.id, userName: user.email || 'User' }, { token });
        set({ isEngineInitialized: true });
      }

      setTimeout(async () => {
        const currentCall = get().activeCall;
        if (currentCall && currentCall.id === data.id && currentCall.status === 'ringing') {
          await supabase.from('calls').update({ status: 'missed' }).eq('id', data.id);
          get().reset();
        }
      }, 45000);

    } catch (err) {
      console.error('[CallStore] initCall error:', err);
      Alert.alert('Error', 'Could not start call');
    }
  },

  receiveCall: (call) => {
    console.log('[CallStore] Received call record:', call.id);
    set({ activeCall: call });
  },

  acceptCall: async () => {
    const call = get().activeCall;
    if (!call) return;

    console.log('[CallStore] Accepting call:', call.id);
    try {
      const { error } = await supabase
        .from('calls')
        .update({ status: 'accepted', answered_at: new Date().toISOString() })
        .eq('id', call.id);

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const session = await supabase.auth.getSession();
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-zego-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`
        },
        body: JSON.stringify({ userId: user.id, roomId: call.room_id })
      });

      if (!response.ok) throw new Error('Token generation failed');
      const { token } = await response.json();

      if (ZegoExpressEngine) {
        console.log('[CallStore] Starting Zego Engine for Callee...');
        await ZegoExpressEngine.createEngineWithProfile({
          appID: ZEGO_APP_ID,
          scenario: 0
        });

        const engine = ZegoExpressEngine.instance();
        engine.on('roomStreamUpdate', (roomID, updateType, streamList) => {
            console.log('[Zego] Room Stream Update (Callee):', updateType, streamList);
            if (updateType === 0) {
                set({ remoteStreamID: streamList[0].streamID });
            } else {
                set({ remoteStreamID: null });
            }
        });

        await engine.loginRoom(call.room_id, { userID: user.id, userName: user.email || 'User' }, { token });

        // Callee starts publishing immediately
        console.log('[CallStore] Callee starting publishing...');
        engine.startPublishingStream(call.id);

        set({ isEngineInitialized: true, isJoined: true });
      }
    } catch (err) {
      console.error('[CallStore] acceptCall error:', err);
    }
  },

  declineCall: async () => {
    const call = get().activeCall;
    if (!call) return;

    await supabase.from('calls').update({ status: 'declined' }).eq('id', call.id);
    get().reset();
  },

  endCall: async () => {
    const call = get().activeCall;
    if (!call) return;

    await supabase.from('calls').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', call.id);
    get().reset();
  },

  cancelCall: async () => {
    const call = get().activeCall;
    if (!call) return;

    await supabase.from('calls').update({ status: 'cancelled' }).eq('id', call.id);
    get().reset();
  },

  toggleMute: () => {
    if (!ZegoExpressEngine) return;
    const newState = !get().isMuted;
    ZegoExpressEngine.instance().muteMicrophone(newState);
    set({ isMuted: newState });
  },

  toggleSpeaker: () => {
    if (!ZegoExpressEngine) return;
    const newState = !get().isSpeakerOn;
    ZegoExpressEngine.instance().setAudioRouteToSpeaker(newState);
    set({ isSpeakerOn: newState });
  },

  toggleCamera: () => {
    if (!ZegoExpressEngine) return;
    const newState = !get().isCameraOn;
    ZegoExpressEngine.instance().enableCamera(newState);
    set({ isCameraOn: newState });
  },

  switchCamera: () => {
    if (!ZegoExpressEngine) return;
    const newState = !get().isFrontCamera;
    ZegoExpressEngine.instance().useFrontCamera(newState);
    set({ isFrontCamera: newState });
  },

  reset: async () => {
    const call = get().activeCall;
    if (get().isEngineInitialized && ZegoExpressEngine && call) {
      console.log('[CallStore] Destroying Zego Engine...');
      await ZegoExpressEngine.instance().logoutRoom(call.room_id);
      await ZegoExpressEngine.destroyEngine();
    }
    set({
      activeCall: null,
      isEngineInitialized: false,
      isJoined: false,
      isMuted: false,
      isSpeakerOn: true,
      isCameraOn: true,
      isFrontCamera: true,
      remoteStreamID: null
    });
  }
}));

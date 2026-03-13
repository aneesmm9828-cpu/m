import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';

export default function OTPScreen() {
  const router = useRouter();
  const { user_id, type } = useLocalSearchParams();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputs = useRef<TextInput[]>([]);

  useEffect(() => {
    const interval = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (val: string, idx: number) => {
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) { Alert.alert('Error', 'Enter complete OTP'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { user_id, otp: code });
      if (type === 'reset') {
        router.replace({ pathname: '/auth/forgot-password', params: { step: '3', user_id, reset_token: res.data.reset_token } });
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.content}>
          <View style={styles.iconBox}>
            <Ionicons name="mail" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code sent to your email</Text>
          <View style={styles.otpRow}>
            {otp.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={r => { if (r) inputs.current[idx] = r; }}
                style={[styles.otpInput, digit && styles.otpFilled]}
                value={digit}
                onChangeText={v => handleChange(v.slice(-1), idx)}
                onKeyPress={e => handleKeyPress(e, idx)}
                keyboardType="number-pad"
                maxLength={1}
                data-testid={`otp-input-${idx}`}
              />
            ))}
          </View>
          <TouchableOpacity
            style={styles.verifyBtn}
            onPress={handleVerify}
            disabled={loading}
            data-testid="verify-otp-button"
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyText}>Verify OTP</Text>}
          </TouchableOpacity>
          {timer > 0 ? (
            <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
          ) : (
            <TouchableOpacity onPress={() => setTimer(60)}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  back: { padding: 16 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 32, paddingTop: 40 },
  iconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.cardBackground, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 40 },
  otpRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  otpInput: { width: 48, height: 56, borderRadius: 12, backgroundColor: Colors.cardBackground, borderWidth: 1, borderColor: Colors.border, fontSize: 24, fontWeight: 'bold', color: Colors.text, textAlign: 'center' },
  otpFilled: { borderColor: Colors.primary },
  verifyBtn: { width: '100%', backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  verifyText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  timerText: { fontSize: 14, color: Colors.textSecondary },
  resendText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
});

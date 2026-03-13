import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [step, setStep] = useState(Number(params.step) || 1);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [userId, setUserId] = useState(params.user_id as string || '');
  const [resetToken, setResetToken] = useState(params.reset_token as string || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleStep1 = async () => {
    if (!emailOrUsername.trim()) { Alert.alert('Error', 'Enter email or username'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email_or_username: emailOrUsername });
      setUserId(res.data.user_id || '');
      setStep(2);
      router.push({ pathname: '/auth/otp', params: { user_id: res.data.user_id, type: 'reset' } });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const handleStep3 = async () => {
    if (!newPassword || newPassword.length < 6) { Alert.alert('Error', 'Password min 6 characters'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { user_id: userId, reset_token: resetToken, new_password: newPassword });
      Alert.alert('Success', 'Password reset successfully!', [{ text: 'Login', onPress: () => router.replace('/auth/login') }]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Reset failed');
    } finally { setLoading(false); }
  };

  const renderStep = () => {
    if (step === 3 || params.step === '3') {
      return (
        <View style={styles.stepBox}>
          <View style={styles.iconBox}>
            <Ionicons name="lock-closed" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.title}>New Password</Text>
          <Text style={styles.subtitle}>Create a strong new password</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor={Colors.textSecondary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPass}
              data-testid="new-password-input"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? 'eye' : 'eye-off'} size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor={Colors.textSecondary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPass}
            data-testid="confirm-password-input"
          />
          <TouchableOpacity style={styles.btn} onPress={handleStep3} disabled={loading} data-testid="reset-password-button">
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Reset Password</Text>}
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.stepBox}>
        <View style={styles.iconBox}>
          <Ionicons name="key" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>Enter your email or username to receive an OTP</Text>
        <TextInput
          style={styles.input}
          placeholder="Email or Username"
          placeholderTextColor={Colors.textSecondary}
          value={emailOrUsername}
          onChangeText={setEmailOrUsername}
          autoCapitalize="none"
          data-testid="email-username-input"
        />
        <TouchableOpacity style={styles.btn} onPress={handleStep1} disabled={loading} data-testid="send-otp-button">
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send OTP</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32 },
  stepBox: { alignItems: 'center', paddingVertical: 40 },
  iconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.cardBackground, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 32 },
  input: { width: '100%', backgroundColor: Colors.cardBackground, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Colors.text, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  inputWrap: { width: '100%', position: 'relative', marginBottom: 16 },
  eyeBtn: { position: 'absolute', right: 16, top: 14 },
  btn: { width: '100%', backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  btnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  backText: { fontSize: 14, color: Colors.textSecondary },
});

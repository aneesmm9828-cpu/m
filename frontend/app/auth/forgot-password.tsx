import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          'Email Sent',
          'If an account exists for ' + email + ', you will receive a password reset link.',
          [{ text: 'OK', onPress: () => router.push({ pathname: '/auth/otp', params: { email } }) }]
        );
      }, 1500);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={Colors.text} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.iconContainer}>
          <View style={styles.lockCircle}>
            <Ionicons name="lock-closed-outline" size={60} color={Colors.text} />
          </View>
        </View>

        <Text style={styles.title}>Trouble logging in?</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a code to get back into your account.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.resetButton, loading && styles.disabledButton]}
          onPress={handleReset}
          disabled={loading}
        >
          <Text style={styles.resetButtonText}>
            {loading ? 'Sending...' : 'Send Login Link'}
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity onPress={() => router.push('/auth/signup')}>
          <Text style={styles.createAccountText}>Create New Account</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      <TouchableOpacity
        style={styles.footer}
        onPress={() => router.push('/auth/login')}
      >
        <Text style={styles.footerText}>Back to Login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.background,
  },
  backButton: {
    padding: 16,
  },
  content: {
    flex: 1, paddingHorizontal: 30, alignItems: 'center', paddingTop: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  lockCircle: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: Colors.text, justifyContent: 'center', alignItems: 'center',
  },
  title: {
    fontSize: 24, fontWeight: 'bold', color: Colors.text, marginBottom: 12, textAlign: 'center',
  },
  subtitle: {
    fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 20,
  },
  inputContainer: {
    width: '100%', marginBottom: 20,
  },
  input: {
    backgroundColor: Colors.cardBackground, height: 50, borderRadius: 8, paddingHorizontal: 16, color: Colors.text, borderWidth: 1, borderColor: Colors.border,
  },
  resetButton: {
    backgroundColor: Colors.primary, width: '100%', height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: Colors.background, fontSize: 16, fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 24,
  },
  divider: {
    flex: 1, height: 1, backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textSecondary, paddingHorizontal: 16, fontWeight: 'bold',
  },
  createAccountText: {
    color: Colors.text, fontSize: 14, fontWeight: 'bold',
  },
  footer: {
    paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'center',
  },
  footerText: {
    color: Colors.text, fontSize: 14, fontWeight: 'bold',
  },
});

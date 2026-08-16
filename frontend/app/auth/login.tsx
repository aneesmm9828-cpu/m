import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { TouchTarget, Spacing } from '../../constants/layout';
import { supabase } from '../../utils/supabaseConfig';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { setIsAuthenticated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (!supabase) {
        Alert.alert('Error', 'Supabase is not initialized');
        return;
    }

    setLoading(true);
    try {
      console.log('Attempting login for:', email.toLowerCase().trim());
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (error) {
        console.error('Login error from Supabase:', error.message);
        throw error;
      }

      console.log('Login successful, Session:', !!data.session);

      if (data.session) {
        setIsAuthenticated(true);
        // Add a small delay to allow store update if needed
        setTimeout(() => {
          router.replace('/(tabs)/home');
        }, 100);
      } else {
        throw new Error('No session created');
      }

    } catch (error: any) {
      console.error('Login failed', error);
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    if (!supabase) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'frontend://home', // Replace with your deep link scheme
        },
      });

      if (error) throw error;
      // In native apps, this usually opens a browser
    } catch (error: any) {
      console.error(`${provider} login failed`, error);
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const goToSignup = () => {
    router.push('/auth/signup');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[Colors.background, Colors.cardBackground]}
            style={styles.gradient}
          >
            {/* Logo */}
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <Image
                source={require('../../assets/images/marb-logo.jpg')}
                style={{ width: 100, height: 100, borderRadius: 25, marginBottom: Spacing.lg }}
                resizeMode="contain"
              />
              <Text style={styles.appName}>MARB</Text>
              <Text style={styles.tagline}>Create · Share · Go Viral</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.title}>Log in</Text>

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.background} />
                  ) : (
                    <Text style={styles.buttonText}>Log in</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtonsRow}>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin('google')}
                  disabled={loading}
                >
                  <Ionicons name="logo-google" size={24} color="#EA4335" />
                  <Text style={styles.socialButtonText}>Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin('facebook')}
                  disabled={loading}
                >
                  <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                  <Text style={styles.socialButtonText}>Facebook</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account?</Text>
              <TouchableOpacity onPress={goToSignup} style={styles.signupTouchable}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    fontSize: 16,
    color: Colors.text,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: TouchTarget.minSize,
  },
  loginButton: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    minHeight: TouchTarget.comfortable,
  },
  buttonGradient: {
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TouchTarget.comfortable,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.background,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textSecondary,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  socialButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  signupTouchable: {
    minHeight: TouchTarget.minSize,
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  signupText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  signupLink: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
});

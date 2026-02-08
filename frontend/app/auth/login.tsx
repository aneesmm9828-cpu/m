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
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { TouchTarget, Spacing } from '../../constants/layout';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser, setIsAuthenticated } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        username: username.toLowerCase(),
        password,
      });

      if (response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Invalid username or password');
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
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/marb-logo.jpg')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>MARB</Text>
              <Text style={styles.tagline}>Create · Share · Go Viral</Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <Text style={styles.title}>Log in</Text>

              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={Colors.textSecondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
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
                  colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
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

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account?</Text>
                <TouchableOpacity onPress={goToSignup} style={styles.signupTouchable}>
                  <Text style={styles.signupLink}>Sign up</Text>
                </TouchableOpacity>
              </View>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 25,
    marginBottom: Spacing.lg,
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
    marginBottom: Spacing.xl,
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
    marginBottom: Spacing.xl,
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

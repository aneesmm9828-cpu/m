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
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={[Colors.background, Colors.cardBackground]}
        style={styles.gradient}
      >
        <View style={styles.content}>
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
              <TouchableOpacity onPress={goToSignup}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 30,
    marginBottom: 16,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  buttonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
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
    gap: 8,
  },
  signupText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});

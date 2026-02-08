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
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

export default function SignupScreen() {
  const router = useRouter();
  const { setUser, setIsAuthenticated } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !username || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/signup', {
        name,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password,
      });

      if (response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        router.replace('/(tabs)/home');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      const message = error.response?.data?.detail || 'Signup failed. Try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/marb-logo.jpg')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Signup Form */}
            <View style={styles.formContainer}>
              <Text style={styles.title}>Sign up</Text>

              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={Colors.textSecondary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

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
                placeholder="Username"
                placeholderTextColor={Colors.textSecondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                style={styles.input}
                placeholder="Password (min 6 characters)"
                placeholderTextColor={Colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={styles.signupButton}
                onPress={handleSignup}
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
                    <Text style={styles.buttonText}>Sign up</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 25,
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
  signupButton: {
    marginTop: 8,
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
});

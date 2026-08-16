import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../utils/supabaseConfig';
import { ensureUserProfile, uploadMedia } from '../../utils/supabaseHelpers';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

enum SignupStep {
  USERNAME = 1,
  PASSWORD = 2,
  DOB = 3,
  EMAIL = 4,
  PROFILE = 5,
  WELCOME = 6,
}

export default function SignupFlow() {
  const router = useRouter();
  const { setIsAuthenticated } = useAuthStore();
  const [step, setStep] = useState<SignupStep>(SignupStep.USERNAME);
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [dob, setDob] = useState({ day: '01', month: 'Jan', year: '2000' });
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [picture, setPicture] = useState<string | null>(null);

  const progressWidth = useAnimatedStyle(() => ({
    width: withTiming(`${(step / 6) * 100}%`, { duration: 500 }),
  }));

  const handleNext = async () => {
    if (step === SignupStep.USERNAME) {
      if (username.length < 3) {
        Alert.alert('Error', 'Username must be at least 3 characters');
        return;
      }
      setStep(SignupStep.PASSWORD);
    } else if (step === SignupStep.PASSWORD) {
      if (password.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        return;
      }
      setPasswordError('');
      setStep(SignupStep.DOB);
    } else if (step === SignupStep.DOB) {
      setStep(SignupStep.EMAIL);
    } else if (step === SignupStep.EMAIL) {
      if (!email.includes('@')) {
        Alert.alert('Error', 'Please enter a valid email');
        return;
      }
      setStep(SignupStep.PROFILE);
    } else if (step === SignupStep.PROFILE) {
      if (!fullName.trim()) {
        Alert.alert('Error', 'Please enter your full name');
        return;
      }
      handleFinalSignup();
    }
  };

  const handleFinalSignup = async () => {
    if (!supabase) {
      Alert.alert('Error', 'Supabase not initialized');
      return;
    }
    setLoading(true);
    try {
      // 1. Supabase Auth Signup
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (authError) throw authError;
      if (!data.user) throw new Error('Signup failed');

      // 2. Upload Profile Picture
      let profilePicUrl = '';
      if (picture) {
        try {
          profilePicUrl = await uploadMedia('media', `profiles/${data.user.id}/profile.jpg`, picture);
        } catch (uploadErr) {
          console.warn('Upload failed', uploadErr);
        }
      }

      // 3. Create Profile Document
      try {
        await ensureUserProfile(data.user.id, {
          username,
          name: fullName.trim(),
          picture: profilePicUrl,
        });
      } catch (profileErr) {
        console.warn('Profile creation failed but auth succeeded', profileErr);
      }

      setStep(SignupStep.WELCOME);

      // Auto-confirm logic for development (optional but helpful)
      if (!data.user.confirmed_at) {
        Alert.alert(
          'Email Confirmation',
          'A confirmation email has been sent. Please check your inbox to activate your account.',
          [{ text: 'OK' }]
        );
      }
    } catch (e: any) {
      console.error('Signup failed', e);
      Alert.alert('Signup Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignup = async (provider: 'google' | 'facebook') => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'frontend://home',
        },
      });
      if (error) throw error;
    } catch (e: any) {
      console.error(`${provider} signup failed`, e);
      Alert.alert('Signup Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPicture(result.assets[0].base64 || null);
    }
  };

  const renderProgress = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBg}>
        <Animated.View style={[styles.progressFill, progressWidth]} />
      </View>
      <Text style={styles.stepText}>Step {Math.min(step, 5)} of 5</Text>
    </View>
  );

  const renderUsername = () => (
    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContent}>
      <Text style={styles.heading}>Choose a unique username</Text>
      <View style={styles.inputWrapper}>
        <Text style={styles.atIcon}>@</Text>
        <TextInput
          style={styles.input}
          placeholder="username"
          placeholderTextColor="#777"
          value={username}
          onChangeText={v => setUsername(v.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
          autoFocus
          autoCapitalize="none"
        />
      </View>

      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialButtonsRow}>
        <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialSignup('google')} disabled={loading}>
          <Ionicons name="logo-google" size={20} color="#EA4335" />
          <Text style={styles.socialButtonText}>Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialSignup('facebook')} disabled={loading}>
          <Ionicons name="logo-facebook" size={20} color="#1877F2" />
          <Text style={styles.socialButtonText}>Facebook</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // Other render functions remain same...
  const renderPassword = () => (
    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContent}>
      <Text style={styles.heading}>Create a strong password</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#777"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          autoFocus
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#777" />
        </TouchableOpacity>
      </View>
      {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
    </Animated.View>
  );

  const renderDOB = () => (
    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContent}>
      <Text style={styles.heading}>When's your birthday?</Text>
      <View style={styles.dobPickerContainer}>
        <DOBWheel value={dob.day} label="Day" onChange={(d: string) => setDob({...dob, day: d})} range={Array.from({length: 31}, (_, i) => (i+1).toString().padStart(2, '0'))} />
        <DOBWheel value={dob.month} label="Month" onChange={(m: string) => setDob({...dob, month: m})} range={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']} />
        <DOBWheel value={dob.year} label="Year" onChange={(y: string) => setDob({...dob, year: y})} range={Array.from({length: 80}, (_, i) => (2024-i).toString())} />
      </View>
    </Animated.View>
  );

  const renderEmail = () => (
    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContent}>
      <Text style={styles.heading}>Add your email</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#777"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoFocus
        />
      </View>
    </Animated.View>
  );

  const renderProfile = () => (
    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContent}>
      <Text style={styles.heading}>Set up your profile</Text>
      <TouchableOpacity onPress={pickImage} style={styles.dpContainer}>
        {picture ? (
          <Image source={{ uri: `data:image/jpeg;base64,${picture}` }} style={styles.dp} />
        ) : (
          <View style={styles.dpPlaceholder}>
            <Ionicons name="person" size={60} color="#444" />
          </View>
        )}
      </TouchableOpacity>
      <TextInput
        style={styles.profileInput}
        placeholder="Full Name"
        placeholderTextColor="#777"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={[styles.profileInput, { height: 100, textAlignVertical: 'top' }]}
        placeholder="Bio"
        placeholderTextColor="#777"
        multiline
        value={bio}
        onChangeText={setBio}
      />
    </Animated.View>
  );

  const renderWelcome = () => (
    <View style={styles.welcomeContainer}>
      <Text style={styles.welcomeHeading}>Welcome to MARB!</Text>
      <TouchableOpacity style={styles.followAllBtn} onPress={() => {
        setIsAuthenticated(true);
        router.replace('/(tabs)/home');
      }}>
        <LinearGradient colors={['#00d9ff', '#00ffcc']} style={styles.gradientBtn}>
          <Text style={styles.btnText}>Get Started</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          {step < SignupStep.WELCOME && renderProgress()}
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {step === SignupStep.USERNAME && renderUsername()}
          {step === SignupStep.PASSWORD && renderPassword()}
          {step === SignupStep.DOB && renderDOB()}
          {step === SignupStep.EMAIL && renderEmail()}
          {step === SignupStep.PROFILE && renderProfile()}
          {step === SignupStep.WELCOME && renderWelcome()}
        </ScrollView>

        {step < SignupStep.WELCOME && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              disabled={loading}
            >
              <LinearGradient colors={['#00d9ff', '#00ffcc']} style={styles.gradientBtn}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>{step === SignupStep.PROFILE ? 'Finish' : 'Next'}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const DOBWheel = ({ value, label, onChange, range }: any) => (
  <View style={styles.wheel}>
    <Text style={styles.wheelLabel}>{label}</Text>
    <ScrollView style={styles.wheelScroll} showsVerticalScrollIndicator={false}>
      {range.map((r: string) => (
        <TouchableOpacity key={r} onPress={() => onChange(r)}>
          <Text style={[styles.wheelItem, value === r && styles.wheelItemSelected]}>{r}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topNav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, height: 60 },
  progressContainer: { flex: 1, marginLeft: 20, justifyContent: 'center' },
  progressBg: { height: 4, backgroundColor: '#222', borderRadius: 2, width: '80%', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#00d9ff' },
  stepText: { color: '#777', fontSize: 10, marginTop: 4, fontWeight: '600' },
  stepContent: { flex: 1, paddingHorizontal: 30, paddingTop: 40 },
  heading: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 16, paddingHorizontal: 16, height: 64, borderWidth: 1, borderColor: '#222' },
  input: { flex: 1, fontSize: 18, color: '#fff', paddingHorizontal: 10 },
  atIcon: { fontSize: 18, color: '#777', fontWeight: '600' },
  errorText: { color: '#ff3b5c', fontSize: 12, marginTop: 8 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#222' },
  dividerText: { color: '#777', paddingHorizontal: 10, fontSize: 14, fontWeight: '600' },
  socialButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  socialButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', borderRadius: 12, height: 50, borderWidth: 1, borderColor: '#222', gap: 10 },
  socialButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  dobPickerContainer: { flexDirection: 'row', justifyContent: 'space-between', height: 200 },
  wheel: { flex: 1, alignItems: 'center' },
  wheelLabel: { color: '#777', fontSize: 12, marginBottom: 10 },
  wheelScroll: { width: '100%' },
  wheelItem: { color: '#444', fontSize: 18, textAlign: 'center', paddingVertical: 10 },
  wheelItemSelected: { color: '#00d9ff', fontWeight: 'bold', fontSize: 22 },
  dpContainer: { alignSelf: 'center', width: 120, height: 120, marginBottom: 40 },
  dp: { width: 120, height: 120, borderRadius: 60 },
  dpPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  profileInput: { backgroundColor: '#111', borderRadius: 12, paddingHorizontal: 16, height: 56, fontSize: 16, color: '#fff', borderWidth: 1, borderColor: '#222', marginBottom: 16 },
  footer: { padding: 24 },
  nextButton: { height: 56, borderRadius: 28, overflow: 'hidden' },
  gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  welcomeContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  welcomeHeading: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  followAllBtn: { width: '100%', height: 56, borderRadius: 28, overflow: 'hidden' },
});

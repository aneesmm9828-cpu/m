import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function GoLiveScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('Public');
  const [activeMode, setActiveTab] = useState('Live');

  const modes = ['Post', 'Story', 'Reels', 'Live'];

  return (
    <View style={styles.container}>
      {/* Camera Preview Mock (Black Background) */}
      <View style={styles.cameraPreview}>
        <View style={styles.cameraOverlay}>
          <Text style={styles.mockCameraText}>Live Camera Preview</Text>
        </View>
      </View>

      {/* Top Controls */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={32} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live</Text>
        <TouchableOpacity style={styles.topIcon}>
          <Ionicons name="refresh-outline" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.rightTopIcons}>
        <TouchableOpacity style={styles.sideIcon}>
          <Ionicons name="sparkles-outline" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sideIcon}>
          <Ionicons name="flash-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Bottom Setup Panel */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.setupPanelContainer}
      >
        <BlurView intensity={40} tint="dark" style={styles.setupPanel}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <View style={styles.titleSection}>
              <TextInput
                style={styles.titleInput}
                placeholder="Add a title..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={title}
                onChangeText={v => v.length <= 100 && setTitle(v)}
                multiline
              />
              <Text style={styles.charCount}>{title.length}/100</Text>
            </View>

            {/* Audience Selector */}
            <View style={styles.audienceRow}>
              <TouchableOpacity
                style={[styles.audienceBtn, audience === 'Public' && styles.activeAudience]}
                onPress={() => setAudience('Public')}
              >
                <Ionicons name="globe-outline" size={20} color={audience === 'Public' ? '#00D9FF' : '#FFF'} />
                <Text style={[styles.audienceText, audience === 'Public' && styles.activeAudienceText]}>Public</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.audienceBtn, audience === 'Friends' && styles.activeAudience]}
                onPress={() => setAudience('Friends')}
              >
                <Ionicons name="people-outline" size={20} color={audience === 'Friends' ? '#00D9FF' : '#FFF'} />
                <Text style={[styles.audienceText, audience === 'Friends' && styles.activeAudienceText]}>Friends</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.audienceBtn, audience === 'Practice' && styles.activeAudience]}
                onPress={() => setAudience('Practice')}
              >
                <Ionicons name="eye-off-outline" size={20} color={audience === 'Practice' ? '#00D9FF' : '#FFF'} />
                <Text style={[styles.audienceText, audience === 'Practice' && styles.activeAudienceText]}>Practice</Text>
              </TouchableOpacity>
            </View>

            {/* Functional Options */}
            <View style={styles.optionsList}>
              <TouchableOpacity style={styles.optionItem}>
                <Ionicons name="heart-outline" size={22} color="#FFF" />
                <Text style={styles.optionText}>Add fundraiser</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionItem}>
                <Ionicons name="time-outline" size={22} color="#FFF" />
                <Text style={styles.optionText}>Schedule Live</Text>
              </TouchableOpacity>
              <View style={styles.optionItem}>
                <Ionicons name="help-circle-outline" size={22} color="#FFF" />
                <Text style={styles.optionText}>Q&A Session</Text>
                <View style={styles.toggleMock} />
              </View>
              <TouchableOpacity style={styles.optionItem}>
                <Ionicons name="bag-outline" size={22} color="#FFF" />
                <Text style={styles.optionText}>Shopping tags</Text>
              </TouchableOpacity>
            </View>

            {/* Prediction */}
            <Text style={styles.predictionText}>Est. 200+ viewers</Text>

            {/* Go Live Button */}
            <TouchableOpacity style={styles.goLiveContainer} activeOpacity={0.8}>
              <LinearGradient
                colors={['#FF3B5C', '#00D9FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.goLiveBtn}
              >
                <Text style={styles.goLiveText}>Go Live</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </BlurView>
      </KeyboardAvoidingView>

      {/* Mode Selector */}
      <View style={styles.modeContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeScroll}>
          {modes.map(mode => (
            <TouchableOpacity
              key={mode}
              onPress={() => setActiveTab(mode)}
              style={styles.modeTab}
            >
              <Text style={[styles.modeText, activeMode === mode && styles.activeModeText]}>{mode}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraPreview: { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  cameraOverlay: { opacity: 0.5 },
  mockCameraText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  topBar: { position: 'absolute', top: 50, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  closeBtn: { padding: 4 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  topIcon: { padding: 4 },
  rightTopIcons: { position: 'absolute', top: 100, right: 20, gap: 20 },
  sideIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  setupPanelContainer: { position: 'absolute', bottom: 100, left: 0, right: 0 },
  setupPanel: { marginHorizontal: 20, borderRadius: 24, padding: 20, overflow: 'hidden' },
  titleSection: { marginBottom: 20 },
  titleInput: { fontSize: 20, color: '#FFF', fontWeight: 'bold', minHeight: 60 },
  charCount: { color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'right', marginTop: 4 },
  audienceRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  audienceBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 10, borderRadius: 12 },
  activeAudience: { backgroundColor: 'rgba(0, 217, 255, 0.2)', borderWidth: 1, borderColor: '#00D9FF' },
  audienceText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  activeAudienceText: { color: '#00D9FF' },
  optionsList: { gap: 16, marginBottom: 20 },
  optionItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionText: { color: '#FFF', fontSize: 15, flex: 1 },
  toggleMock: { width: 36, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)' },
  predictionText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', marginBottom: 20 },
  goLiveContainer: { marginBottom: 10 },
  goLiveBtn: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF3B5C', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 15 },
  goLiveText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  modeContainer: { position: 'absolute', bottom: 30, left: 0, right: 0, height: 50 },
  modeScroll: { paddingHorizontal: width / 2 - 40, gap: 30, alignItems: 'center' },
  modeTab: { paddingVertical: 10 },
  modeText: { color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: 'bold' },
  activeModeText: { color: '#FFF' },
});

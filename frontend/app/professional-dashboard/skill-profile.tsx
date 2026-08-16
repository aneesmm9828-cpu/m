import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { useSkillStore } from '../../store/skillStore';

const { width } = Dimensions.get('window');

export default function SkillProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { skillProfile, isLoading, fetchSkillProfile, updateSkillProfile, gigs, fetchGigs } = useSkillStore();

  useEffect(() => {
    if (user?.id) {
      fetchSkillProfile(user.id);
      fetchGigs(); // In a real app, we'd filter for the user's gigs
    }
  }, [user?.id]);

  const handleBecomeSeller = async () => {
    if (user?.id) {
      await updateSkillProfile(user.id, {
        is_active: true,
        bio: 'Welcome to my skills profile!',
        categories: [],
        skills: [],
      });
    }
  };

  if (isLoading && !skillProfile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!skillProfile || !skillProfile.is_active) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Professional Mode</Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={styles.onboardingContent}>
          <Ionicons name="briefcase-outline" size={100} color={Colors.primary} />
          <Text style={styles.onboardingTitle}>Monetize Your Skills</Text>
          <Text style={styles.onboardingText}>
            Join the MARB Skill Market to reach local clients in Odisha and beyond. Set your own rates, manage bookings, and get paid securely.
          </Text>
          <TouchableOpacity style={styles.onboardingBtn} onPress={handleBecomeSeller}>
            <Text style={styles.onboardingBtnText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Skills Profile</Text>
        <View style={styles.headerRight}>
           <TouchableOpacity onPress={() => router.push('/skill-market/seller/edit-profile')}><Ionicons name="pencil-outline" size={24} color={Colors.text} /></TouchableOpacity>
           <TouchableOpacity><Ionicons name="share-social-outline" size={24} color={Colors.text} /></TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileBox}>
          <Image source={{ uri: user?.profilePicUrl || 'https://via.placeholder.com/150' }} style={styles.avatar} />
          <Text style={styles.name}>{user?.name || 'Skill Seller'}</Text>
          <Text style={styles.title}>{skillProfile.bio || 'New Professional'}</Text>
          <View style={styles.ratingRow}>
             <Text style={styles.rating}>{skillProfile.rating_avg} ⭐ ({skillProfile.review_count} reviews)</Text>
             {skillProfile.is_verified && (
               <View style={styles.goldBadge}><Text style={styles.goldText}>VERIFIED</Text></View>
             )}
          </View>
          <Text style={styles.response}>Replies within 2 hrs</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MY GIGS</Text>
          <TouchableOpacity onPress={() => router.push('/skill-market/seller/create-gig')}>
            <Text style={styles.addLink}>+ New Gig</Text>
          </TouchableOpacity>
        </View>

        {gigs.length === 0 ? (
          <View style={styles.emptyGigs}>
            <Text style={styles.emptyText}>You haven't created any gigs yet.</Text>
          </View>
        ) : (
          gigs.map((gig, i) => (
            <TouchableOpacity key={i} style={styles.skillCard} onPress={() => router.push(`/skill-market/gigs/${gig.id}`)}>
               <View style={styles.skillHeader}>
                  <Text style={styles.skillName}>{gig.title}</Text>
                  <View style={styles.catBadge}><Text style={styles.catText}>{gig.category}</Text></View>
               </View>
               <View style={styles.skillStats}>
                  <View>
                     <Text style={styles.statLab}>Starting From</Text>
                     <Text style={styles.statValTeal}>₹{gig.price_basic}</Text>
                  </View>
                  <View>
                     <Text style={styles.statLab}>Delivery</Text>
                     <Text style={styles.statVal}>{gig.delivery_days_basic} days</Text>
                  </View>
                  <View>
                     <Text style={styles.statLab}>Status</Text>
                     <Text style={[styles.statVal, { color: gig.status === 'active' ? Colors.success : Colors.error }]}>
                       {gig.status.toUpperCase()}
                     </Text>
                  </View>
               </View>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>PORTFOLIO</Text>
           <TouchableOpacity><Text style={styles.addLink}>Add Work</Text></TouchableOpacity>
        </View>
        <View style={styles.portfolioGrid}>
           {[1, 2, 3, 4].map(i => (
             <View key={i} style={styles.portfolioItem}>
                <View style={styles.portfolioThumb} />
                <Text style={styles.portfolioTitle}>Project {i}</Text>
             </View>
           ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  headerRight: { flexDirection: 'row', gap: 16 },
  content: { flex: 1 },
  onboardingContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  onboardingTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginTop: 24, marginBottom: 16 },
  onboardingText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  onboardingBtn: { backgroundColor: Colors.primary, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 30 },
  onboardingBtnText: { color: Colors.background, fontSize: 18, fontWeight: 'bold' },
  profileBox: { alignItems: 'center', padding: 24, backgroundColor: Colors.surface, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 16, borderWidth: 3, borderColor: Colors.primary },
  name: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  title: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  rating: { fontSize: 14, fontWeight: '600', color: Colors.text },
  goldBadge: { backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  goldText: { fontSize: 9, fontWeight: 'bold', color: Colors.background },
  response: { fontSize: 12, color: Colors.success, marginTop: 8, fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.textSecondary, marginLeft: 16, marginTop: 24, marginBottom: 12, letterSpacing: 1 },
  addLink: { color: Colors.primary, fontSize: 14, fontWeight: '600', marginTop: 12 },
  skillCard: { backgroundColor: Colors.surface, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12 },
  skillHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  skillName: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  catBadge: { backgroundColor: Colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  catText: { fontSize: 11, color: Colors.textSecondary },
  skillStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statLab: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4 },
  statVal: { fontSize: 14, fontWeight: '600', color: Colors.text },
  statValTeal: { fontSize: 14, fontWeight: 'bold', color: Colors.primary },
  emptyGigs: { padding: 40, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  portfolioItem: { width: (width - 48) / 2, margin: 8 },
  portfolioThumb: { width: '100%', height: 120, backgroundColor: Colors.surface, borderRadius: 12 },
  portfolioTitle: { fontSize: 13, color: Colors.text, marginTop: 8, fontWeight: '500' },
});


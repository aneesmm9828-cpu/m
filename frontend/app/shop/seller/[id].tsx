import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const TABS = ['Products', 'Reviews', 'About', 'Offers'];

export default function SellerStoreScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('Products');

  const renderProductItem = ({ item }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.productImg} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>Summer Hoodie</Text>
        <Text style={styles.productPrice}>₹1,499</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Store Banner */}
        <View style={styles.bannerContainer}>
          <LinearGradient colors={['#00D9FF', '#8A2BE2']} style={styles.banner} />
          <View style={styles.logoOverlay}>
            <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.storeLogo} />
          </View>
        </View>

        <View style={styles.storeHeader}>
          <Text style={styles.storeName}>Urban Wear Official <Ionicons name="checkmark-circle" size={18} color="#00D9FF" /></Text>
          <Text style={styles.categoryTag}>Fashion & Clothing</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}><Text style={styles.statNum}>12K</Text><Text style={styles.statLabel}>Followers</Text></View>
            <View style={styles.statItem}><Text style={styles.statNum}>240</Text><Text style={styles.statLabel}>Products</Text></View>
            <View style={styles.statItem}><Text style={styles.statNum}>15K+</Text><Text style={styles.statLabel}>Sales</Text></View>
            <View style={styles.statItem}><Text style={styles.statNum}>4.9★</Text><Text style={styles.statLabel}>Rating</Text></View>
          </View>

          <View style={styles.actionRow}>
             <TouchableOpacity style={styles.followBtn}><Text style={styles.followBtnText}>Follow Store</Text></TouchableOpacity>
             <TouchableOpacity style={styles.shareBtn}><Ionicons name="share-social-outline" size={20} color="#000" /></TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {activeTab === 'Products' && (
          <View style={styles.productsGrid}>
             <FlatList
               data={[1,2,3,4,5,6]}
               renderItem={renderProductItem}
               keyExtractor={i => i.toString()}
               numColumns={2}
               scrollEnabled={false}
               columnWrapperStyle={styles.gridRow}
             />
          </View>
        )}

        {activeTab === 'Reviews' && (
          <View style={styles.reviewsTab}>
             <Text style={styles.ratingLarge}>4.9</Text>
             <Text style={styles.ratingSubtitle}>Based on 2,405 reviews</Text>
             {/* Simple star breakdown mock */}
             {[5,4,3,2,1].map(s => (
               <View key={s} style={styles.starBarRow}>
                  <Text style={styles.starLabelText}>{s}★</Text>
                  <View style={styles.barBg}><View style={[styles.barFill, { width: s > 3 ? '80%' : '10%' }]} /></View>
               </View>
             ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.stickyBottom}>
         <TouchableOpacity style={styles.bottomFollowBtn}><Text style={styles.bottomFollowText}>Follow</Text></TouchableOpacity>
         <TouchableOpacity style={styles.messageBtn}><Text style={styles.messageBtnText}>Message Seller</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  bannerContainer: { height: 150, position: 'relative', marginBottom: 50 },
  banner: { height: 150 },
  logoOverlay: { position: 'absolute', bottom: -40, alignSelf: 'center', width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFF', padding: 3, elevation: 5 },
  storeLogo: { width: '100%', height: '100%', borderRadius: 43 },
  storeHeader: { alignItems: 'center', paddingHorizontal: 20 },
  storeName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  categoryTag: { color: '#777', fontSize: 13, marginBottom: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 24 },
  statItem: { alignItems: 'center' },
  statNum: { fontWeight: 'bold', fontSize: 16 },
  statLabel: { fontSize: 12, color: '#777', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  followBtn: { flex: 1, height: 40, backgroundColor: '#00D9FF', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  followBtnText: { color: '#FFF', fontWeight: 'bold' },
  shareBtn: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#EEE', justifyContent: 'center', alignItems: 'center' },
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', marginTop: 20 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#00D9FF' },
  tabText: { fontSize: 14, color: '#777', fontWeight: '600' },
  activeTabText: { color: '#00D9FF' },
  productsGrid: { padding: 16 },
  gridRow: { justifyContent: 'space-between', marginBottom: 16 },
  productCard: { width: (width - 48) / 2, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#EEE' },
  productImg: { width: '100%', height: 150, backgroundColor: '#F9F9F9' },
  productInfo: { padding: 10, position: 'relative' },
  productName: { fontSize: 13, fontWeight: '600' },
  productPrice: { fontSize: 14, fontWeight: 'bold', color: '#00D9FF', marginTop: 4 },
  addBtn: { position: 'absolute', bottom: 10, right: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: '#00D9FF', justifyContent: 'center', alignItems: 'center' },
  reviewsTab: { padding: 20, alignItems: 'center' },
  ratingLarge: { fontSize: 48, fontWeight: 'bold', color: '#00D9FF' },
  ratingSubtitle: { color: '#777', fontSize: 14, marginBottom: 20 },
  starBarRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, width: '80%' },
  starLabelText: { fontSize: 12, color: '#777', width: 20 },
  barBg: { flex: 1, height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#00D9FF' },
  stickyBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0', padding: 16, flexDirection: 'row', gap: 12, paddingBottom: 30 },
  bottomFollowBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#00D9FF', justifyContent: 'center', alignItems: 'center' },
  bottomFollowText: { color: '#00D9FF', fontWeight: 'bold' },
  messageBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: '#00D9FF', justifyContent: 'center', alignItems: 'center' },
  messageBtnText: { color: '#FFF', fontWeight: 'bold' },
});

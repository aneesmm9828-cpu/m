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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: '1', name: 'All', icon: 'apps-outline' },
  { id: '2', name: 'Fashion', icon: 'shirt-outline' },
  { id: '3', name: 'Beauty', icon: 'color-palette-outline' },
  { id: '4', name: 'Electronics', icon: 'phone-portrait-outline' },
  { id: '5', name: 'Home', icon: 'home-outline' },
  { id: '6', name: 'Sports', icon: 'basketball-outline' },
];

const PRODUCTS = [
  { id: '1', name: 'Premium Oversized Hoodie', brand: 'Urban Wear', price: '₹1,499', oldPrice: '₹2,499', discount: '40%', rating: '4.8', reviews: '1.2K', image: 'https://via.placeholder.com/200/00D9FF' },
  { id: '2', name: 'Wireless Noise Cancelling Headphones', brand: 'Sonic', price: '₹5,999', oldPrice: '₹8,999', discount: '33%', rating: '4.9', reviews: '850', image: 'https://via.placeholder.com/200/8A2BE2' },
  { id: '3', name: 'Luxe Matte Lipstick Set', brand: 'Glow Up', price: '₹899', oldPrice: '₹1,299', discount: '30%', rating: '4.5', reviews: '2.4K', image: 'https://via.placeholder.com/200/00D9FF' },
  { id: '4', name: 'Smart Fitness Tracker', brand: 'FitPulse', price: '₹2,299', oldPrice: '₹3,499', discount: '34%', rating: '4.7', reviews: '3.1K', image: 'https://via.placeholder.com/200/8A2BE2' },
];

export default function ShopExploreScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('All');

  const renderProduct = ({ item }: { item: typeof PRODUCTS[0] }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => router.push(`/shop/product/${item.id}`)}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.productImage} />
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{item.discount} OFF</Text>
        </View>
        <TouchableOpacity style={styles.wishlistIcon}>
          <Ionicons name="heart-outline" size={20} color="#000" />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.brandName}>{item.brand}</Text>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{item.price}</Text>
          <Text style={styles.oldPrice}>{item.oldPrice}</Text>
        </View>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color="#00D9FF" />
          <Text style={styles.ratingText}>{item.rating} ({item.reviews})</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Nav */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="search-outline" size={26} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="heart-outline" size={26} color="#000" />
          </TouchableOpacity>
          <View>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="cart-outline" size={26} color="#000" />
            </TouchableOpacity>
            <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>3</Text></View>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View style={styles.bannerContainer}>
          <LinearGradient
            colors={['#00D9FF', '#8A2BE2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.banner}
          >
            <View style={styles.bannerContent}>
              <Text style={styles.bannerSubtitle}>SEASON SALE</Text>
              <Text style={styles.bannerTitle}>UP TO 50% OFF</Text>
              <TouchableOpacity style={styles.shopNowBtn}>
                <Text style={styles.shopNowText}>Shop Now</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bannerImageMock} />
          </LinearGradient>
          <View style={styles.dotRow}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesSection}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryTab, activeCategory === cat.name && styles.activeCategoryTab]}
              onPress={() => setActiveCategory(cat.name)}
            >
              <Ionicons name={cat.icon as any} size={20} color={activeCategory === cat.name ? '#00D9FF' : '#777'} />
              <Text style={[styles.categoryText, activeCategory === cat.name && styles.activeCategoryText]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Product Grid */}
        <View style={styles.gridContainer}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <FlatList
            data={PRODUCTS}
            renderItem={renderProduct}
            keyExtractor={item => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.gridRow}
          />
        </View>

        {/* Trending Section */}
        <View style={styles.trendingSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Now</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingContent}>
             {[1,2,3].map(i => (
               <View key={i} style={styles.trendingCard}>
                  <Image source={{ uri: 'https://via.placeholder.com/120' }} style={styles.trendingImg} />
                  <Text style={styles.trendingName}>Hype Sneaker {i}</Text>
                  <Text style={styles.trendingPrice}>₹4,999</Text>
               </View>
             ))}
          </ScrollView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  headerIcons: { flexDirection: 'row', gap: 18, alignItems: 'center' },
  iconBtn: { padding: 2 },
  cartBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#00D9FF', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cartBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  bannerContainer: { padding: 16 },
  banner: { height: 160, borderRadius: 20, flexDirection: 'row', padding: 20, overflow: 'hidden' },
  bannerContent: { flex: 1, justifyContent: 'center' },
  bannerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  bannerTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', marginVertical: 8 },
  shopNowBtn: { backgroundColor: '#FFF', alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10 },
  shopNowText: { color: '#00D9FF', fontWeight: 'bold', fontSize: 14 },
  bannerImageMock: { width: 100, height: 100, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 50, position: 'absolute', right: -20, bottom: -20 },
  dotRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EEE' },
  activeDot: { width: 18, backgroundColor: '#00D9FF' },
  categoriesSection: { marginVertical: 16 },
  categoriesContent: { paddingHorizontal: 16, gap: 12 },
  categoryTab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F5F5F5' },
  activeCategoryTab: { backgroundColor: 'rgba(0, 217, 255, 0.1)', borderBottomWidth: 2, borderBottomColor: '#00D9FF' },
  categoryText: { fontSize: 14, fontWeight: '600', color: '#777' },
  activeCategoryText: { color: '#00D9FF' },
  gridContainer: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  gridRow: { justifyContent: 'space-between', marginBottom: 16 },
  productCard: { width: (width - 44) / 2, backgroundColor: '#FFF' },
  imageContainer: { position: 'relative' },
  productImage: { width: '100%', height: 160, borderRadius: 16, backgroundColor: '#F9F9F9' },
  discountBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#FF3B5C', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  discountText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  wishlistIcon: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.8)', padding: 6, borderRadius: 20 },
  productInfo: { marginTop: 10 },
  brandName: { color: '#AAA', fontSize: 11, fontWeight: '600' },
  productName: { fontSize: 14, fontWeight: 'bold', color: '#000', marginTop: 2, height: 40 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#00D9FF' },
  oldPrice: { fontSize: 12, color: '#AAA', textDecorationLine: 'line-through' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontSize: 11, color: '#777' },
  trendingSection: { marginTop: 24, paddingLeft: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingRight: 16, alignItems: 'center', marginBottom: 16 },
  seeAll: { color: '#00D9FF', fontWeight: 'bold' },
  trendingContent: { gap: 16, paddingRight: 16 },
  trendingCard: { width: 140 },
  trendingImg: { width: 140, height: 140, borderRadius: 12, backgroundColor: '#F5F5F5' },
  trendingName: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  trendingPrice: { color: '#00D9FF', fontWeight: 'bold', marginTop: 2 },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../constants/colors';

const { width } = Dimensions.get('window');

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const COLORS = ['#000000', '#00D9FF', '#8A2BE2', '#FFFFFF'];

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isWishlisted, setIsWishlisted] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Nav */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconCircle}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconCircle}><Ionicons name="share-social-outline" size={24} color="#000" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconCircle} onPress={() => setIsWishlisted(!isWishlisted)}>
            <Ionicons name={isWishlisted ? "heart" : "heart-outline"} size={24} color={isWishlisted ? "#FF3B5C" : "#000"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconCircle}><Ionicons name="cart-outline" size={24} color="#000" /></TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            <Image source={{ uri: 'https://via.placeholder.com/400/00D9FF' }} style={styles.productImg} />
            <Image source={{ uri: 'https://via.placeholder.com/400/8A2BE2' }} style={styles.productImg} />
          </ScrollView>
          <View style={styles.pagination}>
             <View style={[styles.dot, styles.activeDot]} />
             <View style={styles.dot} />
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
           <Text style={styles.brandName}>URBAN WEAR <Ionicons name="checkmark-circle" size={12} color="#00D9FF" /></Text>
           <Text style={styles.productTitle}>Premium Oversized Hoodie - Summer Collection</Text>

           <View style={styles.ratingRow}>
              <View style={styles.stars}>
                {[1,2,3,4,5].map(i => <Ionicons key={i} name="star" size={16} color="#00D9FF" />)}
              </View>
              <Text style={styles.ratingText}>4.8 <Text style={styles.reviewsText}>(2.4K reviews)</Text></Text>
           </View>

           <View style={styles.priceRow}>
              <Text style={styles.salePrice}>₹1,499</Text>
              <Text style={styles.oldPrice}>₹2,499</Text>
              <View style={styles.discountBadge}><Text style={styles.discountText}>40% OFF</Text></View>
           </View>
           <Text style={styles.stockWarning}>Only 5 items left in stock!</Text>

           {/* Variant Selectors */}
           <View style={styles.variantSection}>
              <Text style={styles.variantLabel}>Select Size</Text>
              <View style={styles.sizeRow}>
                 {SIZES.map(s => (
                   <TouchableOpacity
                    key={s}
                    style={[styles.sizePill, selectedSize === s && styles.activeSizePill]}
                    onPress={() => setSelectedSize(s)}
                   >
                     <Text style={[styles.sizeText, selectedSize === s && styles.activeSizeText]}>{s}</Text>
                   </TouchableOpacity>
                 ))}
              </View>
           </View>

           <View style={styles.variantSection}>
              <Text style={styles.variantLabel}>Select Color</Text>
              <View style={styles.colorRow}>
                 {COLORS.map(c => (
                   <TouchableOpacity
                    key={c}
                    style={[styles.colorCircle, { backgroundColor: c }, selectedColor === c && styles.activeColorCircle]}
                    onPress={() => setSelectedColor(c)}
                   />
                 ))}
              </View>
           </View>

           {/* Action Buttons */}
           <View style={styles.actions}>
              <TouchableOpacity style={styles.addToCartBtn}>
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buyNowBtn}>
                <Text style={styles.buyNowText}>Buy Now</Text>
              </TouchableOpacity>
           </View>

           {/* Seller Card */}
           <TouchableOpacity style={styles.sellerCard} onPress={() => router.push(`/shop/seller/${id}`)}>
              <Image source={{ uri: 'https://via.placeholder.com/50' }} style={styles.sellerLogo} />
              <View style={styles.sellerInfo}>
                 <Text style={styles.sellerName}>Urban Wear Official <Ionicons name="shield-checkmark" size={14} color="#00D9FF" /></Text>
                 <Text style={styles.sellerRating}>Top Rated Seller</Text>
              </View>
              <Text style={styles.visitStore}>Visit Store</Text>
           </TouchableOpacity>

           {/* Description */}
           <View style={styles.descSection}>
              <Text style={styles.descTitle}>Description</Text>
              <Text style={styles.descText}>
                This premium oversized hoodie is crafted from 100% heavy-weight cotton.
                Features a relaxed fit, drop shoulders, and a minimalist design perfect
                for your daily hype-beast look.
              </Text>
           </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, position: 'absolute', top: 40, left: 0, right: 0, zIndex: 10 },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center' },
  carouselContainer: { width: width, height: 400, position: 'relative' },
  productImg: { width: width, height: 400, backgroundColor: '#F9F9F9' },
  pagination: { position: 'absolute', bottom: 20, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.1)' },
  activeDot: { width: 18, backgroundColor: '#00D9FF' },
  infoContainer: { padding: 20, backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30 },
  brandName: { color: '#00D9FF', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  productTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 8, color: '#000' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  stars: { flexDirection: 'row' },
  ratingText: { fontSize: 14, fontWeight: 'bold' },
  reviewsText: { color: '#777', fontWeight: 'normal' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  salePrice: { fontSize: 26, fontWeight: 'bold', color: '#00D9FF' },
  oldPrice: { fontSize: 16, color: '#AAA', textDecorationLine: 'line-through' },
  discountBadge: { backgroundColor: 'rgba(0,217,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  discountText: { color: '#00D9FF', fontWeight: 'bold', fontSize: 12 },
  stockWarning: { color: '#FF3B5C', fontSize: 13, fontWeight: '600', marginTop: 8 },
  variantSection: { marginTop: 24 },
  variantLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  sizeRow: { flexDirection: 'row', gap: 12 },
  sizePill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#EEE' },
  activeSizePill: { borderColor: '#00D9FF', backgroundColor: 'rgba(0,217,255,0.05)' },
  sizeText: { fontWeight: '600', color: '#777' },
  activeSizeText: { color: '#00D9FF' },
  colorRow: { flexDirection: 'row', gap: 16 },
  colorCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 3, borderColor: 'transparent' },
  activeColorCircle: { borderColor: '#00D9FF' },
  actions: { marginTop: 32, gap: 12 },
  addToCartBtn: { height: 54, borderRadius: 15, borderWidth: 1.5, borderColor: '#00D9FF', justifyContent: 'center', alignItems: 'center' },
  addToCartText: { color: '#00D9FF', fontWeight: 'bold', fontSize: 16 },
  buyNowBtn: { height: 54, borderRadius: 15, backgroundColor: '#00D9FF', justifyContent: 'center', alignItems: 'center' },
  buyNowText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  sellerCard: { flexDirection: 'row', alignItems: 'center', marginTop: 32, padding: 16, backgroundColor: '#F9F9F9', borderRadius: 20 },
  sellerLogo: { width: 50, height: 50, borderRadius: 25 },
  sellerInfo: { flex: 1, marginLeft: 16 },
  sellerName: { fontWeight: 'bold', fontSize: 15 },
  sellerRating: { color: '#777', fontSize: 12, marginTop: 2 },
  visitStore: { color: '#00D9FF', fontWeight: 'bold' },
  descSection: { marginTop: 32 },
  descTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  descText: { fontSize: 14, color: '#555', lineHeight: 22 },
});

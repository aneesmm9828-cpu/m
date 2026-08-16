import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const MOCK_PRODUCTS = [
  { id: '1', name: 'Cotton Summer Tee', price: '₹999', oldPrice: '₹1,499', image: 'https://via.placeholder.com/100/00D9FF', deal: true },
  { id: '2', name: 'Vintage Denim', price: '₹2,499', oldPrice: '₹3,999', image: 'https://via.placeholder.com/100/8A2BE2', deal: false },
  { id: '3', name: 'Silk Scarf', price: '₹799', oldPrice: '₹1,299', image: 'https://via.placeholder.com/100/00D9FF', deal: true },
];

export default function LiveShoppingScreen() {
  const router = useRouter();
  const [featuredProduct, setFeaturedProduct] = useState(MOCK_PRODUCTS[0]);
  const [showFeatured, setShowFeatured] = useState(true);

  return (
    <View style={styles.container}>
      {/* Host Background Video Mock */}
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=375&h=812&auto=format&fit=crop' }}
        style={styles.backgroundVideo}
      />
      <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.7)']} style={styles.overlay} />

      <SafeAreaView style={styles.content} edges={['top', 'bottom']}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.shoppingBadge}>
            <Ionicons name="bag-handle" size={16} color="#00D9FF" />
            <Text style={styles.badgeText}>LIVE SHOPPING</Text>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.viewerCount}>
              <Ionicons name="eye" size={14} color="#FFF" />
              <Text style={styles.countText}>3.4K</Text>
            </View>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={30} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sold Notification */}
        <View style={styles.soldNotification}>
           <Text style={styles.soldText}>🛒 @riya_v bought this!</Text>
        </View>

        {/* Featured Product Slide-up */}
        {showFeatured && (
          <View style={styles.featuredContainer}>
            <BlurView intensity={90} tint="light" style={styles.featuredCard}>
               <Image source={{ uri: featuredProduct.image }} style={styles.featuredImg} />
               <View style={styles.featuredInfo}>
                  <Text style={styles.brandName}>MARB COLLECTION</Text>
                  <Text style={styles.productTitle} numberOfLines={1}>{featuredProduct.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.salePrice}>{featuredProduct.price}</Text>
                    <Text style={styles.oldPrice}>{featuredProduct.oldPrice}</Text>
                  </View>
                  <TouchableOpacity style={styles.addToCartBtn}>
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </TouchableOpacity>
               </View>
               <TouchableOpacity style={styles.closeFeatured} onPress={() => setShowFeatured(false)}>
                 <Ionicons name="close-circle" size={24} color="#777" />
               </TouchableOpacity>
            </BlurView>
          </View>
        )}

        {/* Product Shelf */}
        <View style={styles.bottomSection}>
          <View style={styles.orderBadge}>
             <Text style={styles.orderText}>47 sold</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shelf}>
             {MOCK_PRODUCTS.map(item => (
               <TouchableOpacity
                key={item.id}
                style={[styles.shelfCard, featuredProduct.id === item.id && styles.activeShelfCard]}
                onPress={() => { setFeaturedProduct(item); setShowFeatured(true); }}
               >
                 <Image source={{ uri: item.image }} style={styles.shelfImg} />
                 <View style={styles.shelfInfo}>
                    <Text style={styles.shelfPrice}>{item.price}</Text>
                    {item.deal && <View style={styles.dealBadge}><Text style={styles.dealText}>DEAL</Text></View>}
                 </View>
               </TouchableOpacity>
             ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backgroundVideo: { position: 'absolute', width: width, height: height },
  overlay: { position: 'absolute', width: width, height: height },
  content: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10 },
  shoppingBadge: { backgroundColor: 'rgba(0, 217, 255, 0.2)', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#00D9FF' },
  badgeText: { color: '#00D9FF', fontWeight: 'bold', fontSize: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  viewerCount: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  countText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  soldNotification: { alignSelf: 'center', backgroundColor: '#4fffb0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 20 },
  soldText: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  featuredContainer: { position: 'absolute', bottom: 180, left: 16, right: 16 },
  featuredCard: { flexDirection: 'row', padding: 16, borderRadius: 20, overflow: 'hidden', gap: 16 },
  featuredImg: { width: 80, height: 80, borderRadius: 12 },
  featuredInfo: { flex: 1 },
  brandName: { color: '#777', fontSize: 10, fontWeight: 'bold' },
  productTitle: { color: '#000', fontSize: 16, fontWeight: 'bold', marginVertical: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  salePrice: { color: '#00D9FF', fontWeight: 'bold', fontSize: 16 },
  oldPrice: { color: '#AAA', textDecorationLine: 'line-through', fontSize: 12 },
  addToCartBtn: { backgroundColor: '#00D9FF', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  addToCartText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  closeFeatured: { position: 'absolute', top: -10, right: -10 },
  bottomSection: { position: 'absolute', bottom: 40, left: 0, right: 0 },
  orderBadge: { alignSelf: 'flex-end', marginRight: 16, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 12 },
  orderText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  shelf: { paddingLeft: 16 },
  shelfCard: { width: 80, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, overflow: 'hidden', marginRight: 12, borderWidth: 1, borderColor: 'transparent' },
  activeShelfCard: { borderColor: '#00D9FF', borderWidth: 2 },
  shelfImg: { width: '100%', height: 60 },
  shelfInfo: { padding: 6, alignItems: 'center' },
  shelfPrice: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  dealBadge: { backgroundColor: '#FF3B5C', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  dealText: { color: '#FFF', fontSize: 8, fontWeight: 'bold' },
});

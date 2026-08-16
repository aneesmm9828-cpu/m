import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { supabase } from '../../utils/supabaseConfig';

// Components
import ShopHeader from './components/ShopHeader';
import ShopCategories from './components/ShopCategories';
import ShopBanners from './components/ShopBanners';

const { width } = Dimensions.get('window');
const itemWidth = (width - 36) / 2;

export default function ShopScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) {
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderProduct = ({ item }: { item: any }) => {
    const productImage = item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/200';
    const mrp = item.price + (item.price * 0.2); // Mock original price for discount display

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => router.push(`/shop/product/${item.product_id}` as any)}
      >
        <Image source={{ uri: productImage }} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>4.2</Text>
                <Ionicons name="star" size={10} color="#fff" />
            </View>
            <Text style={styles.reviewsText}>(12,450)</Text>
            <Image source={{ uri: 'https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/fa_62673a.png' }} style={styles.assuredImg} />
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>₹{item.price}</Text>
            <Text style={styles.mrpText}>₹{Math.round(mrp)}</Text>
            <Text style={styles.discountText}>20% off</Text>
          </View>
          <Text style={styles.deliveryText}>Free delivery</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
        <ShopCategories />
        <ShopBanners />
        <View style={styles.dealsSection}>
            <View style={styles.dealsHeader}>
                <Text style={styles.dealsTitle}>Deals of the Day</Text>
                <TouchableOpacity style={styles.viewAllBtn}>
                    <Ionicons name="chevron-forward-circle" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ShopHeader />

      <FlatList
        data={products.length > 0 ? products : [1,2,3,4]} // Show mock grid if empty
        renderItem={renderProduct}
        keyExtractor={(item, index) => index.toString()}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.productList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  productList: { paddingHorizontal: 12, paddingBottom: 20 },
  productCard: { width: itemWidth, margin: 6, backgroundColor: Colors.cardBackground, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  productImage: { width: '100%', height: 160, backgroundColor: Colors.border },
  productInfo: { padding: 10 },
  productName: { fontSize: 13, color: Colors.text, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 4 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#388e3c', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, gap: 2 },
  ratingText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  reviewsText: { color: Colors.textSecondary, fontSize: 10 },
  assuredImg: { width: 45, height: 12, marginLeft: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  productPrice: { fontSize: 15, fontWeight: 'bold', color: Colors.text },
  mrpText: { fontSize: 12, color: Colors.textSecondary, textDecorationLine: 'line-through' },
  discountText: { fontSize: 12, color: '#388e3c', fontWeight: 'bold' },
  deliveryText: { fontSize: 11, color: Colors.text, marginTop: 4 },

  dealsSection: { paddingHorizontal: 16, marginTop: 10, marginBottom: 10 },
  dealsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dealsTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  viewAllBtn: { padding: 4 },
});

import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { useRouter } from 'expo-router';

const ShopHeader = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Image
          source={require('../../../assets/images/marb-logo.jpg')}
          style={styles.logo}
        />
        <View style={styles.rightIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications?filter=Shop' as any)}>
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/shop/cart' as any)}>
            <View>
                <Ionicons name="cart-outline" size={26} color={Colors.text} />
                <View style={styles.cartBadge}><Text style={styles.cartCount}>2</Text></View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
                placeholder="Search for Products, Brands and More"
                placeholderTextColor={Colors.textSecondary}
                style={styles.input}
            />
            <View style={styles.searchRightIcons}>
                <Ionicons name="mic-outline" size={22} color={Colors.textSecondary} />
                <Ionicons name="camera-outline" size={22} color={Colors.textSecondary} style={{ marginLeft: 12 }} />
            </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, paddingBottom: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  backBtn: { padding: 4 },
  logo: { width: 32, height: 32, borderRadius: 8 },
  rightIcons: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 18 },
  iconBtn: { padding: 4 },
  cartBadge: { position: 'absolute', top: -4, right: -6, backgroundColor: Colors.primary, width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cartCount: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  searchBarContainer: { paddingHorizontal: 16, marginTop: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 8, paddingHorizontal: 12, height: 42, borderWidth: 1, borderColor: Colors.border },
  searchIcon: { marginRight: 10 },
  input: { flex: 1, color: Colors.text, fontSize: 14 },
  searchRightIcons: { flexDirection: 'row', alignItems: 'center' },
});

export default ShopHeader;

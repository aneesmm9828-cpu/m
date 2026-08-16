import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Colors } from '../../../constants/colors';

const CATEGORIES = [
  { name: 'Mobiles', image: 'https://rukminim2.flixcart.com/flap/128/128/image/22fddf3c7da4c4f4.png' },
  { name: 'Fashion', image: 'https://rukminim2.flixcart.com/flap/128/128/image/c12afc017e6f24cb.png' },
  { name: 'Electronics', image: 'https://rukminim2.flixcart.com/flap/128/128/image/69cff05093e67e44.png' },
  { name: 'Home', image: 'https://rukminim2.flixcart.com/flap/128/128/image/ab7e2c0200c9d82a.jpg' },
  { name: 'Appliances', image: 'https://rukminim2.flixcart.com/flap/128/128/image/0ff099d1bd3082a3.png' },
  { name: 'Beauty', image: 'https://rukminim2.flixcart.com/flap/128/128/image/dff3f7adcf3a90c6.png' },
  { name: 'Furniture', image: 'https://rukminim2.flixcart.com/flap/128/128/image/ee10507419240767.png' },
];

const ShopCategories = () => {
  return (
    <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
    >
      {CATEGORIES.map((item, index) => (
        <TouchableOpacity key={index} style={styles.item}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: item.image }} style={styles.image} resizeMode="contain" />
          </View>
          <Text style={styles.name}>{item.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 10, paddingVertical: 15 },
  item: { alignItems: 'center', marginHorizontal: 10 },
  imageContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  image: { width: 40, height: 40 },
  name: { color: Colors.text, fontSize: 12, fontWeight: '500' },
});

export default ShopCategories;

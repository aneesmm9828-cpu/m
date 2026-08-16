import React from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity } from 'react-native';

const { width } = Dimensions.get('window');

const BANNERS = [
  'https://rukminim2.flixcart.com/fk-p-flap/1600/270/image/352e6a0f6f30fea9.jpg',
  'https://rukminim2.flixcart.com/fk-p-flap/1600/270/image/1aa6e408c02f0685.jpg',
  'https://rukminim2.flixcart.com/fk-p-flap/1600/270/image/9e9aa250df23778d.jpg',
];

const ShopBanners = () => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
      >
        {BANNERS.map((url, index) => (
          <TouchableOpacity key={index} activeOpacity={0.9}>
            <Image source={{ uri: url }} style={styles.banner} resizeMode="stretch" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { height: 180, marginVertical: 10 },
  banner: { width: width, height: 180 },
});

export default ShopBanners;

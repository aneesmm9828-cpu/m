import React, { useState } from 'react';
import { View, Image, FlatList, Dimensions, StyleSheet, Text } from 'react-native';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

interface CarouselPostProps {
  media: { url: string; type: 'image' | 'video' }[];
}

const CarouselPost: React.FC<CarouselPostProps> = ({ media }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <View style={styles.container}>
      <FlatList
        data={media}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
        }}
        renderItem={({ item }) => (
          <Image source={{ uri: item.url }} style={styles.media} resizeMode="cover" />
        )}
        keyExtractor={(_, index) => index.toString()}
      />

      {media.length > 1 && (
        <View style={styles.indicatorContainer}>
          {media.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                activeIndex === index ? styles.activeDot : styles.inactiveDot
              ]}
            />
          ))}
        </View>
      )}

      {media.length > 1 && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{activeIndex + 1}/{media.length}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: width, height: width, position: 'relative' },
  media: { width: width, height: width },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: -20,
    width: '100%'
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 2 },
  activeDot: { backgroundColor: Colors.primary },
  inactiveDot: { backgroundColor: Colors.textTertiary },
  countBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  countText: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
});

export default CarouselPost;

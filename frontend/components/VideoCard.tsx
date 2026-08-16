import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

interface VideoCardProps {
  item: any;
  onPress?: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ item, onPress }) => {
  const { user, media_url, caption, created_at, views = '12K', duration = '10:05' } = item;

  // Simple time ago logic (placeholder)
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return past.toLocaleDateString();
  };

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.9} onPress={onPress}>
      {/* Thumbnail Container */}
      <View style={styles.thumbnailContainer}>
        <Image source={{ uri: media_url }} style={styles.thumbnail} resizeMode="cover" />
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{duration}</Text>
        </View>
      </View>

      {/* Info Container */}
      <View style={styles.infoContainer}>
        <Image
          source={{ uri: user?.picture || 'https://via.placeholder.com/100' }}
          style={styles.avatar}
        />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {caption || 'Untitled Video Content'}
          </Text>
          <Text style={styles.metadata}>
            {user?.username || 'Unknown'} • {views} views • {getTimeAgo(created_at)}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    backgroundColor: Colors.background,
  },
  thumbnailContainer: {
    width: width,
    height: width * 0.56, // 16:9 aspect ratio
    backgroundColor: Colors.surface,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 4,
  },
  metadata: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  moreButton: {
    padding: 4,
    marginLeft: 4,
  },
});

export default VideoCard;

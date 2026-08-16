import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

interface MARBButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'outline' | 'secondary';
}

export const MARBButton: React.FC<MARBButtonProps> = ({
  title,
  onPress,
  loading = false,
  style,
  textStyle,
  variant = 'primary'
}) => {
  if (variant === 'outline') {
    return (
      <TouchableOpacity
        style={[styles.button, styles.outlineButton, style]}
        onPress={onPress}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Text style={[styles.text, styles.outlineText, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress} disabled={loading}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <Text style={[styles.text, textStyle]}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.5,
  },
  outlineText: {
    color: Colors.primary,
  },
});

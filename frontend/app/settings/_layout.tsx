import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="security" />
      <Stack.Screen name="blocked" />
      <Stack.Screen name="muted" />
      <Stack.Screen name="restricted" />
      <Stack.Screen name="close-friends" />
      <Stack.Screen name="archive" />
      <Stack.Screen name="change-password" />
    </Stack>
  );
}

import { Stack } from 'expo-router';

export default function CameraLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="capture" />
    </Stack>
  );
}

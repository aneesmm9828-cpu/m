import { Stack } from 'expo-router';

export default function MessagesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="chat" />
      <Stack.Screen name="requests" />
      <Stack.Screen name="new-chat" />
    </Stack>
  );
}

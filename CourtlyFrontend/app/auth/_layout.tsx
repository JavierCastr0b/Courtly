import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

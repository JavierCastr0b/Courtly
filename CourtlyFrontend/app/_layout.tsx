import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Force Courtly dark theme colors into the navigation theme
const CourtlyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0B0F14',
    card: '#0D1117',
    border: '#2C3038',
    primary: '#1E90FF',
    text: '#FFFFFF',
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={CourtlyDarkTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

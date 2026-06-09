import { DarkTheme, DefaultTheme, ThemeProvider as RNThemeProvider } from '@react-navigation/native';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { CourtlyThemeProvider, useTheme } from '@/src/theme/ThemeContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function SplashView() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={splash.container}>
      <Animated.View style={[splash.row, { opacity, transform: [{ scale }] }]}>
        <Image
          source={require('@/assets/images/LOGO_INICIAL_COURTLY.png')}
          style={splash.logoImage}
          resizeMode="contain"
        />
        <Text style={splash.logoText}>
          Courtly<Text style={splash.logoDot}>.</Text>
        </Text>
      </Animated.View>
    </View>
  );
}

function InnerLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDark, colors } = useTheme();
  const [minDelayDone, setMinDelayDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinDelayDone(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (isLoading || !minDelayDone) return <SplashView />;

  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background, card: colors.tabBar, border: colors.border, primary: colors.primary, text: colors.textPrimary } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background, card: colors.tabBar, border: colors.border, primary: colors.primary, text: colors.textPrimary } };

  return (
    <RNThemeProvider value={navTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="profile/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications/index" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="match/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="followers/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      {!isAuthenticated && <Redirect href="/auth/login" />}
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </RNThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CourtlyThemeProvider>
        <InnerLayout />
      </CourtlyThemeProvider>
    </AuthProvider>
  );
}

const splash = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050B18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoImage: {
    width: 72,
    height: 72,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoDot: {
    color: '#14B8A6',
  },
});

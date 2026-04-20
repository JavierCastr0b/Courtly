import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

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
  const [minDelayDone, setMinDelayDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinDelayDone(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (isLoading || !minDelayDone) return <SplashView />;

  return (
    <ThemeProvider value={CourtlyDarkTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      {!isAuthenticated && <Redirect href="/auth/login" />}
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InnerLayout />
    </AuthProvider>
  );
}

const splash = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F14',
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
    color: '#FF6B00',
  },
});

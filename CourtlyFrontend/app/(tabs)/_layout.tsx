import { Tabs } from 'expo-router';
import React from 'react';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';

function RegisterIcon({ focused }: { color: string; focused: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{
      width: 40,
      height: 40,
      borderRadius: 17,
      backgroundColor: focused ? colors.accent : colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: -10,
      ...(focused ? {
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
        elevation: 6,
      } : {}),
    }}>
      <Ionicons name="add" size={20} color={focused ? '#fff' : colors.textMuted} />
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 82 : 62,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mapas"
        options={{
          title: 'Mapas',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="registrar"
        options={{
          title: '',
          tabBarIcon: ({ focused, color }) => (
            <RegisterIcon color={color} focused={focused} />
          ),
          tabBarActiveTintColor: colors.accent,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Tú',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}

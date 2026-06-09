import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types';
import { useTheme } from '../theme/ThemeContext';
import { Avatar } from './Avatar';
import { Tag } from './Tag';
import { Button } from './Button';

interface FriendCardProps {
  user: User;
  onInvite?: (user: User) => void;
  onViewProfile?: (user: User) => void;
}

export function FriendCard({ user, onInvite, onViewProfile }: FriendCardProps) {
  const { colors } = useTheme();

  return (
    <View style={{
      backgroundColor: colors.cardBg,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 14,
    }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <Avatar name={user.name} size={48} available={user.available} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>{user.name}</Text>
            {user.available && (
              <View style={{ backgroundColor: colors.success + '22', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: colors.success, fontSize: 11, fontWeight: '600' }}>Disponible hoy</Text>
              </View>
            )}
          </View>
          <Tag label={user.level} variant="level" style={{ marginTop: 4 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
            <Ionicons name="person-outline" size={12} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>@{user.username}</Text>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button label="Invitar a partido" variant="primary" size="sm" onPress={() => onInvite?.(user)} style={{ flex: 1 }} />
        <Button label="Ver perfil" variant="outline" size="sm" onPress={() => onViewProfile?.(user)} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

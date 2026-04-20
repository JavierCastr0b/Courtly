import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types';
import { colors } from '../theme/colors';
import { Avatar } from './Avatar';
import { Tag } from './Tag';
import { Button } from './Button';

interface FriendCardProps {
  user: User;
  onInvite?: (user: User) => void;
  onViewProfile?: (user: User) => void;
}

export function FriendCard({ user, onInvite, onViewProfile }: FriendCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Avatar name={user.name} size={48} available={user.available} />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user.name}</Text>
            {user.available && (
              <View style={styles.availableBadge}>
                <Text style={styles.availableText}>Disponible hoy</Text>
              </View>
            )}
          </View>
          <Tag label={user.level} variant="level" style={{ marginTop: 4 }} />
          <View style={styles.lastActive}>
            <Ionicons name="person-outline" size={12} color={colors.textMuted} />
            <Text style={styles.lastActiveText}>@{user.username}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          label="Invitar a partido"
          variant="primary"
          size="sm"
          onPress={() => onInvite?.(user)}
          style={{ flex: 1 }}
        />
        <Button
          label="Ver perfil"
          variant="outline"
          size="sm"
          onPress={() => onViewProfile?.(user)}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  top: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  availableBadge: {
    backgroundColor: colors.success + '22',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  availableText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '600',
  },
  lastActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  lastActiveText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
});

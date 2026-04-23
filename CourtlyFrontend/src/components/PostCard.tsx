import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../types';
import { postsApi } from '../api/posts';
import { colors } from '../theme/colors';
import { Avatar } from './Avatar';
import { Tag } from './Tag';
import { Button } from './Button';

interface PostCardProps {
  post: Post;
  onJoin?: (post: Post) => void;
}

export function PostCard({ post, onJoin }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikesCount((prev) => (next ? prev + 1 : prev - 1));
    (next ? postsApi.like(post.id) : postsApi.unlike(post.id)).catch(() => {
      setLiked(!next);
      setLikesCount((prev) => (next ? prev - 1 : prev + 1));
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar name={post.user.name} size={42} available={post.user.available} />
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{post.user.name}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>{post.location}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.metaText}>{post.createdAt}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.title}>{post.title}</Text>

      {post.description ? (
        <Text style={styles.description}>{post.description}</Text>
      ) : null}

      <View style={styles.infoRow}>
        {post.date && post.time ? (
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={14} color={colors.primary} />
            <Text style={styles.infoText}>{post.date} · {post.time}</Text>
          </View>
        ) : null}
        {post.playersNeeded > 0 ? (
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={14} color={colors.ctaHighlight} />
            <Text style={[styles.infoText, { color: colors.ctaHighlight }]}>
              {post.playersNeeded} {post.playersNeeded === 1 ? 'jugador' : 'jugadores'} necesarios
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleLike} style={styles.likeBtn}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={18}
            color={liked ? '#FF3B30' : colors.textSecondary}
          />
          <Text style={[styles.likeCount, liked && { color: '#FF3B30' }]}>{likesCount}</Text>
        </TouchableOpacity>
        <Button
          label="Unirme"
          variant="primary"
          size="sm"
          onPress={() => onJoin?.(post)}
          style={{ paddingHorizontal: 22 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  dot: {
    color: colors.textMuted,
    fontSize: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 21,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeCount: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});

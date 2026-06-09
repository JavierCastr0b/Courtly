import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../types';
import { postsApi } from '../api/posts';
import { useTheme } from '../theme/ThemeContext';
import type { Colors } from '../theme/colors';
import { Avatar } from './Avatar';

interface PostCardProps {
  post: Post;
  initialLiked?: boolean;
}

type PostType = 'open-match' | 'seeking' | 'scheduled' | 'general';

function getPostType(post: Post): PostType {
  if (post.playersNeeded > 0 && post.date) return 'open-match';
  if (post.playersNeeded > 0) return 'seeking';
  if (post.date) return 'scheduled';
  return 'general';
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.cardBg,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    accentBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      borderTopLeftRadius: 14,
      borderBottomLeftRadius: 14,
    },
    typeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 8,
      marginBottom: 12,
    },
    typeBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
    headerInfo: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' },
    userName: { color: c.textPrimary, fontWeight: '700', fontSize: 14 },
    onlinePill: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: c.success + '20', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
    },
    onlineDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: c.success },
    onlinePillText: { color: c.success, fontSize: 10, fontWeight: '600' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    metaText: { color: c.textMuted, fontSize: 11 },
    dot: { color: c.textMuted, fontSize: 11 },
    title: { color: c.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 6, lineHeight: 21 },
    description: { color: c.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 12 },
    postImage: { width: '100%', height: 190, borderRadius: 10, marginBottom: 12 },
    infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 14 },
    infoChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: c.primary + '15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
      borderWidth: 1, borderColor: c.primary + '30',
    },
    infoChipAccent: {
      backgroundColor: c.accent + '15',
      borderColor: c.accent + '30',
    },
    infoChipText: { color: c.primary, fontSize: 12, fontWeight: '600' },
    footer: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderTopWidth: 1, borderTopColor: c.border, paddingTop: 12,
    },
    likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    likeCount: { color: c.textSecondary, fontSize: 14, fontWeight: '500' },
    respondChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 12, paddingVertical: 6,
      backgroundColor: c.secondary, borderRadius: 10, borderWidth: 1, borderColor: c.border,
    },
    respondText: { fontSize: 12, fontWeight: '600' },
  });
}

export function PostCard({ post, initialLiked = false }: PostCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(post.likes);

  const postType = getPostType(post);

  const typeConfig: Record<PostType, { label: string; iconName: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
    'open-match': { label: 'Partido abierto', iconName: 'tennisball-outline', color: colors.success },
    seeking: { label: 'Busco jugadores', iconName: 'people-outline', color: colors.accent },
    scheduled: { label: 'Convocatoria', iconName: 'calendar-outline', color: colors.primary },
    general: { label: '', iconName: 'chatbubble-outline', color: colors.textMuted },
  };

  const typeConf = typeConfig[postType];

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikesCount(prev => next ? prev + 1 : prev - 1);
    (next ? postsApi.like(post.id) : postsApi.unlike(post.id)).catch(() => {
      setLiked(!next);
      setLikesCount(prev => next ? prev - 1 : prev + 1);
    });
  };

  return (
    <View style={styles.card}>
      {postType !== 'general' && (
        <View style={[styles.accentBar, { backgroundColor: typeConf.color }]} />
      )}
      {postType !== 'general' && (
        <View style={[styles.typeBadge, { backgroundColor: typeConf.color + '18' }]}>
          <Ionicons name={typeConf.iconName} size={11} color={typeConf.color} />
          <Text style={[styles.typeBadgeText, { color: typeConf.color }]}>
            {typeConf.label.toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.header}>
        <Avatar name={post.user.name} size={40} available={post.user.available} />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{post.user.name}</Text>
            {post.user.available && (
              <View style={styles.onlinePill}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlinePillText}>Disponible</Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            {post.location ? (
              <>
                <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                <Text style={styles.metaText}>{post.location}</Text>
                <Text style={styles.dot}>·</Text>
              </>
            ) : null}
            <Text style={styles.metaText}>{post.createdAt}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.title}>{post.title}</Text>
      {post.description ? <Text style={styles.description} numberOfLines={3}>{post.description}</Text> : null}
      {post.image ? <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" /> : null}

      {(post.date || post.playersNeeded > 0) && (
        <View style={styles.infoRow}>
          {post.date && post.time ? (
            <View style={styles.infoChip}>
              <Ionicons name="time-outline" size={12} color={colors.primary} />
              <Text style={styles.infoChipText}>{post.date} · {post.time}</Text>
            </View>
          ) : post.date ? (
            <View style={styles.infoChip}>
              <Ionicons name="calendar-outline" size={12} color={colors.primary} />
              <Text style={styles.infoChipText}>{post.date}</Text>
            </View>
          ) : null}
          {post.playersNeeded > 0 && (
            <View style={[styles.infoChip, styles.infoChipAccent]}>
              <Ionicons name="people-outline" size={12} color={colors.accent} />
              <Text style={[styles.infoChipText, { color: colors.accent }]}>
                {post.playersNeeded} {post.playersNeeded === 1 ? 'jugador' : 'jugadores'} necesarios
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleLike} style={styles.likeBtn} activeOpacity={0.7}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? '#FF3B30' : colors.textSecondary} />
          <Text style={[styles.likeCount, liked && { color: '#FF3B30' }]}>{likesCount}</Text>
        </TouchableOpacity>
        {(postType === 'open-match' || postType === 'seeking') && (
          <View style={styles.respondChip}>
            <Ionicons name="send-outline" size={12} color={typeConf.color} />
            <Text style={[styles.respondText, { color: typeConf.color }]}>Responder</Text>
          </View>
        )}
      </View>
    </View>
  );
}

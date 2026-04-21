import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { usersApi } from '@/src/api/users';
import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';

const MENU_ITEMS = [
  { label: 'Estadísticas', icon: 'bar-chart-outline' as const },
  { label: 'Partidos', icon: 'tennisball-outline' as const },
  { label: 'Publicaciones', icon: 'document-text-outline' as const },
  { label: 'Equipamiento', icon: 'bag-handle-outline' as const },
];

export default function PerfilScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [stats, setStats] = useState({ followersCount: 0, followingCount: 0 });
  const [editVisible, setEditVisible] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editAvailable, setEditAvailable] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    usersApi.getStats(user.id)
      .then(setStats)
      .catch(() => {});
  }, [user?.id]);

  if (!user) return null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tú</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/notifications')}>
          <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => Alert.alert('Configuración', undefined, [
            { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
            { text: 'Cancelar', style: 'cancel' },
          ])}
        >
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Avatar + info */}
        <View style={styles.profileSection}>
          <Avatar name={user.name} size={72} available={user.available} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileUsername}>@{user.username}</Text>
            {user.location ? (
              <View style={styles.profileMeta}>
                <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                <Text style={styles.profileMetaText}>{user.location}</Text>
              </View>
            ) : null}
          </View>
          <Button
            label="Editar"
            variant="outline"
            size="sm"
            onPress={() => {
              setEditBio(user.bio ?? '');
              setEditLocation(user.location ?? '');
              setEditAvailable(user.available);
              setEditVisible(true);
            }}
          />
        </View>

        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

        {/* Siguiendo · Seguidores · Partidos */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.followingCount}</Text>
            <Text style={styles.statLabel}>Siguiendo</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.followersCount}</Text>
            <Text style={styles.statLabel}>Seguidores</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user.matchesPlayed}</Text>
            <Text style={styles.statLabel}>Partidos</Text>
          </View>
        </View>

        {/* Gráfico de rendimiento — próximamente */}
        <View style={styles.chartPlaceholder}>
          <Ionicons name="stats-chart-outline" size={28} color={colors.textMuted} />
          <Text style={styles.chartPlaceholderText}>Rendimiento de partidos</Text>
          <Text style={styles.chartPlaceholderSub}>Próximamente</Text>
        </View>

        {/* Menú de secciones */}
        <View style={styles.menuList}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon} size={18} color={colors.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      <Modal visible={editVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar perfil</Text>
            <TouchableOpacity onPress={() => setEditVisible(false)}>
              <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, padding: 20 }}>
            <Text style={styles.modalLabel}>Bio</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Cuéntanos sobre ti..."
              placeholderTextColor={colors.textMuted}
              value={editBio}
              onChangeText={setEditBio}
              multiline
              numberOfLines={3}
            />
            <Text style={styles.modalLabel}>Ubicación</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Lima, Perú"
              placeholderTextColor={colors.textMuted}
              value={editLocation}
              onChangeText={setEditLocation}
            />
            <TouchableOpacity
              onPress={() => setEditAvailable(v => !v)}
              style={[styles.availableToggle, editAvailable && styles.availableToggleOn]}
            >
              <Text style={{ color: editAvailable ? colors.success : colors.textSecondary, fontWeight: '600' }}>
                {editAvailable ? 'Disponible hoy ✓' : 'No disponible hoy'}
              </Text>
            </TouchableOpacity>
            <Button
              label="Guardar cambios"
              variant="primary"
              fullWidth
              size="lg"
              loading={saving}
              onPress={() => {
                if (!user) return;
                setSaving(true);
                usersApi.update(user.id, { bio: editBio || undefined, location: editLocation || undefined, available: editAvailable })
                  .then(() => refreshUser())
                  .then(() => { setEditVisible(false); Alert.alert('Perfil actualizado'); })
                  .catch(e => Alert.alert('Error', e.message))
                  .finally(() => setSaving(false));
              }}
              style={{ marginTop: 8 }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  headerBtn: { padding: 4 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  profileSection: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingTop: 20, paddingBottom: 16, gap: 14,
  },
  profileInfo: { flex: 1 },
  profileName: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  profileUsername: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  profileMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  profileMetaText: { color: colors.textMuted, fontSize: 12 },
  bio: { color: colors.textSecondary, fontSize: 14, paddingHorizontal: 18, marginBottom: 16, lineHeight: 20 },
  statsRow: {
    flexDirection: 'row', backgroundColor: colors.cardBg,
    marginHorizontal: 18, borderRadius: 14, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 20,
  },
  statCard: { flex: 1, alignItems: 'center', gap: 6 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border },
  statValue: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  statLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '500' },
  chartPlaceholder: {
    marginHorizontal: 18, marginBottom: 20,
    backgroundColor: colors.cardBg, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
    height: 120, alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  chartPlaceholderText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  chartPlaceholderSub: { color: colors.textMuted, fontSize: 12 },
  menuList: {
    marginHorizontal: 18, backgroundColor: colors.cardBg,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primary + '18',
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },
  modalHandle: { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  modalLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  modalInput: { backgroundColor: colors.secondary, borderRadius: 10, padding: 14, color: colors.textPrimary, fontSize: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border, textAlignVertical: 'top' },
  availableToggle: { borderRadius: 10, padding: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.secondary, alignItems: 'center', marginBottom: 20 },
  availableToggleOn: { borderColor: colors.success, backgroundColor: colors.success + '15' },
});

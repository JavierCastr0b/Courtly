import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User, Court } from '../types';
import { courtsApi } from '../api/courts';
import { colors } from '../theme/colors';
import { Avatar } from './Avatar';
import { Button } from './Button';

interface InviteModalProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onSend?: (data: InviteData) => void;
}

export interface InviteData {
  court: string;
  date: string;
  time: string;
  players: string;
  message: string;
}

const TIME_OPTIONS = ['6:00 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'];
const DATE_OPTIONS = ['Hoy', 'Mañana', 'Sábado', 'Domingo'];

export function InviteModal({ visible, user, onClose, onSend }: InviteModalProps) {
  const [selectedCourt, setSelectedCourt] = useState('');
  const [selectedDate, setSelectedDate] = useState('Hoy');
  const [selectedTime, setSelectedTime] = useState('7:00 PM');
  const [players, setPlayers] = useState('4');
  const [message, setMessage] = useState('');
  const [courts, setCourts] = useState<Court[]>([]);

  useEffect(() => {
    if (visible) courtsApi.getAll().then(setCourts).catch(() => {});
  }, [visible]);

  const handleSend = () => {
    onSend?.({ court: selectedCourt, date: selectedDate, time: selectedTime, players, message });
    onClose();
  };

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>Invitar a partido</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.userRow}>
            <Avatar name={user.name} size={44} />
            <View>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userLevel}>{user.level}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Seleccionar cancha</Text>
          {courts.map((court) => (
            <TouchableOpacity
              key={court.id}
              onPress={() => setSelectedCourt(court.id)}
              style={[styles.optionItem, selectedCourt === court.id && styles.optionSelected]}
            >
              <View style={styles.optionInner}>
                <Ionicons
                  name="tennisball-outline"
                  size={16}
                  color={selectedCourt === court.id ? colors.primary : colors.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionText, selectedCourt === court.id && styles.optionTextActive]}>
                    {court.name}
                  </Text>
                  <Text style={styles.optionSub}>{court.address}</Text>
                </View>
              </View>
              {selectedCourt === court.id && (
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionLabel}>Fecha</Text>
          <View style={styles.pillRow}>
            {DATE_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setSelectedDate(d)}
                style={[styles.pill, selectedDate === d && styles.pillActive]}
              >
                <Text style={[styles.pillText, selectedDate === d && styles.pillTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Hora</Text>
          <View style={styles.pillRow}>
            {TIME_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setSelectedTime(t)}
                style={[styles.pill, selectedTime === t && styles.pillActive]}
              >
                <Text style={[styles.pillText, selectedTime === t && styles.pillTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Número de jugadores</Text>
          <View style={styles.pillRow}>
            {['2', '4'].map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => setPlayers(n)}
                style={[styles.pill, players === n && styles.pillActive]}
              >
                <Text style={[styles.pillText, players === n && styles.pillTextActive]}>{n} jugadores</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Mensaje (opcional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="¡Ven a jugar con nosotros!"
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={3}
          />

          <Button
            label="Enviar invitación"
            variant="primary"
            fullWidth
            size="lg"
            onPress={handleSend}
            style={{ marginTop: 8, marginBottom: 32 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  userName: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  userLevel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  optionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  optionText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  optionSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  pillTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    padding: 14,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
});

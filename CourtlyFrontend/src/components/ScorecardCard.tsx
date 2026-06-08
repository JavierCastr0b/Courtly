import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ScorecardData {
  date: string;
  location: string;
  teamANames: string[];
  teamBNames: string[];
  sets: Array<{ a: number; b: number }>;
  winnerTeam: 'A' | 'B' | null;
}

type Props = ScorecardData;

export default function ScorecardCard({
  date, location, teamANames, teamBNames, sets, winnerTeam,
}: Props) {
  const setsWonA = sets.filter(s => s.a > s.b).length;
  const setsWonB = sets.filter(s => s.b > s.a).length;
  const aWon = winnerTeam === 'A' || (winnerTeam === null && setsWonA > setsWonB);

  const footerParts = [date, location, 'courtly.app'].filter(Boolean).join('  ·  ');

  return (
    <View style={styles.card}>

      {/* 1. Solo el texto Courtly, sin fondo */}
      <Text style={styles.appName}>Courtly</Text>

      {/* 2. Participantes + score de sets */}
      <View style={styles.pill}>
        <View style={styles.teamSide}>
          {aWon && <Ionicons name="trophy" size={11} color="#FFB800" />}
          {teamANames.map((n, i) => (
            <Text key={i} style={[styles.playerName, aWon && styles.playerNameWinner]} numberOfLines={1}>
              {n}
            </Text>
          ))}
        </View>

        <View style={styles.scoresCol}>
          <Text style={styles.setsScore}>
            <Text style={styles.setsNum}>{setsWonA}</Text>
            <Text style={styles.setsDash}> – </Text>
            <Text style={styles.setsNum}>{setsWonB}</Text>
          </Text>
        </View>

        <View style={[styles.teamSide, styles.teamSideRight]}>
          {!aWon && <Ionicons name="trophy" size={11} color="#FFB800" />}
          {teamBNames.map((n, i) => (
            <Text key={i} style={[styles.playerName, !aWon && styles.playerNameWinner]} numberOfLines={1}>
              {n}
            </Text>
          ))}
        </View>
      </View>

      {/* 3. Fecha · lugar · courtly.app — una sola línea */}
      <View style={styles.pill}>
        <Text style={styles.footerLine} numberOfLines={1}>{footerParts}</Text>
      </View>

    </View>
  );
}

const PILL_BG = 'rgba(0,0,0,0.40)';
const PILL_BORDER = 'rgba(255,255,255,0.07)';
const SHADOW = {
  textShadowColor: 'rgba(0,0,0,0.9)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
    width: 270,
    gap: 8,
    alignItems: 'center',
  },

  appName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    alignSelf: 'center',
    ...SHADOW,
  },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: PILL_BG,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: PILL_BORDER,
    gap: 8,
  },

  teamSide: {
    flex: 1,
    gap: 3,
  },
  teamSideRight: {
    alignItems: 'flex-end',
  },
  playerName: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 12,
    fontWeight: '700',
    ...SHADOW,
  },
  playerNameWinner: {
    color: '#FFFFFF',
  },

  scoresCol: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  setsScore: {
    fontSize: 32,
    fontWeight: '900',
    ...SHADOW,
  },
  setsNum: {
    color: '#FFFFFF',
  },
  setsDash: {
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '300',
    fontSize: 24,
  },

  footerLine: {
    flex: 1,
    color: 'rgba(255,255,255,0.50)',
    fontSize: 9,
    textAlign: 'center',
    letterSpacing: 0.3,
    ...SHADOW,
  },
});

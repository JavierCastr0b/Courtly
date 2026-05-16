export type Level = 'INICIACION' | 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO' | 'PROFESIONAL';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type DominantHand = 'DERECHA' | 'IZQUIERDA';
export type PreferredSide = 'REVES' | 'DRIVE';
export type PreferredFormat = 'SINGLES' | 'DOBLES';
export type PreferredStyle = 'COMPETITIVO' | 'CHILL';

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  level: Level;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  available: boolean;
  matchesPlayed: number;
  wins: number;
  dominantHand: DominantHand | null;
  preferredSide: PreferredSide | null;
  preferredFormat: PreferredFormat | null;
  preferredStyle: PreferredStyle | null;
  rating: number | null;
}

export interface Equipment {
  id: string;
  type: 'PALA' | 'ZAPATILLA';
  name: string | null;
  brand: string | null;
}

export interface UserActivity {
  id: string;
  date: string;
  durationMinutes: number;
  distanceKm: number;
  points: number;
}

export interface Court {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  surface: string | null;
  totalCourts: number;
}

export interface Match {
  id: string;
  court: Court | null;
  customLocation: string | null;
  organizer: User;
  date: string;
  time: string;
  level: Level;
  totalSpots: number;
  spotsLeft: number;
  description: string | null;
  participants: User[];
  winners: User[];
  teamA: User[];
  teamB: User[];
  teamAGuests: string[];
  teamBGuests: string[];
  resultRecorded: boolean;
  score: string | null;
  matchType: string | null;
  sportType: string | null;
}

export interface Post {
  id: string;
  user: User;
  title: string;
  description: string | null;
  location: string | null;
  level: Level | null;
  playersNeeded: number;
  date: string | null;
  time: string | null;
  likes: number;
  createdAt: string;
}

export interface Invitation {
  id: string;
  fromUser: User;
  toUser: User;
  court: Court | null;
  customLocation: string | null;
  date: string;
  time: string;
  message: string | null;
  status: InvitationStatus;
}

export interface Club {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  image: string | null;
  memberCount: number;
}

export interface AuthResponse {
  token: string;
  userId: string;
}

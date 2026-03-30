export type LevelType = 'Principiante' | 'Intermedio' | 'Avanzado';

export interface User {
  id: string;
  name: string;
  username: string;
  level: LevelType;
  avatar: string | null;
  initials: string;
  lastActive: string;
  available: boolean;
  matchesPlayed: number;
  wins: number;
  location: string;
  bio?: string;
  recentlyPlayedWith?: boolean;
}

export interface Court {
  id: string;
  name: string;
  address: string;
  distance: string;
  coordinates: { latitude: number; longitude: number };
  activeMatches: number;
  surface: string;
  courts: number;
}

export interface Match {
  id: string;
  court: Court;
  time: string;
  date: string;
  level: LevelType;
  spotsLeft: number;
  totalSpots: number;
  organizer: User;
}

export interface Post {
  id: string;
  user: User;
  title: string;
  location: string;
  level: LevelType;
  playersNeeded: number;
  time: string;
  date: string;
  description?: string;
  likes: number;
  createdAt: string;
}

export interface Invitation {
  id: string;
  fromUser: User;
  court: Court;
  time: string;
  date: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface Challenge {
  id: string;
  challenger: User;
  challenged: User;
  description: string;
  deadline: string;
  status: 'pending' | 'active' | 'completed';
  challenger_score?: string;
  challenged_score?: string;
}

export interface Club {
  id: string;
  name: string;
  members: number;
  description: string;
  location: string;
  joined: boolean;
  image?: string;
}

// ─── Current User ─────────────────────────────────────────────────────────────
export const currentUser: User = {
  id: '0',
  name: 'Javier Torres',
  username: 'javier_padel',
  level: 'Intermedio',
  avatar: null,
  initials: 'JT',
  lastActive: 'Ahora',
  available: true,
  matchesPlayed: 47,
  wins: 28,
  location: 'Miraflores, Lima',
  bio: 'Apasionado del pádel. Juego desde hace 3 años.',
};

// ─── Mock Users ────────────────────────────────────────────────────────────────
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Carlos Ruiz',
    username: 'carlos_r',
    level: 'Intermedio',
    avatar: null,
    initials: 'CR',
    lastActive: 'Jugó hace 2 días',
    available: true,
    matchesPlayed: 62,
    wins: 41,
    location: 'San Isidro, Lima',
    recentlyPlayedWith: true,
  },
  {
    id: '2',
    name: 'María López',
    username: 'maria_lp',
    level: 'Avanzado',
    avatar: null,
    initials: 'ML',
    lastActive: 'Jugó hace 1 hora',
    available: true,
    matchesPlayed: 128,
    wins: 89,
    location: 'Miraflores, Lima',
  },
  {
    id: '3',
    name: 'Diego Castillo',
    username: 'diego_c',
    level: 'Principiante',
    avatar: null,
    initials: 'DC',
    lastActive: 'Jugó hace 5 días',
    available: false,
    matchesPlayed: 14,
    wins: 6,
    location: 'Surco, Lima',
    recentlyPlayedWith: true,
  },
  {
    id: '4',
    name: 'Ana Flores',
    username: 'ana_flores',
    level: 'Intermedio',
    avatar: null,
    initials: 'AF',
    lastActive: 'Jugó ayer',
    available: true,
    matchesPlayed: 35,
    wins: 19,
    location: 'La Molina, Lima',
  },
  {
    id: '5',
    name: 'Roberto Silva',
    username: 'roberto_s',
    level: 'Avanzado',
    avatar: null,
    initials: 'RS',
    lastActive: 'Jugó hace 3 horas',
    available: false,
    matchesPlayed: 210,
    wins: 155,
    location: 'San Borja, Lima',
  },
  {
    id: '6',
    name: 'Lucía Mendoza',
    username: 'lucia_m',
    level: 'Principiante',
    avatar: null,
    initials: 'LM',
    lastActive: 'Jugó hace 1 semana',
    available: true,
    matchesPlayed: 8,
    wins: 3,
    location: 'Barranco, Lima',
    recentlyPlayedWith: true,
  },
  {
    id: '7',
    name: 'Nicolás Vargas',
    username: 'nicolas_v',
    level: 'Intermedio',
    avatar: null,
    initials: 'NV',
    lastActive: 'Jugó hace 4 días',
    available: false,
    matchesPlayed: 55,
    wins: 30,
    location: 'Lince, Lima',
  },
];

// ─── Mock Courts ──────────────────────────────────────────────────────────────
export const mockCourts: Court[] = [
  {
    id: '1',
    name: 'Padel Club Miraflores',
    address: 'Av. Larco 150, Miraflores',
    distance: '1.2 km',
    coordinates: { latitude: -12.1219, longitude: -77.0284 },
    activeMatches: 3,
    surface: 'Césped artificial',
    courts: 4,
  },
  {
    id: '2',
    name: 'Club San Isidro Padel',
    address: 'Av. Rivera Navarrete 890, San Isidro',
    distance: '2.8 km',
    coordinates: { latitude: -12.0975, longitude: -77.0362 },
    activeMatches: 2,
    surface: 'Cristal',
    courts: 6,
  },
  {
    id: '3',
    name: 'Surco Padel Center',
    address: 'Av. Tomás Marsano 2580, Surco',
    distance: '4.1 km',
    coordinates: { latitude: -12.1552, longitude: -76.9957 },
    activeMatches: 5,
    surface: 'Cemento',
    courts: 8,
  },
  {
    id: '4',
    name: 'La Molina Padel Club',
    address: 'Av. La Universidad 1480, La Molina',
    distance: '6.3 km',
    coordinates: { latitude: -12.0815, longitude: -76.9423 },
    activeMatches: 1,
    surface: 'Césped artificial',
    courts: 3,
  },
  {
    id: '5',
    name: 'Lima Padel Arena',
    address: 'Av. Javier Prado Este 100, San Borja',
    distance: '3.5 km',
    coordinates: { latitude: -12.0836, longitude: -77.0031 },
    activeMatches: 4,
    surface: 'Cristal',
    courts: 10,
  },
];

// ─── Mock Matches ─────────────────────────────────────────────────────────────
export const mockMatches: Match[] = [
  {
    id: '1',
    court: mockCourts[0],
    time: '7:00 PM',
    date: 'Hoy',
    level: 'Intermedio',
    spotsLeft: 2,
    totalSpots: 4,
    organizer: mockUsers[0],
  },
  {
    id: '2',
    court: mockCourts[0],
    time: '8:30 PM',
    date: 'Hoy',
    level: 'Avanzado',
    spotsLeft: 1,
    totalSpots: 4,
    organizer: mockUsers[1],
  },
  {
    id: '3',
    court: mockCourts[1],
    time: '6:00 PM',
    date: 'Hoy',
    level: 'Principiante',
    spotsLeft: 3,
    totalSpots: 4,
    organizer: mockUsers[2],
  },
  {
    id: '4',
    court: mockCourts[2],
    time: '9:00 AM',
    date: 'Mañana',
    level: 'Intermedio',
    spotsLeft: 2,
    totalSpots: 4,
    organizer: mockUsers[3],
  },
  {
    id: '5',
    court: mockCourts[4],
    time: '7:30 PM',
    date: 'Hoy',
    level: 'Avanzado',
    spotsLeft: 1,
    totalSpots: 4,
    organizer: mockUsers[4],
  },
  {
    id: '6',
    court: mockCourts[2],
    time: '6:30 PM',
    date: 'Hoy',
    level: 'Principiante',
    spotsLeft: 2,
    totalSpots: 4,
    organizer: mockUsers[5],
  },
  {
    id: '7',
    court: mockCourts[3],
    time: '8:00 PM',
    date: 'Mañana',
    level: 'Intermedio',
    spotsLeft: 3,
    totalSpots: 4,
    organizer: mockUsers[6],
  },
];

// ─── Mock Posts ───────────────────────────────────────────────────────────────
export const mockPosts: Post[] = [
  {
    id: '1',
    user: mockUsers[0],
    title: 'Busco partido en Surco hoy 7pm',
    location: 'Surco Padel Center',
    level: 'Intermedio',
    playersNeeded: 2,
    time: '7:00 PM',
    date: 'Hoy',
    description: 'Busco 2 jugadores para completar partido. Nivel intermedio requerido.',
    likes: 5,
    createdAt: 'Hace 30 min',
  },
  {
    id: '2',
    user: mockUsers[1],
    title: 'Partido amistoso mañana en Miraflores',
    location: 'Padel Club Miraflores',
    level: 'Avanzado',
    playersNeeded: 1,
    time: '6:00 PM',
    date: 'Mañana',
    description: 'Solo necesito un jugador más. Vengan con buenas vibras 🎾',
    likes: 12,
    createdAt: 'Hace 1 hora',
  },
  {
    id: '3',
    user: mockUsers[3],
    title: 'Principiantes bienvenidos - La Molina',
    location: 'La Molina Padel Club',
    level: 'Principiante',
    playersNeeded: 3,
    time: '9:00 AM',
    date: 'Sábado',
    description: 'Partido para principiantes, perfecto para aprender.',
    likes: 8,
    createdAt: 'Hace 2 horas',
  },
  {
    id: '4',
    user: mockUsers[4],
    title: 'Busco rival para duelo Lima Padel Arena',
    location: 'Lima Padel Arena',
    level: 'Avanzado',
    playersNeeded: 2,
    time: '8:00 PM',
    date: 'Hoy',
    description: 'Equipo de dos buscando rival del mismo nivel. ¡Aceptamos el reto!',
    likes: 23,
    createdAt: 'Hace 3 horas',
  },
  {
    id: '5',
    user: mockUsers[2],
    title: 'Partido relajado San Isidro esta tarde',
    location: 'Club San Isidro Padel',
    level: 'Principiante',
    playersNeeded: 2,
    time: '5:30 PM',
    date: 'Hoy',
    likes: 3,
    createdAt: 'Hace 4 horas',
  },
];

// ─── Mock Invitations ─────────────────────────────────────────────────────────
export const mockInvitations: Invitation[] = [
  {
    id: '1',
    fromUser: mockUsers[1],
    court: mockCourts[0],
    time: '7:00 PM',
    date: 'Mañana',
    message: '¡Te necesitamos en el equipo!',
    status: 'pending',
  },
  {
    id: '2',
    fromUser: mockUsers[3],
    court: mockCourts[2],
    time: '6:30 PM',
    date: 'Hoy',
    message: 'Partido tranquilo, sin presión',
    status: 'pending',
  },
];

// ─── Mock Challenges ──────────────────────────────────────────────────────────
export const mockChallenges: Challenge[] = [
  {
    id: '1',
    challenger: mockUsers[0],
    challenged: currentUser,
    description: 'Carlos vs Javier – quien gana más partidos esta semana',
    deadline: 'Domingo 31 Mar',
    status: 'active',
    challenger_score: '3',
    challenged_score: '2',
  },
  {
    id: '2',
    challenger: mockUsers[1],
    challenged: mockUsers[4],
    description: 'María vs Roberto – torneo relámpago',
    deadline: 'Sábado 30 Mar',
    status: 'pending',
  },
  {
    id: '3',
    challenger: currentUser,
    challenged: mockUsers[6],
    description: 'Javier vs Nicolás – duelo de intermedios',
    deadline: 'Viernes 4 Abr',
    status: 'pending',
  },
];

// ─── Mock Clubs ───────────────────────────────────────────────────────────────
export const mockClubs: Club[] = [
  {
    id: '1',
    name: 'Padel Lima Pro',
    members: 342,
    description: 'El club más activo de Lima. Torneos semanales y entrenamientos grupales.',
    location: 'Lima, Perú',
    joined: true,
  },
  {
    id: '2',
    name: 'Miraflores Padel Society',
    members: 156,
    description: 'Comunidad de jugadores de Miraflores. Todos los niveles bienvenidos.',
    location: 'Miraflores, Lima',
    joined: false,
  },
  {
    id: '3',
    name: 'Surco Padel Warriors',
    members: 89,
    description: 'Club competitivo de Surco. Enfocado en torneo y mejora constante.',
    location: 'Surco, Lima',
    joined: false,
  },
  {
    id: '4',
    name: 'Lima Ladies Padel',
    members: 201,
    description: 'Club femenino de pádel en Lima. Empoderando a las jugadoras.',
    location: 'Lima, Perú',
    joined: false,
  },
  {
    id: '5',
    name: 'Padel Beginners Lima',
    members: 127,
    description: 'Para quienes están comenzando en el pádel. ¡Aprende divirtiéndote!',
    location: 'Lima, Perú',
    joined: false,
  },
];

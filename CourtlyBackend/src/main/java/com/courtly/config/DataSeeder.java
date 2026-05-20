package com.courtly.config;

import com.courtly.entity.*;
import com.courtly.entity.Invitation.InvitationStatus;
import com.courtly.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CourtRepository courtRepository;
    private final MatchRepository matchRepository;
    private final PostRepository postRepository;
    private final ClubRepository clubRepository;
    private final EquipmentRepository equipmentRepository;
    private final RecommendationRepository recommendationRepository;
    private final InvitationRepository invitationRepository;
    private final PasswordEncoder passwordEncoder;

    private static final Random RNG = new Random(42);

    private static final String[] NOMBRES = {
        "Carlos", "María", "José", "Ana", "Luis", "Carmen", "Miguel", "Laura",
        "Francisco", "Elena", "Antonio", "Isabel", "Manuel", "Sofía", "Javier",
        "Lucía", "David", "Marta", "Pablo", "Sara", "Alejandro", "Cristina",
        "Daniel", "Patricia", "Jorge", "Valeria", "Sebastián", "Beatriz", "Diego",
        "Rosa", "Iván", "Camila", "Rodrigo", "Pilar", "Adrián", "Paola",
        "Fernando", "Natalia", "Eduardo", "Irene", "Roberto", "Silvia",
        "Renato", "Vanessa", "Marco", "Alicia", "Hugo", "Mónica", "Gonzalo",
        "Teresa", "Rafael", "Verónica", "Víctor", "Claudia", "Ángel", "Lorena",
        "Pedro", "Inés", "Emilio", "Carla", "Tomás", "Sandra", "Álvaro", "Gabriela"
    };

    private static final String[] APELLIDOS = {
        "García", "Martínez", "López", "Sánchez", "González", "Pérez",
        "Rodríguez", "Fernández", "Torres", "Ramírez", "Díaz", "Flores",
        "Moreno", "Jiménez", "Ruiz", "Hernández", "Vargas", "Navarro",
        "Castro", "Vidal", "Ortiz", "Ramos", "Muñoz", "Álvarez", "Romero",
        "Quispe", "Mamani", "Condori", "Huanca", "Ccopa", "Apaza", "Lazo",
        "Mendoza", "Delgado", "Castillo", "Santos", "Ríos", "Herrera",
        "Chávez", "Paredes", "Soto", "Iglesias", "Cano", "Vega", "Peña",
        "Cruz", "Salazar", "Campos", "Ortega", "Guerrero", "Fuentes",
        "Rojas", "Vera", "Pacheco", "Benites", "Ponce", "Cárdenas"
    };

    // Distritos de Lima con coordenadas reales (lat, lng)
    private static final Object[][] DISTRITOS = {
        { "Miraflores",         -12.1219, -77.0299 },
        { "San Isidro",         -12.0970, -77.0356 },
        { "Surco",              -12.1500, -76.9900 },
        { "La Molina",          -12.0849, -76.9453 },
        { "San Borja",          -12.1087, -76.9966 },
        { "Barranco",           -12.1444, -77.0211 },
        { "Chorrillos",         -12.1700, -77.0197 },
        { "Lince",              -12.0877, -77.0353 },
        { "Jesús María",        -12.0741, -77.0483 },
        { "Pueblo Libre",       -12.0766, -77.0639 },
        { "Magdalena del Mar",  -12.0900, -77.0718 },
        { "San Miguel",         -12.0769, -77.0840 },
        { "Los Olivos",         -11.9912, -77.0697 },
        { "Independencia",      -11.9920, -77.0504 },
        { "Ate",                -12.0219, -76.9245 },
        { "San Juan de Lurigancho", -11.9850, -77.0050 },
        { "Callao",             -12.0565, -77.1183 },
        { "Breña",              -12.0669, -77.0553 },
        { "La Victoria",        -12.0719, -77.0197 },
        { "Rímac",              -12.0250, -77.0331 },
        { "San Juan de Miraflores", -12.1574, -76.9697 },
        { "Villa El Salvador",  -12.2148, -76.9390 },
        { "Comas",              -11.9377, -77.0529 },
        { "Carabayllo",         -11.8898, -77.0286 },
    };

    // Canchas reales/verosímiles en Lima con coordenadas específicas
    private static final Object[][] COURTS_DATA = {
        { "Padel Lima Miraflores",         "Av. Larco 1234, Miraflores",          -12.1183, -77.0315, "Indoor",   "Césped artificial", 4 },
        { "Club Regatas Lima",             "Av. del Ejército 800, Miraflores",    -12.1267, -77.0253, "Outdoor",  "Césped artificial", 6 },
        { "Lima Pádel Club",               "Av. Benavides 580, Miraflores",       -12.1198, -77.0289, "Cubierta", "Moqueta",           3 },
        { "Padel San Isidro",              "Av. El Rosario 380, San Isidro",      -12.0982, -77.0374, "Indoor",   "Césped artificial", 4 },
        { "Club Tennis San Isidro",        "Av. Las Begonias 1200, San Isidro",   -12.0945, -77.0330, "Outdoor",  "Cristal",           5 },
        { "Wiracocha Pádel",               "Av. Caminos del Inca 555, Surco",     -12.1478, -76.9942, "Indoor",   "Césped artificial", 6 },
        { "Surco Padel Club",              "Av. El Derby 254, Surco",             -12.1512, -76.9875, "Cubierta", "Moqueta",           4 },
        { "La Molina Pádel",               "Av. La Fontana 890, La Molina",       -12.0867, -76.9512, "Outdoor",  "Césped artificial", 5 },
        { "Club La Molina",                "Av. Javier Prado Este 5200, La Molina", -12.0831, -76.9478, "Indoor",  "Cristal",           3 },
        { "San Borja Pádel",               "Av. San Borja Norte 450, San Borja",  -12.1095, -76.9980, "Indoor",   "Césped artificial", 4 },
        { "Barranco Padel & Sport",        "Av. Grau 320, Barranco",              -12.1452, -77.0198, "Outdoor",  "Césped artificial", 3 },
        { "Chorrillos Club de Pádel",      "Av. Defensores del Morro 800, Chorrillos", -12.1712, -77.0185, "Outdoor", "Césped artificial", 4 },
        { "Pádel Lince",                   "Av. Arequipa 2100, Lince",            -12.0891, -77.0341, "Indoor",   "Moqueta",           2 },
        { "Jesús María Pádel Center",      "Av. Brasil 2850, Jesús María",        -12.0755, -77.0471, "Cubierta", "Césped artificial", 4 },
        { "Pueblo Libre Pádel",            "Av. La Marina 2100, Pueblo Libre",    -12.0780, -77.0621, "Outdoor",  "Césped artificial", 3 },
        { "Magdalena Pádel Club",          "Jr. Leoncio Prado 480, Magdalena",    -12.0915, -77.0704, "Indoor",   "Cristal",           4 },
        { "San Miguel Sport Center",       "Av. La Paz 1100, San Miguel",         -12.0781, -77.0825, "Indoor",   "Césped artificial", 6 },
        { "Olympic Padel Los Olivos",      "Av. Alfredo Mendiola 3200, Los Olivos", -11.9925, -77.0701, "Cubierta", "Moqueta",          4 },
        { "Independencia Pádel",           "Av. Túpac Amaru 1800, Independencia", -11.9935, -77.0512, "Outdoor",  "Césped artificial", 3 },
        { "Ate Vitarte Pádel",             "Av. Nicolás Ayllón 2400, Ate",        -12.0231, -76.9270, "Outdoor",  "Césped artificial", 4 },
        { "SJL Pádel Park",                "Av. Próceres de la Independencia 1500, SJL", -11.9862, -77.0065, "Outdoor", "Césped artificial", 5 },
        { "Callao Padel Club",             "Av. Sáenz Peña 890, Callao",          -12.0578, -77.1195, "Indoor",   "Moqueta",           3 },
        { "Breña Pádel Center",            "Av. Arica 1200, Breña",               -12.0681, -77.0541, "Indoor",   "Césped artificial", 2 },
        { "La Victoria Pádel",             "Av. México 1450, La Victoria",        -12.0731, -77.0184, "Outdoor",  "Césped artificial", 3 },
        { "Rímac Sport & Pádel",           "Jr. Trujillo 890, Rímac",             -12.0268, -77.0318, "Outdoor",  "Césped artificial", 3 },
        { "SJM Padel Club",                "Av. San Juan 1200, San Juan de Miraflores", -12.1589, -76.9710, "Outdoor", "Césped artificial", 4 },
        { "VES Pádel",                     "Av. Revolución 450, Villa El Salvador", -12.2161, -76.9401, "Outdoor", "Césped artificial", 3 },
        { "Comas Pádel & Sport",           "Av. Universitaria Norte 4500, Comas", -11.9389, -77.0535, "Outdoor",  "Césped artificial", 4 },
        { "Miraflores Beach Padel",        "Malecón de la Reserva 610, Miraflores", -12.1235, -77.0312, "Outdoor", "Césped artificial", 3 },
        { "Golf Los Incas Pádel",          "Av. El Golf Los Incas, Surco",        -12.1105, -76.9750, "Indoor",   "Cristal",           5 },
        { "Club Terrazas Pádel",           "Av. Primavera 1650, Surco",           -12.1445, -76.9922, "Cubierta", "Moqueta",           4 },
        { "Asia Club Pádel",               "Av. Separadora Industrial, Ate",      -12.0198, -76.9222, "Outdoor",  "Césped artificial", 6 },
        { "La Planicie Pádel",             "Av. La Planicie 250, La Molina",      -12.0780, -76.9432, "Indoor",   "Césped artificial", 4 },
        { "Rinconada Pádel Club",          "Av. Rinconada del Lago, La Molina",   -12.0900, -76.9488, "Outdoor",  "Cristal",           3 },
        { "Centro Pádel Javier Prado",     "Av. Javier Prado Oeste 890, San Isidro", -12.0915, -77.0341, "Indoor", "Césped artificial", 5 },
        { "Pádel Surquillo",               "Av. Angamos Oeste 2300, Surquillo",   -12.1100, -77.0201, "Indoor",   "Moqueta",           3 },
        { "Higuereta Pádel",               "Av. Higuereta 450, Surco",            -12.1389, -76.9878, "Outdoor",  "Césped artificial", 4 },
        { "San Felipe Pádel",              "Av. San Felipe 890, Jesús María",     -12.0830, -77.0458, "Cubierta",  "Césped artificial", 3 },
        { "Flash Padel Monterrico",        "Av. Encalada 1200, Surco",            -12.1012, -76.9690, "Indoor",   "Cristal",           6 },
        { "Lima Golf Club Pádel",          "Av. Camino Real, San Isidro",         -12.0912, -77.0218, "Outdoor",  "Césped artificial", 4 },
    };

    private static final String[] TIPOS_PISTA = { "Indoor", "Outdoor", "Cubierta", "Mixta" };
    private static final String[] SUPERFICIES = { "Césped artificial", "Moqueta", "Cristal" };
    private static final String[] MANOS = { "DERECHA", "IZQUIERDA" };
    private static final String[] LADOS = { "REVES", "DRIVE", "AMBOS" };
    private static final String[] FORMATOS = { "SINGLES", "DOBLES", "AMBOS" };
    private static final String[] ESTILOS = { "COMPETITIVO", "CHILL" };
    private static final String[] SPORT_TYPES = { "PADEL", "TENIS" };
    private static final String[] MATCH_TYPES = { "SINGLES", "DOUBLES" };

    private static final String[] PALAS = {
        "Bullpadel Vertex 03", "Head Delta Pro", "Nox ML10 Pro", "Adidas Metalbone 3.3",
        "Wilson Bela Pro", "Dunlop Inferno Ultimate", "Babolat Technical Veron",
        "Prince Warrior Pro", "Artengo PR990", "NOX AT10 Luxury"
    };
    private static final String[] ZAPATILLAS = {
        "Asics Gel-Court Speed", "Nike Air Zoom Cage 4", "Adidas Barricade 13",
        "Wilson Rush Pro 4", "Head Sprint Pro 3.5", "Bullpadel Hack 22",
        "K-Swiss Express Light 3"
    };

    private static final String[] POST_TITLES = {
        "Busco compañero para partido esta tarde",
        "¿Alguien disponible para entrenar mañana?",
        "Partido de dobles este fin de semana",
        "Busco pareja para dobles mixtos",
        "¿Alguien de nivel intermedio disponible?",
        "Torneo informal este sábado",
        "Busco grupo de entrenamiento semanal",
        "Partido amistoso, buen ambiente",
        "¿Jugamos esta semana en Miraflores?",
        "Busco rivales para mejorar mi nivel",
        "Tengo cancha reservada, busco 3 jugadores",
        "¿Alguien para practicar el saque?",
        "Equipo busca 2 jugadores para torneo",
        "Sesión de pádel mañana por la mañana",
        "Buscamos nivel avanzado para partido serio",
        "Partido de práctica en San Isidro",
        "¿Alguien de Surco para jugar esta noche?",
        "Entrenamiento grupal, todos los niveles"
    };

    private static final String[] POST_DESCRIPTIONS = {
        "Nivel medio-alto. Escríbeme por privado.",
        "Somos 2, buscamos completar equipo. Buen ambiente garantizado.",
        "Venimos cada semana, buscamos nuevas caras.",
        "Apúntate si tienes ganas de jugar y mejorar.",
        "No importa el nivel, lo que importa es pasarla bien.",
        "Buscamos nivel competitivo, vengan preparados.",
        "Partido relajado después del trabajo.",
        "Preferiblemente nivel intermedio o superior.",
        "Primera vez en esta cancha, ¡vengan a conocerla!",
        "Jugamos para mejorar técnica y condición física.",
        "Ambiente tranquilo, somos gente de buen rollo.",
        "Cancha techada, no importa si llueve."
    };

    private static final String[] CLUB_NAMES = {
        "Lima Pádel Club", "Regatas Pádel", "Wiracocha Padel", "Los Cóndores",
        "Club Terrazas", "Inkari Pádel", "Flash Padel Lima", "Machu Padel",
        "Club Miraflores", "Team Los Incas", "Pádel Sur Lima", "Club San Isidro Pádel",
        "Los Ases del Pádel", "Surco Padel Club", "Molina Pádel", "Club La Victoria",
        "Pádel Passion Lima", "Red Masters Lima", "Zona Pádel Peru", "The Padel Academy Lima"
    };

    private static final String[] INVITE_MESSAGES = {
        "¿Jugamos esta tarde?", "Te reto a un partido", "Tengo cancha reservada",
        "¿Revancha?", "¡Vamos a darle con todo!", "¿Te apuntas mañana?",
        "Vi tu perfil, me parece buen nivel", null, null
    };

    private static final Level[] LEVELS = Level.values();

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Base de datos ya tiene datos, omitiendo seed.");
            return;
        }

        log.info("Iniciando seed de base de datos (Lima, Perú)...");
        String pwd = passwordEncoder.encode("courtly123");

        List<User> users = createUsers(1000, pwd);
        log.info("  {} usuarios creados", users.size());

        List<Court> courts = createCourts();
        log.info("  {} canchas creadas", courts.size());

        createClubs(20, users);
        log.info("  20 clubes creados");

        createMatches(500, users, courts);
        log.info("  500 partidos creados");

        createPosts(600, users);
        log.info("  600 posts creados");

        createEquipment(users);
        log.info("  equipamiento creado");

        createFollows(users);
        log.info("  relaciones de seguimiento creadas");

        createRecommendations(500, users);
        log.info("  500 recomendaciones creadas");

        createInvitations(300, users, courts);
        log.info("  300 invitaciones creadas");

        log.info("Seed completado exitosamente.");
    }

    private List<User> createUsers(int count, String hashedPwd) {
        List<User> list = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            String nombre = pick(NOMBRES);
            String apellido = pick(APELLIDOS);
            String base = normalize(nombre + apellido);
            String username = base + i;

            int played = RNG.nextInt(300);
            int wins = played == 0 ? 0 : RNG.nextInt(played + 1);
            double rating = Math.round((1.0 + RNG.nextDouble() * 4.0) * 10.0) / 10.0;
            Object[] distrito = DISTRITOS[RNG.nextInt(DISTRITOS.length)];

            list.add(User.builder()
                .name(nombre + " " + apellido)
                .username(username)
                .email(username + "@courtly.pe")
                .password(hashedPwd)
                .level(pick(LEVELS))
                .location((String) distrito[0] + ", Lima")
                .dominantHand(pick(MANOS))
                .preferredSide(pick(LADOS))
                .preferredFormat(pick(FORMATOS))
                .preferredStyle(pick(ESTILOS))
                .available(RNG.nextBoolean())
                .matchesPlayed(played)
                .wins(wins)
                .rating(rating)
                .build());
        }
        return userRepository.saveAll(list);
    }

    // COURTS_DATA formato: { nombre, dirección, lat, lng, tipo, superficie, totalCanchas }
    private List<Court> createCourts() {
        List<Court> list = new ArrayList<>();
        for (Object[] d : COURTS_DATA) {
            Court c = new Court();
            c.setName((String) d[0]);
            c.setAddress((String) d[1]);
            c.setLatitude((double) d[2]);
            c.setLongitude((double) d[3]);
            c.setCourtType((String) d[4]);
            c.setSurface((String) d[5]);
            c.setTotalCourts((int) d[6]);
            list.add(c);
        }
        return courtRepository.saveAll(list);
    }

    private void createClubs(int count, List<User> users) {
        List<Club> list = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            Object[] distrito = DISTRITOS[RNG.nextInt(DISTRITOS.length)];
            String distNombre = (String) distrito[0];
            Set<User> members = new HashSet<>();
            int memberCount = 15 + RNG.nextInt(35);
            while (members.size() < memberCount) {
                members.add(users.get(RNG.nextInt(users.size())));
            }
            list.add(Club.builder()
                .name(CLUB_NAMES[i % CLUB_NAMES.length])
                .description("Club de pádel con excelentes instalaciones en " + distNombre + ", Lima. ¡Únete!")
                .location(distNombre + ", Lima")
                .members(members)
                .build());
        }
        clubRepository.saveAll(list);
    }

    private void createMatches(int count, List<User> users, List<Court> courts) {
        List<Match> list = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            User organizer = users.get(RNG.nextInt(users.size()));
            Court court = courts.get(RNG.nextInt(courts.size()));
            int totalSpots = RNG.nextBoolean() ? 2 : 4;

            Set<User> participants = new HashSet<>();
            participants.add(organizer);
            int extra = RNG.nextInt(totalSpots);
            for (int j = 0; j < extra; j++) {
                participants.add(users.get(RNG.nextInt(users.size())));
            }

            list.add(Match.builder()
                .organizer(organizer)
                .court(court)
                .sportType(pick(SPORT_TYPES))
                .matchType(pick(MATCH_TYPES))
                .description(pick(POST_DESCRIPTIONS))
                .date(LocalDate.now().plusDays(RNG.nextInt(60) - 20))
                .time(LocalTime.of(7 + RNG.nextInt(13), RNG.nextBoolean() ? 0 : 30))
                .level(pick(LEVELS))
                .totalSpots(totalSpots)
                .participants(participants)
                .build());
        }
        matchRepository.saveAll(list);
    }

    private void createPosts(int count, List<User> users) {
        List<Post> list = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            User author = users.get(RNG.nextInt(users.size()));
            Object[] distrito = DISTRITOS[RNG.nextInt(DISTRITOS.length)];

            Set<User> likedBy = new HashSet<>();
            int likesCount = RNG.nextInt(30);
            while (likedBy.size() < likesCount) {
                likedBy.add(users.get(RNG.nextInt(users.size())));
            }

            list.add(Post.builder()
                .user(author)
                .title(pick(POST_TITLES))
                .description(pick(POST_DESCRIPTIONS))
                .location((String) distrito[0] + ", Lima")
                .level(pick(LEVELS))
                .playersNeeded(1 + RNG.nextInt(3))
                .date(LocalDate.now().plusDays(RNG.nextInt(30)))
                .time(LocalTime.of(7 + RNG.nextInt(13), RNG.nextBoolean() ? 0 : 30))
                .likedBy(likedBy)
                .build());
        }
        postRepository.saveAll(list);
    }

    private void createEquipment(List<User> users) {
        List<Equipment> list = new ArrayList<>(users.size() * 2);
        for (User u : users) {
            Equipment pala = new Equipment();
            pala.setUser(u);
            pala.setType("PALA");
            String palaNombre = pick(PALAS);
            pala.setName(palaNombre);
            pala.setBrand(palaNombre.split(" ")[0]);
            list.add(pala);

            if (RNG.nextBoolean()) {
                Equipment shoe = new Equipment();
                shoe.setUser(u);
                shoe.setType("ZAPATILLA");
                String shoeName = pick(ZAPATILLAS);
                shoe.setName(shoeName);
                shoe.setBrand(shoeName.split(" ")[0]);
                list.add(shoe);
            }
        }
        equipmentRepository.saveAll(list);
    }

    private void createFollows(List<User> users) {
        for (User u : users) {
            int followCount = RNG.nextInt(25);
            Set<User> following = new HashSet<>();
            while (following.size() < followCount) {
                User candidate = users.get(RNG.nextInt(users.size()));
                if (!candidate.getId().equals(u.getId())) {
                    following.add(candidate);
                }
            }
            u.setFollowing(following);
        }
        userRepository.saveAll(users);
    }

    private void createRecommendations(int count, List<User> users) {
        List<Recommendation> list = new ArrayList<>(count);
        Set<String> pairs = new HashSet<>();
        int attempts = 0;
        while (list.size() < count && attempts < count * 5) {
            attempts++;
            User from = users.get(RNG.nextInt(users.size()));
            User to = users.get(RNG.nextInt(users.size()));
            String key = from.getId() + ":" + to.getId();
            if (from.getId().equals(to.getId()) || pairs.contains(key)) continue;
            pairs.add(key);
            Recommendation r = new Recommendation();
            r.setFromUser(from);
            r.setToUser(to);
            r.setStars(1 + RNG.nextInt(5));
            list.add(r);
        }
        recommendationRepository.saveAll(list);
    }

    private void createInvitations(int count, List<User> users, List<Court> courts) {
        List<Invitation> list = new ArrayList<>(count);
        InvitationStatus[] statuses = InvitationStatus.values();
        for (int i = 0; i < count; i++) {
            User from = users.get(RNG.nextInt(users.size()));
            User to = users.get(RNG.nextInt(users.size()));
            if (from.getId().equals(to.getId())) continue;

            Invitation inv = new Invitation();
            inv.setFromUser(from);
            inv.setToUser(to);
            inv.setCourt(RNG.nextBoolean() ? courts.get(RNG.nextInt(courts.size())) : null);
            inv.setDate(LocalDate.now().plusDays(RNG.nextInt(30)));
            inv.setTime(LocalTime.of(7 + RNG.nextInt(13), RNG.nextBoolean() ? 0 : 30));
            inv.setMessage(pick(INVITE_MESSAGES));
            inv.setStatus(pick(statuses));
            list.add(inv);
        }
        invitationRepository.saveAll(list);
    }

    private <T> T pick(T[] arr) {
        return arr[RNG.nextInt(arr.length)];
    }

    private String normalize(String s) {
        return s.toLowerCase()
            .replace("á", "a").replace("é", "e").replace("í", "i")
            .replace("ó", "o").replace("ú", "u").replace("ñ", "n")
            .replace(" ", "");
    }
}

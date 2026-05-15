package com.courtly.config;

import com.courtly.entity.*;
import com.courtly.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataLoader implements ApplicationRunner {

    private final UserRepository userRepository;
    private final CourtRepository courtRepository;
    private final MatchRepository matchRepository;
    private final PostRepository postRepository;
    private final InvitationRepository invitationRepository;
    private final ClubRepository clubRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) return;

        var encoder = new BCryptPasswordEncoder();
        String pass = encoder.encode("courtly123");

        // ── Users ────────────────────────────────────────────────
        User carlos = userRepository.save(User.builder()
                .name("Carlos Mendoza").username("carlosmendoza").email("carlos@courtly.app")
                .password(pass).level(Level.TERCERA).available(true)
                .bio("Jugador de pádel desde hace 5 años. Siempre buscando un buen partido.").location("Miraflores, Lima")
                .matchesPlayed(34).wins(18).build());

        User valeria = userRepository.save(User.builder()
                .name("Valeria Torres").username("valeriat").email("valeria@courtly.app")
                .password(pass).level(Level.CUARTA).available(true)
                .bio("Apasionada del pádel. Entreno 3 veces por semana 🎾").location("San Isidro, Lima")
                .matchesPlayed(52).wins(29).build());

        User diego = userRepository.save(User.builder()
                .name("Diego Ríos").username("diegorios").email("diego@courtly.app")
                .password(pass).level(Level.SEGUNDA).available(false)
                .bio("Principiante con muchas ganas de mejorar.").location("Surco, Lima")
                .matchesPlayed(8).wins(2).build());

        User sofia = userRepository.save(User.builder()
                .name("Sofía Vargas").username("sofiavargas").email("sofia@courtly.app")
                .password(pass).level(Level.QUINTA).available(true)
                .bio("Competidora regional. Busco equipo para torneos.").location("La Molina, Lima")
                .matchesPlayed(87).wins(61).build());

        User andres = userRepository.save(User.builder()
                .name("Andrés Castro").username("andrescastro").email("andres@courtly.app")
                .password(pass).level(Level.PRIMERA).available(true)
                .bio("¡Recién empezando! Cualquier nivel bienvenido.").location("Barranco, Lima")
                .matchesPlayed(3).wins(0).build());

        User luciana = userRepository.save(User.builder()
                .name("Luciana Paredes").username("luciparedes").email("luciana@courtly.app")
                .password(pass).level(Level.SEXTA).available(true)
                .bio("Top 10 ranking Lima. Busco rivales a la altura 💪").location("San Borja, Lima")
                .matchesPlayed(143).wins(118).build());

        // ── Follow relationships ──────────────────────────────────
        carlos.getFollowing().addAll(List.of(valeria, sofia, luciana));
        valeria.getFollowing().addAll(List.of(carlos, sofia));
        diego.getFollowing().addAll(List.of(carlos, valeria));
        andres.getFollowing().addAll(List.of(carlos, valeria, sofia, luciana));
        userRepository.saveAll(List.of(carlos, valeria, diego, andres));

        // ── Courts ───────────────────────────────────────────────
        Court courtSanIsidro = courtRepository.save(Court.builder()
                .name("Lima Padel Club").address("Av. Javier Prado Este 1234, San Isidro")
                .latitude(-12.0920).longitude(-77.0270).surface("Cristal").totalCourts(6).build());

        Court courtMiraflores = courtRepository.save(Court.builder()
                .name("Miraflores Padel").address("Av. Armendáriz 445, Miraflores")
                .latitude(-12.1250).longitude(-77.0300).surface("Césped artificial").totalCourts(4).build());

        Court courtLaMolina = courtRepository.save(Court.builder()
                .name("La Molina Padel Center").address("Av. La Fontana 350, La Molina")
                .latitude(-12.0850).longitude(-76.9400).surface("Cristal").totalCourts(8).build());

        Court courtSurco = courtRepository.save(Court.builder()
                .name("Surco Sport Club").address("Av. Primavera 980, Santiago de Surco")
                .latitude(-12.1340).longitude(-76.9990).surface("Cemento").totalCourts(3).build());

        // ── Matches ───────────────────────────────────────────────
        LocalDate today = LocalDate.now();

        Match match1 = matchRepository.save(Match.builder()
                .court(courtSanIsidro).sportType("DOBLES").organizer(carlos)
                .date(today).time(LocalTime.of(19, 0))
                .level(Level.TERCERA).totalSpots(4).description("Partido amistoso, nivel medio. ¡Vengan!")
                .build());
        match1.getParticipants().addAll(List.of(carlos, valeria));
        matchRepository.save(match1);

        Match match2 = matchRepository.save(Match.builder()
                .court(courtMiraflores).sportType("SINGLES").organizer(sofia)
                .date(today).time(LocalTime.of(8, 0))
                .level(Level.QUINTA).totalSpots(2).description("Singles competitivo, solo nivel 5ta o 6ta.")
                .build());
        match2.getParticipants().add(sofia);
        matchRepository.save(match2);

        Match match3 = matchRepository.save(Match.builder()
                .court(courtLaMolina).sportType("DOBLES").organizer(valeria)
                .date(today.plusDays(1)).time(LocalTime.of(18, 30))
                .level(Level.CUARTA).totalSpots(4).description("Buscamos dos jugadores más para mañana.")
                .build());
        match3.getParticipants().addAll(List.of(valeria, andres));
        matchRepository.save(match3);

        Match match4 = matchRepository.save(Match.builder()
                .court(courtSurco).sportType("DOBLES").organizer(luciana)
                .date(today.plusDays(2)).time(LocalTime.of(7, 0))
                .level(Level.SEXTA).totalSpots(4).description("Entrenamiento de alto nivel. Solo 6ta.")
                .build());
        match4.getParticipants().addAll(List.of(luciana, sofia));
        matchRepository.save(match4);

        Match match5 = matchRepository.save(Match.builder()
                .court(courtMiraflores).sportType("DOBLES").organizer(andres)
                .date(today.plusDays(3)).time(LocalTime.of(20, 0))
                .level(Level.PRIMERA).totalSpots(4).description("Partido para principiantes. ¡Todos bienvenidos!")
                .build());
        match5.getParticipants().add(andres);
        matchRepository.save(match5);

        Match match6 = matchRepository.save(Match.builder()
                .customLocation("Club Privado Los Cóndores, Chacarilla").sportType("SINGLES")
                .organizer(diego).date(today.plusDays(1)).time(LocalTime.of(12, 0))
                .level(Level.SEGUNDA).totalSpots(2).description("Singles relajado, nivel bajo, sin presión.")
                .build());
        match6.getParticipants().add(diego);
        matchRepository.save(match6);

        // ── Posts ─────────────────────────────────────────────────
        Post post1 = postRepository.save(Post.builder()
                .user(luciana).title("¡Torneo de pádel en La Molina este sábado! 🏆")
                .description("Se buscan parejas para el torneo relámpago del sábado. Inscripciones hasta el viernes. Premios para los 3 primeros puestos.")
                .location("La Molina Padel Center").level(Level.QUINTA).playersNeeded(4)
                .date(today.plusDays(5)).build());
        post1.getLikedBy().addAll(List.of(carlos, valeria, andres));
        postRepository.save(post1);

        Post post2 = postRepository.save(Post.builder()
                .user(valeria).title("Busco compañera de dobles para liga femenina")
                .description("Juego nivel 4ta, entreno martes y jueves en Miraflores. Si estás interesada, escríbeme.")
                .level(Level.CUARTA).build());
        post2.getLikedBy().addAll(List.of(carlos, sofia));
        postRepository.save(post2);

        Post post3 = postRepository.save(Post.builder()
                .user(carlos).title("Recomendación: Lima Padel Club tiene nuevas canchas 🙌")
                .description("Estrenaron 2 canchas panorámicas en San Isidro. La iluminación es increíble para jugar de noche. Totalmente recomendado.")
                .location("Lima Padel Club").build());
        post3.getLikedBy().addAll(List.of(valeria, diego, sofia, andres, luciana));
        postRepository.save(post3);

        Post post4 = postRepository.save(Post.builder()
                .user(andres).title("¡Primer punto ganado en partido real! 🎉")
                .description("Después de 3 semanas practicando, hoy gané mi primer punto en un partido. Pequeño logro pero muy feliz. ¡Gracias a todos los que me enseñaron!")
                .level(Level.PRIMERA).build());
        post4.getLikedBy().addAll(List.of(carlos, valeria));
        postRepository.save(post4);

        // ── Clubs ─────────────────────────────────────────────────
        Club club1 = Club.builder()
                .name("Lima Padel Warriors").description("Comunidad de jugadores competitivos de Lima. Organizamos torneos mensuales y entrenamientos grupales.")
                .location("Lima, Perú").build();
        club1.getMembers().addAll(List.of(luciana, sofia, valeria, carlos));
        clubRepository.save(club1);

        Club club2 = Club.builder()
                .name("Padel para Todos").description("Club inclusivo para jugadores de todos los niveles. Bienvenidos principiantes y avanzados.")
                .location("Miraflores, Lima").build();
        club2.getMembers().addAll(List.of(andres, diego, carlos));
        clubRepository.save(club2);

        // ── Invitations ───────────────────────────────────────────
        invitationRepository.save(Invitation.builder()
                .fromUser(valeria).toUser(carlos).court(courtSanIsidro)
                .date(today.plusDays(1)).time(LocalTime.of(19, 30))
                .message("¡Carlos! ¿Juegas mañana conmigo y Diego? Nos falta uno para dobles.")
                .status(Invitation.InvitationStatus.PENDING).build());

        invitationRepository.save(Invitation.builder()
                .fromUser(sofia).toUser(carlos).customLocation("Club Los Cóndores, Chacarilla")
                .date(today.plusDays(2)).time(LocalTime.of(8, 0))
                .message("Partido de práctica el domingo. ¡Anímate!")
                .status(Invitation.InvitationStatus.PENDING).build());
    }
}

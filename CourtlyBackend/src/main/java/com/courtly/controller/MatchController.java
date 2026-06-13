package com.courtly.controller;

import com.courtly.dto.request.CreateMatchRequest;
import com.courtly.entity.Level;
import com.courtly.entity.Match;
import com.courtly.entity.User;
import com.courtly.repository.CourtRepository;
import com.courtly.repository.MatchRepository;
import com.courtly.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchRepository matchRepository;
    private final CourtRepository courtRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<Match> getAll(@RequestParam(required = false) String courtId,
                              @RequestParam(required = false) Level level,
                              @RequestParam(required = false) LocalDate date,
                              @RequestParam(defaultValue = "50") int size) {
        if (courtId != null && level != null) return matchRepository.findByCourtIdAndLevel(courtId, level);
        if (courtId != null) return matchRepository.findByCourtId(courtId);
        if (level != null) return matchRepository.findByLevel(level);
        if (date != null) return matchRepository.findByDate(date);
        return matchRepository.findByDateGreaterThanEqual(LocalDate.now(), PageRequest.of(0, Math.min(size, 100)));
    }

    @GetMapping("/friends")
    public List<Match> getFriendMatches(@AuthenticationPrincipal User user) {
        List<User> friends = userRepository.findMutualFriends(user.getId());
        if (friends.isEmpty()) return List.of();
        List<String> friendIds = friends.stream().map(User::getId).toList();
        return matchRepository.findActiveFriendMatches(friendIds, LocalDate.now());
    }

    @GetMapping("/following")
    public List<Match> getFollowingMatches(@AuthenticationPrincipal User user) {
        List<String> followingIds = userRepository.findFollowingIds(user.getId());
        if (followingIds.isEmpty()) return List.of();
        return matchRepository.findActiveFollowingMatches(followingIds, LocalDate.now());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Match> getById(@PathVariable String id) {
        return matchRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private static final List<Level> LEVEL_ORDER = List.of(
            Level.INICIACION, Level.PRINCIPIANTE, Level.INTERMEDIO, Level.AVANZADO, Level.PROFESIONAL);

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateMatchRequest req,
                                        @AuthenticationPrincipal User user) {
        var court = req.getCourtId() != null
                ? courtRepository.findById(req.getCourtId()).orElse(null)
                : null;

        // Enforce 2-hour gap between same-day matches for the organizer
        List<Match> sameDayForOrganizer = matchRepository.findActiveByParticipantAndDate(user.getId(), req.getDate());
        for (Match existing : sameDayForOrganizer) {
            long diffMinutes = Math.abs(ChronoUnit.MINUTES.between(req.getTime(), existing.getTime()));
            if (diffMinutes < 120) {
                String existingTimeStr = existing.getTime().format(DateTimeFormatter.ofPattern("HH:mm"));
                return ResponseEntity.status(409)
                        .body(Map.of("error", "Tienes un partido a las " + existingTimeStr + " ese día. Debes dejar al menos 2 horas entre partidos."));
            }
        }

        Set<Level> requestedLevels = (req.getLevels() != null && !req.getLevels().isEmpty())
                ? req.getLevels()
                : Set.of(Level.INICIACION);

        Level primaryLevel = LEVEL_ORDER.stream()
                .filter(requestedLevels::contains)
                .findFirst()
                .orElse(null);

        Match match = Match.builder()
                .court(court)
                .sportType(req.getSportType())
                .matchType(req.getMatchType())
                .customLocation(req.getCustomLocation())
                .organizer(user)
                .date(req.getDate())
                .time(req.getTime())
                .level(primaryLevel)
                .totalSpots(req.getTotalSpots())
                .description(req.getDescription())
                .build();
        match.getParticipants().add(user);
        match.getLevels().addAll(requestedLevels);
        return ResponseEntity.ok(matchRepository.save(match));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<?> join(@PathVariable String id,
                                  @RequestBody(required = false) Map<String, String> body,
                                  @AuthenticationPrincipal User user) {
        Match match = matchRepository.findById(id).orElseThrow();
        if (match.getSpotsLeft() <= 0)
            return ResponseEntity.badRequest().body(Map.of("error", "No hay lugares disponibles"));
        Set<Level> matchLevels = match.getLevels();
        if (!matchLevels.isEmpty()) {
            if (!matchLevels.contains(user.getLevel()))
                return ResponseEntity.status(403).body(Map.of("error", "Este partido no está disponible para tu categoría actual"));
        } else if (match.getLevel() != null && user.getLevel() != match.getLevel()) {
            return ResponseEntity.status(403).body(Map.of("error", "Este partido no está disponible para tu categoría actual"));
        }

        // Enforce 2-hour gap between same-day matches
        List<Match> sameDayMatches = matchRepository.findActiveByParticipantAndDate(user.getId(), match.getDate());
        for (Match existing : sameDayMatches) {
            if (existing.getId().equals(id)) continue;
            long diffMinutes = Math.abs(ChronoUnit.MINUTES.between(match.getTime(), existing.getTime()));
            if (diffMinutes < 120) {
                String existingTimeStr = existing.getTime().format(DateTimeFormatter.ofPattern("HH:mm"));
                return ResponseEntity.status(409)
                        .body(Map.of("error", "Tienes un partido a las " + existingTimeStr + " ese día. Debes dejar al menos 2 horas entre partidos."));
            }
        }

        match.getParticipants().add(user);
        String team = body != null ? body.get("team") : null;
        if ("A".equals(team)) match.getTeamA().add(user);
        else if ("B".equals(team)) match.getTeamB().add(user);

        // guest brought by this user
        String guestName = body != null ? body.get("guestName") : null;
        if (guestName != null && !guestName.isBlank()) {
            if (match.getSpotsLeft() > 0) {
                if ("B".equals(team)) match.getTeamBGuests().add(guestName.trim());
                else match.getTeamAGuests().add(guestName.trim());
            }
        }

        return ResponseEntity.ok(matchRepository.save(match));
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<Void> leave(@PathVariable String id,
                                      @AuthenticationPrincipal User user) {
        Match match = matchRepository.findById(id).orElseThrow();
        if (match.isResultRecorded())
            return ResponseEntity.badRequest().build();
        match.getParticipants().remove(user);
        match.getTeamA().remove(user);
        match.getTeamB().remove(user);
        matchRepository.save(match);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id,
                                       @AuthenticationPrincipal User user) {
        Match match = matchRepository.findById(id).orElseThrow();
        if (!match.getOrganizer().getId().equals(user.getId()))
            return ResponseEntity.status(403).build();
        if (match.isResultRecorded())
            return ResponseEntity.badRequest().build();
        matchRepository.delete(match);
        return ResponseEntity.noContent().build();
    }

    // Organizer picks their own team after creating the match
    @PostMapping("/{id}/my-team")
    public ResponseEntity<?> setMyTeam(@PathVariable String id,
                                       @RequestBody Map<String, String> body,
                                       @AuthenticationPrincipal User user) {
        Match match = matchRepository.findById(id).orElseThrow();
        if (!match.getParticipants().stream().anyMatch(p -> p.getId().equals(user.getId())))
            return ResponseEntity.status(403).build();
        match.getTeamA().remove(user);
        match.getTeamB().remove(user);
        String team = body.get("team");
        if ("A".equals(team)) match.getTeamA().add(user);
        else if ("B".equals(team)) match.getTeamB().add(user);
        return ResponseEntity.ok(matchRepository.save(match));
    }

    @PatchMapping("/{id}/result")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> recordResult(@PathVariable String id,
                                          @RequestBody Map<String, Object> body,
                                          @AuthenticationPrincipal User current) {
        Match match = matchRepository.findById(id).orElseThrow();
        if (!match.getOrganizer().getId().equals(current.getId()))
            return ResponseEntity.status(403).build();
        if (match.isResultRecorded())
            return ResponseEntity.badRequest().body(Map.of("error", "El resultado ya fue registrado"));

        // Build score string from sets
        List<Map<String, Integer>> sets = body.containsKey("sets")
                ? (List<Map<String, Integer>>) body.get("sets")
                : List.of();
        String score = sets.stream()
                .map(s -> s.getOrDefault("a", 0) + "-" + s.getOrDefault("b", 0))
                .collect(Collectors.joining(" "));
        if (score.isBlank() && body.containsKey("score"))
            score = (String) body.get("score");
        match.setScore(score.isBlank() ? null : score);

        // Determine winners — must be a NEW set, not the same collection object as teamA/teamB
        String winningTeam = (String) body.get("winningTeam");
        Set<User> winners;
        if ("A".equals(winningTeam)) {
            winners = new HashSet<>(match.getTeamA());
        } else if ("B".equals(winningTeam)) {
            winners = new HashSet<>(match.getTeamB());
        } else {
            // fallback: explicit winnerIds
            List<String> winnerIds = body.containsKey("winnerIds")
                    ? (List<String>) body.get("winnerIds")
                    : List.of();
            winners = match.getParticipants().stream()
                    .filter(p -> winnerIds.contains(p.getId()))
                    .collect(Collectors.toSet());
        }

        match.setWinners(winners);
        match.setResultRecorded(true);

        Set<String> winnerIds = winners.stream().map(User::getId).collect(Collectors.toSet());
        List<String> participantIds = match.getParticipants().stream().map(User::getId).toList();
        List<User> participantUsers = userRepository.findAllById(participantIds);
        for (User u : participantUsers) {
            u.setMatchesPlayed(u.getMatchesPlayed() + 1);
            if (winnerIds.contains(u.getId())) u.setWins(u.getWins() + 1);
        }
        userRepository.saveAll(participantUsers);

        return ResponseEntity.ok(matchRepository.save(match));
    }
}
